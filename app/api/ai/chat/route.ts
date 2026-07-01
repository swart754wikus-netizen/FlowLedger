import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { message, history = [], context } = await req.json();

  const systemPrompt = `You are FlowLedger's AI finance assistant for a South African small business owner.
Speak plainly, like a trusted friend who happens to know finance — not like an accountant.
Lead with a direct yes/no or Rand amount. Max 4 sentences, then bullets if useful.
Use only the business data provided. Reference SA context where relevant: SARS, VAT at 15%, provisional tax.

Business data: ${JSON.stringify(context)}`;

  const messages = [
    ...history.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return NextResponse.json({ response: text });
}
