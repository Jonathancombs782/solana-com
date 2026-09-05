"use client";

import { useState } from "react";
import useSWR from "swr";

type Asset = {
  change: number;
  id: string;
  name: string;
  price: number;
  symbol: string;
  type: "crypto" | "stock";
};
type MarketResponse = { assets: Asset[]; updatedAt: string };
const fetcher = (url: string) => fetch(url).then((response) => response.json());

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: price < 10 ? 3 : 2,
    style: "currency",
  }).format(price);
}

export function MarketDashboard() {
  const { data, isLoading } = useSWR<MarketResponse>("/api/market", fetcher, {
    refreshInterval: 60_000,
  });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const assets = data?.assets ?? [];

  async function askAssistant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAsking(true);
    setAnswer("");
    const response = await fetch("/api/market/assistant", {
      body: JSON.stringify({ assets, question }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json();
    setAnswer(result.answer ?? result.error);
    setAsking(false);
  }

  return (
    <main className="min-h-screen bg-[#101114] px-5 py-16 text-[#f3f1ea] md:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-14 max-w-3xl">
          <p className="mb-4 font-brand-mono text-xs uppercase tracking-[0.18em] text-[#b5f542]">
            Market signal / public data
          </p>
          <h1 className="font-brand text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Read the market in one glance.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-7 text-[#aaa9b0]">
            A live, deliberately small window into traditional markets and the
            assets moving on Solana.
          </p>
        </header>

        <section
          aria-label="Market summary"
          className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3"
        >
          {["SOL", "BTC", "COIN"].map((symbol) => {
            const asset = assets.find((item) => item.symbol === symbol);
            return (
              <div className="bg-[#17181c] p-6" key={symbol}>
                <div className="flex justify-between text-xs uppercase tracking-widest text-[#888891]">
                  <span>{symbol}</span>
                  <span>{asset?.type ?? "loading"}</span>
                </div>
                <div className="mt-8 text-3xl font-medium">
                  {asset ? formatPrice(asset.price) : "--"}
                </div>
                <div
                  className={`mt-2 text-sm ${asset && asset.change >= 0 ? "text-[#b5f542]" : "text-[#ff756b]"}`}
                >
                  {asset
                    ? `${asset.change >= 0 ? "+" : ""}${asset.change.toFixed(2)}% today`
                    : "Waiting for feed"}
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-brand-mono text-xs uppercase tracking-widest text-[#888891]">
                  Watchlist
                </p>
                <h2 className="mt-2 text-2xl">Cross-market pulse</h2>
              </div>
              <span className="text-sm text-[#888891]">
                {isLoading ? "Updating..." : "Updates every minute"}
              </span>
            </div>
            <div className="overflow-hidden border border-white/10">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-white/5 px-5 py-3 font-brand-mono text-[11px] uppercase tracking-widest text-[#888891]">
                <span>Asset</span>
                <span>Last price</span>
                <span>24h move</span>
              </div>
              {assets.map((asset) => (
                <div
                  className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-t border-white/10 px-5 py-5"
                  key={asset.id}
                >
                  <div>
                    <div>{asset.name}</div>
                    <div className="mt-1 text-xs text-[#888891]">
                      {asset.symbol} / {asset.type}
                    </div>
                  </div>
                  <span>{formatPrice(asset.price)}</span>
                  <span
                    className={
                      asset.change >= 0 ? "text-[#b5f542]" : "text-[#ff756b]"
                    }
                  >
                    {asset.change >= 0 ? "+" : ""}
                    {asset.change.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#66666e]">
              Public data may be delayed. This is an informational view, not
              financial advice.
            </p>
          </section>

          <section className="border border-[#b5f542]/40 bg-[#17181c] p-6">
            <p className="font-brand-mono text-xs uppercase tracking-widest text-[#b5f542]">
              OpenAI market assistant
            </p>
            <h2 className="mt-3 text-2xl">Ask the snapshot.</h2>
            <p className="mt-3 text-sm leading-6 text-[#aaa9b0]">
              Ask for comparisons or plain-language context. Your API key stays
              on the server.
            </p>
            <form className="mt-8" onSubmit={askAssistant}>
              <textarea
                className="min-h-32 w-full resize-y border border-white/15 bg-[#101114] p-4 text-sm outline-none placeholder:text-[#66666e] focus:border-[#b5f542]"
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Compare SOL and COIN today..."
                value={question}
              />
              <button
                className="mt-3 w-full bg-[#b5f542] px-4 py-3 text-sm font-medium text-[#101114] transition-opacity hover:opacity-85 disabled:opacity-50"
                disabled={asking || !question.trim()}
                type="submit"
              >
                {asking ? "Thinking..." : "Ask assistant"}
              </button>
            </form>
            {answer && (
              <div className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-[#d4d3cc]">
                {answer}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
