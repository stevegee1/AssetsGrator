import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { polygonAmoy } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

/**
 * POST /api/kyc/webhook
 * Receives Persona webhook events and writes verified users on-chain.
 *
 * Setup in Persona dashboard:
 *   Webhook URL: https://yourdomain.com/api/kyc/webhook
 *   Events: inquiry.completed, inquiry.approved
 *
 * Required env vars:
 *   PERSONA_WEBHOOK_SECRET   — from Persona dashboard → Webhooks
 *   KYC_SIGNER_PRIVATE_KEY  — wallet that owns KYCRegistry (deployer key, no 0x prefix)
 *   NEXT_PUBLIC_KYC_REGISTRY — KYCRegistry contract address
 *   POLYGON_AMOY_RPC_URL     — Alchemy RPC
 */

const KYC_ABI = parseAbi([
  "function addVerifiedUser(address user, string calldata countryCode) external",
  "function isVerified(address user) external view returns (bool)",
]);

// Verify Persona webhook signature
async function verifySignature(
  req: NextRequest,
  rawBody: string,
): Promise<boolean> {
  const secret = process.env.PERSONA_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev if not set

  const signature = req.headers.get("persona-signature");
  if (!signature) return false;

  // Persona uses HMAC-SHA256: t=timestamp,v1=hash
  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=")),
  );
  const signedPayload = `${parts.t}.${rawBody}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload),
  );
  const computed = Buffer.from(sig).toString("hex");
  return computed === parts.v1;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify signature
  const valid = await verifySignature(req, rawBody);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process completed/approved inquiries
  const eventName = payload.name as string;
  if (!["inquiry.completed", "inquiry.approved"].includes(eventName)) {
    return NextResponse.json({ skipped: true, event: eventName });
  }

  // Extract wallet address & country from Persona inquiry fields
  const data = payload.data as Record<string, unknown>;
  const attributes = (data?.attributes ?? {}) as Record<string, unknown>;
  const fields = (attributes?.fields ?? {}) as Record<
    string,
    { value: string }
  >;

  const walletAddress =
    fields?.wallet_address?.value ?? (attributes?.["reference-id"] as string);
  const countryCode = (fields?.["address-country-code"]?.value ?? "US")
    .toUpperCase()
    .slice(0, 2);

  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    return NextResponse.json(
      { error: "No valid wallet address in inquiry" },
      { status: 422 },
    );
  }

  // Set up viem wallet client
  const privateKey = process.env.KYC_SIGNER_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json(
      { error: "KYC signer not configured" },
      { status: 500 },
    );
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  const kycRegistryAddress = process.env
    .NEXT_PUBLIC_KYC_REGISTRY as `0x${string}`;
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;

  const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: polygonAmoy,
    transport: http(rpcUrl),
  });

  // Check if already verified
  const alreadyVerified = await publicClient.readContract({
    address: kycRegistryAddress,
    abi: KYC_ABI,
    functionName: "isVerified",
    args: [walletAddress as `0x${string}`],
  });

  if (alreadyVerified) {
    return NextResponse.json({
      status: "already_verified",
      wallet: walletAddress,
    });
  }

  // Write on-chain
  const txHash = await walletClient.writeContract({
    address: kycRegistryAddress,
    abi: KYC_ABI,
    functionName: "addVerifiedUser",
    args: [walletAddress as `0x${string}`, countryCode],
  });

  console.log(
    `[KYC] Verified ${walletAddress} (${countryCode}) — tx: ${txHash}`,
  );

  return NextResponse.json({
    status: "verified",
    wallet: walletAddress,
    country: countryCode,
    tx: txHash,
  });
}
