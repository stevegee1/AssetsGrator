import { NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "https://gateway.pinata.cloud";

/**
 * POST /api/upload
 * Accepts multipart/form-data with:
 *   - file: File (any binary)
 *   - name: string (optional display name)
 *
 * Returns: { cid, ipfsUrl, gatewayUrl }
 */
export async function POST(req: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json(
      { error: "PINATA_JWT not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) ?? file?.name ?? "upload";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Forward directly to Pinata Files API
    const pinataForm = new FormData();
    pinataForm.append("file", file, name);
    pinataForm.append("pinataMetadata", JSON.stringify({ name }));
    pinataForm.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: pinataForm,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Pinata error: ${err}` },
        { status: res.status },
      );
    }

    const { IpfsHash: cid } = await res.json();
    return NextResponse.json({
      cid,
      ipfsUrl: `ipfs://${cid}`,
      gatewayUrl: `${PINATA_GATEWAY}/ipfs/${cid}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
