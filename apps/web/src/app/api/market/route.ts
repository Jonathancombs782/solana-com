import { NextResponse } from "next/server";

type Asset = {
  change: number;
  id: string;
  name: string;
  price: number;
  symbol: string;
  type: "crypto" | "stock";
};

const cryptoIds = "solana,bitcoin,ethereum";
const stockSymbols = ["NVDA", "COIN", "MSTR"];

export async function GET() {
  try {
    const [cryptoResponse, ...stockResponses] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`,
        { next: { revalidate: 60 } },
      ),
      ...stockSymbols.map((symbol) =>
        fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`,
          { next: { revalidate: 60 } },
        ),
      ),
    ]);

    if (!cryptoResponse.ok || stockResponses.some((response) => !response.ok)) {
      throw new Error("Market provider returned an error");
    }

    const crypto = await cryptoResponse.json();
    const stocks = await Promise.all(
      stockResponses.map(async (response, index): Promise<Asset> => {
        const result = await response.json();
        const meta = result.chart?.result?.[0]?.meta;
        return {
          change: meta?.regularMarketChangePercent ?? 0,
          id: stockSymbols[index],
          name: meta?.longName ?? stockSymbols[index],
          price: meta?.regularMarketPrice ?? 0,
          symbol: stockSymbols[index],
          type: "stock",
        };
      }),
    );

    const assets: Asset[] = [
      {
        id: "solana",
        name: "Solana",
        price: crypto.solana.usd,
        symbol: "SOL",
        type: "crypto",
        change: crypto.solana.usd_24h_change,
      },
      {
        id: "bitcoin",
        name: "Bitcoin",
        price: crypto.bitcoin.usd,
        symbol: "BTC",
        type: "crypto",
        change: crypto.bitcoin.usd_24h_change,
      },
      {
        id: "ethereum",
        name: "Ethereum",
        price: crypto.ethereum.usd,
        symbol: "ETH",
        type: "crypto",
        change: crypto.ethereum.usd_24h_change,
      },
      ...stocks,
    ];

    return NextResponse.json({ assets, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "Market data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
