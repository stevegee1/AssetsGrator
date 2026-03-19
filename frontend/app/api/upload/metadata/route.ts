import { NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;

/**
 * POST /api/upload/metadata
 * Accepts JSON body with property metadata object.
 * Pins JSON to IPFS via Pinata, returns { cid, ipfsUrl }
 *
 * Body shape:
 * {
 *   name, description, address, documents: string[], images: string[], videos: string[],
 *   attributes: { trait_type, value }[]
 * }
 */
export async function POST(req: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json(
      { error: "PINATA_JWT not configured" },
      { status: 500 },
    );
  }

  try {
    const metadata = await req.json();

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: {
          ...metadata,
          schema: "AssetsGrator/v1",
          timestamp: new Date().toISOString(),
        },
        pinataMetadata: {
          name: `${metadata.name ?? "property"}-metadata.json`,
        },
        pinataOptions: { cidVersion: 1 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Pinata error: ${err}` },
        { status: res.status },
      );
    }

    const { IpfsHash: cid } = await res.json();
    return NextResponse.json({ cid, ipfsUrl: `ipfs://${cid}` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
