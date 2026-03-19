import { NextRequest, NextResponse } from "next/server";

// Server-only — never exposed to the browser
const TRANSAK_API_KEY = process.env.TRANSAK_API_KEY ?? "";
// Set TRANSAK_ENV=production in .env.local to use live widget (when staging is down)
const TRANSAK_ENV = process.env.TRANSAK_ENV ?? "staging"; // "staging" | "production"

const WIDGET_BASE_URL =
  TRANSAK_ENV === "production"
    ? "https://global.transak.com"
    : "https://global-stg.transak.com";

export async function POST(req: NextRequest) {
  if (!TRANSAK_API_KEY || TRANSAK_API_KEY === "your_staging_api_key_here") {
    return NextResponse.json(
      { error: "TRANSAK_API_KEY is not configured in .env.local" },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    walletAddress,
    fiatCurrency = "GBP",
    defaultFiatAmount = 50,
  } = body as {
    walletAddress?: string;
    fiatCurrency?: string;
    defaultFiatAmount?: number;
  };

  const params: Record<string, string> = {
    apiKey: TRANSAK_API_KEY,
    cryptoCurrencyCode: "USDC",
    network: "polygon",
    fiatCurrency,
    defaultFiatAmount: String(defaultFiatAmount),
    themeColor: "2563eb",
    disableWalletAddressForm: "true",
  };

  if (walletAddress) params.walletAddress = walletAddress;

  const widgetUrl = `${WIDGET_BASE_URL}?${new URLSearchParams(
    params,
  ).toString()}`;

  return NextResponse.json({ widgetUrl });
}
