// Mock data additions for governance and KYC
// Append to existing mock-data.ts exports

// ---- Types ----
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  type: PropertyType;
  status: PropertyStatus;
  image: string;
  totalValue: number;
  tokenPrice: number;
  totalSupply: number;
  tokensSold: number;
  monthlyRent: number;
  annualYield: number;
  managementFee: number; // percent (e.g. 10 = 10%)
  sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  securityTokenAddress?: string;
  documents: { name: string; hash: string }[];
}

export type PropertyType =
  | "apartment"
  | "office"
  | "villa"
  | "commercial"
  | "land";
export type PropertyStatus = "active" | "sold_out" | "coming_soon";

export interface Holding {
  propertyId: string;
  property: Property;
  tokens: number;
  investedUsdc: number;
  currentValue: number;
  claimable: number;
}

export interface Distribution {
  id: string;
  date: string;
  grossRent: number;
  netToInvestors: number;
  yourShare: number;
  claimed: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: "active" | "passed" | "rejected" | "pending";
  votesFor: number;
  votesAgainst: number;
  totalVotingPower: number;
  endDate: string;
}

// ---- Helper functions ----
export const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
export const fmtTokens = (n: number) => n.toLocaleString("en");
export const fundingPct = (p: Property) =>
  Math.min(100, Math.round((p.tokensSold / p.totalSupply) * 100));

// ---- Mock Properties ----
export const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    name: "Mayfair Luxury Apartment",
    address: "Park Lane, Mayfair",
    city: "London",
    country: "United Kingdom",
    type: "apartment",
    status: "active",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    totalValue: 5_000_000,
    tokenPrice: 50,
    totalSupply: 100_000,
    tokensSold: 61_000,
    monthlyRent: 32_000,
    annualYield: 7.7,
    managementFee: 8,
    sqm: 220,
    bedrooms: 3,
    bathrooms: 2,
    securityTokenAddress: '0x1D907Ca5EaaD0b9C4fc239F27ae1787a1eac594E',
    documents: [
      { name: "Title Deed",       hash: "QmMayfairTitleDeedParkLaneLondonW1K2024" },
      { name: "Valuation Report", hash: "QmMayfairValuationReportLondon2024RWA" },
    ],
  },
  {
    id: "2",
    name: "Canary Wharf Office Tower",
    address: "One Canada Square",
    city: "London",
    country: "United Kingdom",
    type: "office",
    status: "active",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    totalValue: 6_000_000,
    tokenPrice: 30,
    totalSupply: 200_000,
    tokensSold: 142_000,
    monthlyRent: 45_000,
    annualYield: 9.0,
    managementFee: 10,
    sqm: 3_500,
    securityTokenAddress: '0x9B9b170c102E857B590d75bDE2870b7685A66639',
    documents: [
      { name: "Head Lease",       hash: "QmCanaryWharfHeadLeaseE14London2024uk" },
      { name: "Survey",           hash: "QmCanaryWharfSurveyDocumentE14RWA" },
    ],
  },
  {
    id: "3",
    name: "Kensington Townhouse",
    address: "Victoria Road, Kensington",
    city: "London",
    country: "United Kingdom",
    type: "villa",
    status: "active",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    totalValue: 2_000_000,
    tokenPrice: 40,
    totalSupply: 50_000,
    tokensSold: 28_500,
    monthlyRent: 14_500,
    annualYield: 8.7,
    managementFee: 8,
    sqm: 280,
    bedrooms: 4,
    bathrooms: 3,
    securityTokenAddress: '0xE36D2fC1FcB5fE15a34d346505cd2479ee0304C8',
    documents: [
      { name: "Freehold Title",   hash: "QmKensingtonTownhouseFreeholdW8London" },
    ],
  },
  {
    id: "4",
    name: "Manchester City Centre Flats",
    address: "Deansgate",
    city: "Manchester",
    country: "United Kingdom",
    type: "apartment",
    status: "active",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    totalValue: 1_500_000,
    tokenPrice: 10,
    totalSupply: 150_000,
    tokensSold: 95_000,
    monthlyRent: 10_500,
    annualYield: 8.4,
    managementFee: 9,
    sqm: 180,
    bedrooms: 2,
    bathrooms: 1,
    securityTokenAddress: '0xBE2D80f4E3C6A75F274144885B8aa96f5187b381',
    documents: [
      { name: "Leasehold Title",  hash: "QmManchesterFlatsDeansgate M3Leasehold" },
    ],
  },
  {
    id: "5",
    name: "Edinburgh Old Town Tenement",
    address: "Royal Mile",
    city: "Edinburgh",
    country: "United Kingdom",
    type: "apartment",
    status: "active",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c153b09?w=800&q=80",
    totalValue: 1_200_000,
    tokenPrice: 15,
    totalSupply: 80_000,
    tokensSold: 44_000,
    monthlyRent: 8_800,
    annualYield: 8.8,
    managementFee: 8,
    sqm: 140,
    bedrooms: 2,
    bathrooms: 1,
    securityTokenAddress: '0xcd6282474fA015458529AcE05B2C87e454Ebe9bA',
    documents: [
      { name: "Sasine Title",     hash: "QmEdinburghTenementRoyalMileEH1Sasine" },
    ],
  },
  {
    id: "6",
    name: "Birmingham Retail Park",
    address: "Bullring, Birmingham",
    city: "Birmingham",
    country: "United Kingdom",
    type: "commercial",
    status: "active",
    image: "https://images.unsplash.com/photo-1554435493-93422e8220c8?w=800&q=80",
    totalValue: 2_500_000,
    tokenPrice: 25,
    totalSupply: 100_000,
    tokensSold: 67_000,
    monthlyRent: 18_500,
    annualYield: 8.9,
    managementFee: 10,
    sqm: 4_200,
    securityTokenAddress: '0xA320558201019344E84c02e18C992929F2AFCcf2',
    documents: [
      { name: "Commercial Lease", hash: "QmBirminghamRetailParkBullringB5Lease" },
    ],
  },
  {
    id: "7",
    name: "Bristol Harbourside Penthouse",
    address: "Harbourside",
    city: "Bristol",
    country: "United Kingdom",
    type: "villa",
    status: "coming_soon",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6d79a41a?w=800&q=80",
    totalValue: 1_400_000,
    tokenPrice: 35,
    totalSupply: 40_000,
    tokensSold: 0,
    monthlyRent: 10_200,
    annualYield: 8.7,
    managementFee: 8,
    sqm: 190,
    bedrooms: 3,
    bathrooms: 2,
    securityTokenAddress: '0x49e2C9121e47da67f1AeE1931A33f6b7215c3ff0',
    documents: [
      { name: "Freehold Deed",    hash: "QmBristolHarboursidePenthouseBS1UK" },
    ],
  },
  {
    id: "8",
    name: "Leeds Industrial Warehouse",
    address: "White Rose Park",
    city: "Leeds",
    country: "United Kingdom",
    type: "commercial",
    status: "active",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
    totalValue: 1_200_000,
    tokenPrice: 20,
    totalSupply: 60_000,
    tokensSold: 39_000,
    monthlyRent: 9_600,
    annualYield: 9.6,
    managementFee: 7,
    sqm: 8_000,
    securityTokenAddress: '0xa0aDedb752eA55b26858C21efe2546ef27264225',
    documents: [
      { name: "Industrial Lease", hash: "QmLeedsIndustrialWarehouseLS11WhiteRose" },
    ],
  },
  {
    id: "9",
    name: "Oxford Student Quarter",
    address: "Cowley Road",
    city: "Oxford",
    country: "United Kingdom",
    type: "apartment",
    status: "active",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    totalValue: 960_000,
    tokenPrice: 8,
    totalSupply: 120_000,
    tokensSold: 88_000,
    monthlyRent: 7_200,
    annualYield: 9.0,
    managementFee: 8,
    sqm: 320,
    bedrooms: 4,
    bathrooms: 2,
    securityTokenAddress: '0x6864934b8275d0430d3C19142C8c922E47237C56',
    documents: [
      { name: "Leasehold Title",  hash: "QmOxfordStudentQuarterCowleyRdOX4UK" },
    ],
  },
  {
    id: "10",
    name: "Surrey Country Estate",
    address: "Guildford Road",
    city: "Surrey",
    country: "United Kingdom",
    type: "land",
    status: "coming_soon",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    totalValue: 3_000_000,
    tokenPrice: 60,
    totalSupply: 50_000,
    tokensSold: 0,
    monthlyRent: 0,
    annualYield: 0,
    managementFee: 5,
    sqm: 120_000,
    securityTokenAddress: '0x379A84E4A2aE8D9c9926440fDBd1Fb3c7253181D',
    documents: [
      { name: "Freehold Title",   hash: "QmSurreyCountryEstateGuildfordGU2UK" },
    ],
  },
];

// ---- Mock Portfolio ----

export const MOCK_PORTFOLIO: Holding[] = [
  {
    propertyId: "1",
    property: MOCK_PROPERTIES[0],
    tokens: 2_000,
    investedUsdc: 10_000,
    currentValue: 10_400,
    claimable: 54,
  },
  {
    propertyId: "2",
    property: MOCK_PROPERTIES[1],
    tokens: 500,
    investedUsdc: 4_250,
    currentValue: 4_575,
    claimable: 29,
  },
];

// ---- Mock Distributions ----
export const MOCK_DISTRIBUTIONS: Distribution[] = [
  {
    id: "d1",
    date: "2024-03-01",
    grossRent: 3_400,
    netToInvestors: 3_060,
    yourShare: 61,
    claimed: false,
  },
  {
    id: "d2",
    date: "2024-02-01",
    grossRent: 3_200,
    netToInvestors: 2_880,
    yourShare: 58,
    claimed: true,
  },
  {
    id: "d3",
    date: "2024-01-01",
    grossRent: 3_100,
    netToInvestors: 2_790,
    yourShare: 56,
    claimed: true,
  },
];

// ---- Mock Governance Proposals ----
export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "p1",
    title: "Approve Roof Repair Works",
    description:
      "Authorise $4.5M for waterproofing and structural roof repair at Victoria Heights. Contractor: BuildRight Ltd.",
    status: "active",
    votesFor: 38_000,
    votesAgainst: 12_000,
    totalVotingPower: 73_200,
    endDate: "2024-03-15",
  },
  {
    id: "p2",
    title: "Increase Management Fee to 12%",
    description:
      "Property manager proposes increasing the management fee from 10% to 12% to cover rising maintenance costs.",
    status: "active",
    votesFor: 15_000,
    votesAgainst: 41_000,
    totalVotingPower: 73_200,
    endDate: "2024-03-12",
  },
  {
    id: "p3",
    title: "Renew Tenant Lease Agreement",
    description:
      "Approve 2-year lease renewal with current tenant at $3,400/month, a 6% increase from current rent.",
    status: "passed",
    votesFor: 61_000,
    votesAgainst: 8_000,
    totalVotingPower: 73_200,
    endDate: "2024-02-20",
  },
];
