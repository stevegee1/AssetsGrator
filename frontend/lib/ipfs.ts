/**
 * ipfs.ts — IPFS / Pinata utilities for AssetsGrator
 *
 * Schema version: 2.0 — extended with media gallery and document manifest.
 *
 * When you upload asset metadata via the Admin panel, use AssetMetadataJson v2.
 * Existing wave-1 tokens may only have the v1 shape; the UI must gracefully
 * fall back (no media/documents arrays → show curated images + on-chain links).
 *
 * IPFS CID stored on-chain → points to this JSON → media/docs served via gateway.
 */

const PINATA_JWT = process.env.PINATA_JWT;

/**
 * Dedicated Pinata gateway — set NEXT_PUBLIC_PINATA_GATEWAY in .env.local to your
 * project's dedicated gateway URL (e.g. https://yourproject.mypinata.cloud).
 * Falls back to the public gateway for development. In production, always use a
 * dedicated gateway for speed and reliability.
 */
export const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? 'https://gateway.pinata.cloud';

// ─── Media types ──────────────────────────────────────────────────────────────

/** A single item in an asset's scrollable media gallery. */
export interface AssetMedia {
  type:       'image' | 'video' | 'document';
  cid:        string;           // IPFS CID of this file
  title:      string;           // Display label (e.g. "Front view", "Site walkthrough")
  mimeType?:  string;           // 'image/jpeg' | 'video/mp4' | 'application/pdf'
  thumbnail?: string;           // Optional thumbnail CID (for video items)
}

/** A formal legal or compliance document attached to the asset. */
export interface AssetDocument {
  title:       string;
  cid:         string;
  docType:     'deed' | 'licence' | 'ppa' | 'appraisal' |
               'certificate' | 'planning' | 'report' | 'other';
  issuedBy?:   string;   // Issuing authority / solicitor firm
  issuedDate?: string;   // ISO date string
}

// ─── Full metadata schema (v2) ────────────────────────────────────────────────

/**
 * AssetMetadataJson — the JSON document stored on IPFS and pointed to by the
 * on-chain `ipfsCID` field in AssetMetadata.
 *
 * Compatible with ERC-721 / ERC-1155 metadata conventions so it works in
 * standard blockchain explorers, while extending with RWA-specific fields.
 */
export interface AssetMetadataJson {
  // ── ERC-721 compatible core ─────────────────────────────────────────────────
  name:          string;
  description:   string;
  /** Primary cover image — ipfs://CID or full https URL */
  image:         string;
  external_url?: string;

  // ── AssetsGrator RWA properties ─────────────────────────────────────────────
  properties: {
    location:      string;
    mainCategory:  'real-estate' | 'renewable-energy';
    subCategory:   string;       // e.g. 'Residential', 'Solar', 'Carbon Credits'
    assetSubType:  string;       // Raw value as stored on-chain
    annualYieldBps: number;      // Annual yield in basis points (e.g. 650 = 6.5%)
    capacityKW?:   number;       // [Energy only] Installed capacity
    ppaTermYears?: number;       // [Energy only] PPA term
    legalDocCID?:  string;       // Primary legal doc IPFS CID
  };

  // ── Media gallery ───────────────────────────────────────────────────────────
  /**
   * Ordered list of media items shown in the asset's gallery tab.
   * First 'image' item is used as the hero if `image` field is missing.
   */
  media?: AssetMedia[];

  // ── Document manifest ───────────────────────────────────────────────────────
  /**
   * Legal and compliance documents shown in the Documents tab.
   * Includes title deeds, generation licences, appraisals, planning consent.
   */
  documents?: AssetDocument[];
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

/** Convert an IPFS CID or ipfs:// URI to a gateway URL. */
export function ipfsToUrl(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  const clean = cid.replace('ipfs://', '').replace(/^\/ipfs\//, '');
  return `${IPFS_GATEWAY}/ipfs/${clean}`;
}

/**
 * Fetch and parse an asset's IPFS metadata JSON.
 * Returns null on any error; callers must handle gracefully.
 * Uses a 5-second timeout to avoid blocking the UI.
 */
export async function fetchIpfsMeta(cid: string): Promise<AssetMetadataJson | null> {
  if (!cid) return null;
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(ipfsToUrl(cid), { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json() as AssetMetadataJson;
  } catch {
    return null;
  }
}

// ─── Document type helpers ────────────────────────────────────────────────────

export const DOC_TYPE_LABELS: Record<AssetDocument['docType'], string> = {
  deed:        'Title Deed',
  licence:     'Generation Licence',
  ppa:         'Power Purchase Agreement',
  appraisal:   'RICS Appraisal',
  certificate: 'Certificate',
  planning:    'Planning Permission',
  report:      'Due Diligence Report',
  other:       'Document',
};

export const DOC_TYPE_ICONS: Record<AssetDocument['docType'], string> = {
  deed:        '📜',
  licence:     '⚡',
  ppa:         '📋',
  appraisal:   '🏛️',
  certificate: '✅',
  planning:    '🗺️',
  report:      '📊',
  other:       '📄',
};

// ─── Upload utilities (server-side / API route only) ─────────────────────────

/**
 * Upload a file to IPFS via Pinata.
 * Must only be called server-side — PINATA_JWT is a server secret.
 * Returns the IPFS CID (IpfsHash).
 */
export async function uploadFileToPinata(file: File | Blob, name: string): Promise<string> {
  if (!PINATA_JWT) throw new Error('PINATA_JWT not set');

  const formData = new FormData();
  formData.append('file', file, name);
  formData.append('pinataMetadata', JSON.stringify({ name }));
  formData.append('pinataOptions',  JSON.stringify({ cidVersion: 1 }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method:  'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body:    formData,
  });

  if (!res.ok) throw new Error(`Pinata upload failed: ${res.status} ${await res.text()}`);
  return (await res.json()).IpfsHash as string;
}

/**
 * Upload AssetMetadataJson to IPFS via Pinata.
 * Returns the IPFS CID to store on-chain as `ipfsCID`.
 */
export async function uploadAssetMetadata(
  metadata: AssetMetadataJson,
  name: string,
): Promise<string> {
  if (!PINATA_JWT) throw new Error('PINATA_JWT not set');

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PINATA_JWT}` },
    body:    JSON.stringify({ pinataMetadata: { name }, pinataContent: metadata }),
  });

  if (!res.ok) throw new Error(`Pinata JSON upload failed: ${res.status} ${await res.text()}`);
  return (await res.json()).IpfsHash as string;
}

// ─── Legacy export alias ──────────────────────────────────────────────────────
/** @deprecated Use uploadAssetMetadata instead */
export const uploadJsonToPinata = uploadAssetMetadata;
