import { NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// ─── 30-second ISR cache ─────────────────────────────────────────────────────
// Next.js caches the route handler response on the edge for 30 s.
// Stale-while-revalidate means users always get fast responses.
export const revalidate = 30;

// ─── Curated UK Wave-1 token allowlist ───────────────────────────────────────
// Add new token addresses here after deploying additional assets.
// These are filtered from getAllAssets() to exclude test/staging deployments.
const UK_TOKENS: Address[] = [
  '0x1D907Ca5EaaD0b9C4fc239F27ae1787a1eac594E', // Mayfair Luxury Apartment
  '0x9B9b170c102E857B590d75bDE2870b7685A66639', // Canary Wharf Office Tower
  '0xE36D2fC1FcB5fE15a34d346505cd2479ee0304C8', // Kensington Townhouse
  '0xBE2D80f4E3C6A75F274144885B8aa96f5187b381', // Manchester City Centre Flats
  '0xcd6282474fA015458529AcE05B2C87e454Ebe9bA', // Edinburgh Old Town Tenement
  '0xA320558201019344E84c02e18C992929F2AFCcf2', // Birmingham Retail Park
  '0x49e2C9121e47da67f1AeE1931A33f6b7215c3ff0', // Bristol Harbourside Penthouse
  '0xa0aDedb752eA55b26858C21efe2546ef27264225', // Leeds Industrial Warehouse
  '0x6864934b8275d0430d3C19142C8c922E47237C56', // Oxford Student Quarter
  '0x379A84E4A2aE8D9c9926440fDBd1Fb3c7253181D', // Surrey Country Estate
];

// ─── Minimal ABI ─────────────────────────────────────────────────────────────
// Only includes the 3 functions used in the multicall batch.
// When you add new fields to AssetMetadata in the contract:
//   1. recompile → npm run extract-abis (updates lib/contracts/abis.ts)
//   2. Add the new component here to receive it in the batch
const MULTICALL_ABI = [
  {
    inputs: [],
    name: 'assetMetadata',
    outputs: [
      {
        components: [
          { name: 'name',            type: 'string'  },
          { name: 'symbol',          type: 'string'  },
          { name: 'ipfsCID',         type: 'string'  },
          { name: 'location',        type: 'string'  },
          { name: 'category',        type: 'uint8'   },
          { name: 'assetSubType',    type: 'string'  },
          { name: 'totalSupply',     type: 'uint256' },
          { name: 'pricePerUnit',    type: 'uint256' },
          { name: 'valuationUSD',    type: 'uint256' },
          { name: 'createdAt',       type: 'uint256' },
          { name: 'capacityKW',      type: 'uint256' },
          { name: 'annualYieldMWh',  type: 'uint256' },
          { name: 'ppaContractCID',  type: 'string'  },
          { name: 'ppaTermYears',    type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetStatus',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ─── Category taxonomy ────────────────────────────────────────────────────────
// On-chain AssetCategory enum (update if you add new enum values):
//   0 = REAL_ESTATE · 1 = LAND · 2 = RENEWABLE_ENERGY
//   3 = INFRASTRUCTURE · 4 = COMMODITIES · 5 = OTHER
export type MainCategory = 'real-estate' | 'renewable-energy' | 'other';

function deriveMainCategory(cat: number): MainCategory {
  if ([0, 1, 3].includes(cat)) return 'real-estate';
  if ([2, 4].includes(cat))    return 'renewable-energy';
  return 'other';
}

// Maps raw on-chain assetSubType strings → clean display subcategory.
// This is the SINGLE place to update when new subcategories are needed.
function normalizeSubType(raw: string, cat: number): string {
  const s = (raw ?? '').toLowerCase();

  if (cat === 1) return 'Land';            // on-chain LAND category → always Land

  if (deriveMainCategory(cat) === 'real-estate') {
    if (s.includes('apartment') || s.includes('flat') || s.includes('penthouse') ||
        s.includes('townhouse') || s.includes('tenement') || s.includes('residential') ||
        s.includes('quarter')   || s.includes('student'))                return 'Residential';
    if (s.includes('office') || s.includes('retail') || s.includes('commercial') ||
        s.includes('business'))                                           return 'Commercial';
    if (s.includes('industrial') || s.includes('warehouse') ||
        s.includes('logistics'))                                          return 'Industrial';
    if (s.includes('land')  || s.includes('estate') || s.includes('country') ||
        s.includes('rural') || s.includes('agricultural') ||
        s.includes('farm'))                                               return 'Land';
    if (s.includes('mixed'))                                              return 'Mixed-Use';
    return 'Residential';
  }

  // Renewable Energy subcategories
  if (s.includes('carbon'))                              return 'Carbon Credits';
  if (s.includes('rec') || s.includes('certificate'))   return 'REC';
  if (s.includes('solar') || s.includes('pv'))          return 'Solar';
  if (s.includes('wind'))                               return 'Wind';
  if (s.includes('hydrogen'))                           return 'Green Hydrogen';
  if (s.includes('hydro') || s.includes('water'))       return 'Hydroelectricity';
  if (s.includes('bio')   || s.includes('methane'))     return 'Biomethane';
  if (s.includes('geothermal'))                         return 'Geothermal';
  if (s.includes('compressed') || s.includes('caes'))   return 'CAES';
  if (cat === 4) return 'Carbon Credits';  // on-chain COMMODITIES → carbon
  return 'Solar';
}

// ─── Curated cover images (keyed by IPFS CID prefix) ─────────────────────────
const CURATED_IMAGES: Record<string, string> = {
  QmMayfairLuxuryApartmen:  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  QmCanaryWharfOfficeTower: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  QmKensingtonTownhouseVic: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  QmManchesterCityCentreFl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  QmEdinburghOldTownTeneme: 'https://images.unsplash.com/photo-1600596542815-ffad4c153b09?w=800&q=80',
  QmBirminghamRetailParkBu: 'https://images.unsplash.com/photo-1554435493-93422e8220c8?w=800&q=80',
  QmBristolHarboursidePent: 'https://images.unsplash.com/photo-1600607687939-ce8a6d79a41a?w=800&q=80',
  QmLeedsIndustrialWarehou: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
  QmOxfordStudentQuarterCo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  QmSurreyCountryEstateGui: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
};

function resolveImage(cid: string, address: string): string {
  const key = Object.keys(CURATED_IMAGES).find(k => cid?.startsWith(k));
  return key
    ? CURATED_IMAGES[key]
    : `https://picsum.photos/seed/${address.slice(2, 8)}/400/220`;
}

// ─── Viem public client ───────────────────────────────────────────────────────
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
  ),
});

// ─── Public type exported for frontend consumption ────────────────────────────
export interface AssetListItem {
  address:        string;
  name:           string;
  location:       string;
  category:       number;
  mainCategory:   MainCategory;
  subType:        string;
  rawSubType:     string;
  valuationUSD:   string;   // bigint serialised as decimal string
  pricePerUnit:   string;
  totalSupply:    string;
  ipfsCID:        string;
  ppaContractCID: string;
  capacityKW:     number;
  annualYieldMWh: number;
  createdAt:      number;
  status:         number;   // 0=Pending 1=Active 2=Paused 3=Closed
  imageUrl:       string;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const contracts = UK_TOKENS.flatMap(address => ([
      { address, abi: MULTICALL_ABI, functionName: 'assetMetadata' as const },
      { address, abi: MULTICALL_ABI, functionName: 'assetStatus'   as const },
      { address, abi: MULTICALL_ABI, functionName: 'totalSupply'   as const },
    ]));

    const results = await client.multicall({ contracts, allowFailure: true });

    const assets: AssetListItem[] = UK_TOKENS.flatMap((address, i) => {
      const base         = i * 3;
      const metaResult   = results[base];
      const statusResult = results[base + 1];
      const supplyResult = results[base + 2];

      if (metaResult.status !== 'success' || !metaResult.result) return [];

      const m          = metaResult.result as any;
      const categoryNum = Number(m.category);

      return [{
        address,
        name:           m.name,
        location:       m.location,
        category:       categoryNum,
        mainCategory:   deriveMainCategory(categoryNum),
        subType:        normalizeSubType(m.assetSubType, categoryNum),
        rawSubType:     m.assetSubType,
        valuationUSD:   m.valuationUSD.toString(),
        pricePerUnit:   m.pricePerUnit.toString(),
        totalSupply:    supplyResult.status === 'success'
                          ? (supplyResult.result as bigint).toString()
                          : m.totalSupply.toString(),
        ipfsCID:        m.ipfsCID,
        ppaContractCID: m.ppaContractCID,
        capacityKW:     Number(m.capacityKW),
        annualYieldMWh: Number(m.annualYieldMWh),
        createdAt:      Number(m.createdAt),
        status:         statusResult.status === 'success' ? Number(statusResult.result) : 0,
        imageUrl:       resolveImage(m.ipfsCID, address),
      }];
    });

    return NextResponse.json(assets, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });

  } catch (err: any) {
    console.error('[/api/assets] multicall error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}
