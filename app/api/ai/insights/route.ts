import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { context } = await req.json();

  const systemPrompt = `You are FlowLedger's AI finance assistant for a South African small business.
Generate 4-6 short, specific insight cards based on the business data provided.
Each insight should be ONE sentence, direct, with a Rand amount or percentage where relevant.
Cover: unpaid invoices, expense trends, VAT position, cashflow risk, and most/least profitable customer if data allows.
Return ONLY a JSON array of objects: [{"title": "short headline", "body": "one sentence insight", "tone": "warn|profit|neutral"}]
No markdown, no preamble, just the JSON array.

Business data: ${JSON.stringify(context)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Generate insights now.' }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const insights = JSON.parse(clean);
    return NextResponse.json({ insights });
  } catch {
    return NextResponse.json({ insights: [] });
  }
}
