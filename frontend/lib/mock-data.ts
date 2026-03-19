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
    name: "Victoria Heights Apartment",
    address: "12 Victoria Street",
    city: "Lagos",
    country: "Nigeria",
    type: "apartment",
    status: "active",
    image:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    totalValue: 500_000,
    tokenPrice: 5,
    totalSupply: 100_000,
    tokensSold: 73_200,
    monthlyRent: 3_400,
    annualYield: 8.2,
    managementFee: 10,
    sqm: 142,
    bedrooms: 3,
    bathrooms: 2,
    securityTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
    documents: [
      {
        name: "Title Deed",
        hash: "QmW2WQi7j6c3QBzVPdVUFT4hJSPhTqBEyFQk8aSu1A4J9a",
      },
      {
        name: "Valuation Report",
        hash: "QmTzQ9RS58pjFGRhW3GaSRGdKqNkEfnqBGo1MiERhPMUz1",
      },
    ],
  },
  {
    id: "2",
    name: "Lekki Peninsula Villa",
    address: "5 Admiralty Way",
    city: "Lekki",
    country: "Nigeria",
    type: "villa",
    status: "active",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c153b09?w=800&q=80",
    totalValue: 850_000,
    tokenPrice: 8.5,
    totalSupply: 100_000,
    tokensSold: 98_800,
    monthlyRent: 6_500,
    annualYield: 9.1,
    managementFee: 8,
    sqm: 320,
    bedrooms: 5,
    bathrooms: 4,
    documents: [],
  },
  {
    id: "3",
    name: "Ikeja Commercial Hub",
    address: "100 Airport Road",
    city: "Ikeja",
    country: "Nigeria",
    type: "commercial",
    status: "coming_soon",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    totalValue: 2_000_000,
    tokenPrice: 20,
    totalSupply: 100_000,
    tokensSold: 0,
    monthlyRent: 12_400,
    annualYield: 7.4,
    managementFee: 12,
    sqm: 1200,
    documents: [],
  },
  {
    id: "4",
    name: "Ikoyi Office Tower",
    address: "22 Bourdillon Road",
    city: "Ikoyi",
    country: "Nigeria",
    type: "office",
    status: "active",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    totalValue: 1_200_000,
    tokenPrice: 12,
    totalSupply: 100_000,
    tokensSold: 55_000,
    monthlyRent: 8_400,
    annualYield: 8.4,
    managementFee: 10,
    sqm: 800,
    documents: [
      {
        name: "Lease Agreement",
        hash: "QmZbimgJsE3yNRBm1KV7xdLYgWGGHfWP3X9DjnP9r4f8sR",
      },
    ],
  },
  {
    id: "5",
    name: "Epe Growth Estate – Raw Land",
    address: "Km 45, Epe-Ijebu Road",
    city: "Epe",
    country: "Nigeria",
    type: "land",
    status: "active",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    totalValue: 300_000,
    tokenPrice: 3,
    totalSupply: 100_000,
    tokensSold: 22_000,
    monthlyRent: 0,
    annualYield: 0,
    managementFee: 5,
    sqm: 50_000,
    documents: [
      {
        name: "Certificate of Occupancy",
        hash: "QmRawLandDocHashXyZ123abc456defGhI789jkL012mnO",
      },
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
      "Authorise ₦4.5M for waterproofing and structural roof repair at Victoria Heights. Contractor: BuildRight Ltd.",
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
      "Approve 2-year lease renewal with current tenant at ₦3,400/month, a 6% increase from current rent.",
    status: "passed",
    votesFor: 61_000,
    votesAgainst: 8_000,
    totalVotingPower: 73_200,
    endDate: "2024-02-20",
  },
];
