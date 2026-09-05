import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Add OPENAI_API_KEY to enable market questions." },
      { status: 503 },
    );
  }

  const { question, assets } = (await request.json()) as {
    assets: unknown;
    question: string;
  };

  if (!question?.trim()) {
    return NextResponse.json(
      { error: "Enter a question first." },
      { status: 400 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: `You are a careful market research assistant. Use only the supplied snapshot, do not invent prices, and do not give personalized financial advice. Mention that data may be delayed. Snapshot: ${JSON.stringify(assets)}\nQuestion: ${question}`,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "The market assistant is unavailable." },
      { status: 502 },
    );
  }

  const result = (await response.json()) as { output_text?: string };
  return NextResponse.json({
    answer: result.output_text ?? "No answer was returned.",
  });
}
