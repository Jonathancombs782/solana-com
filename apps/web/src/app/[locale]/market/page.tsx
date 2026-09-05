import type { Metadata } from "next";
import { MarketDashboard } from "./market-dashboard";

export const metadata: Metadata = {
  title: "Market Signal | Solana",
  description: "A focused view of public markets and Solana ecosystem signals.",
};

export default function MarketPage() {
  return <MarketDashboard />;
}
