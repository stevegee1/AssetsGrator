/**
 * ipfs.ts — IPFS / Pinata upload utilities for asset metadata and legal documents
 *
 * Used by:
 * - Admin panel: upload asset cover images and legal docs before deployAsset()
 * - Asset pages: resolve ipfsCID to gateway URL for display
 */

const PINATA_JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? 'https://gateway.pinata.cloud';

export interface AssetMetadataJson {
  name: string;
  description: string;
  image: string;         // ipfs:// or https:// URL to cover image
  properties: {
    location: string;
    assetSubType: string;
    annualYieldBps: number;
    capacityKW?: number;
    legalDocCID?: string;  // IPFS CID of legal document
  };
}

/** Convert an IPFS CID to a gateway URL */
export function ipfsToUrl(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  const clean = cid.replace('ipfs://', '');
  return `${GATEWAY}/ipfs/${clean}`;
}

/**
 * Upload a file to IPFS via Pinata.
 * Used server-side or via API route — PINATA_JWT is a server secret.
 * Returns the IPFS CID.
 */
export async function uploadFileToPinata(
  file: File | Blob,
  name: string,
): Promise<string> {
  if (!PINATA_JWT) throw new Error('PINATA_JWT not set');

  const formData = new FormData();
  formData.append('file', file, name);
  formData.append(
    'pinataMetadata',
    JSON.stringify({ name }),
  );
  formData.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1 }),
  );

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash as string;
}

/**
 * Upload JSON metadata to IPFS via Pinata.
 * Returns the IPFS CID.
 */
export async function uploadJsonToPinata(
  metadata: AssetMetadataJson,
  name: string,
): Promise<string> {
  if (!PINATA_JWT) throw new Error('PINATA_JWT not set');

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: metadata,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata JSON upload failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash as string;
}
