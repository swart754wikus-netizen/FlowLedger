import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You extract structured data from an uploaded invoice, quote/quotation, or receipt image/PDF for a South African bookkeeping app.
Return ONLY a JSON object, no markdown, no preamble, in this exact shape:
{
  "customerName": string | null,
  "issueDate": string | null,
  "dueDate": string | null,
  "lineItems": [{ "description": string, "quantity": number, "unitPrice": number, "vatTreatment": "inclusive" | "exclusive" | "zero_rated" | "exempt" }]
}
Dates must be "YYYY-MM-DD" or null if not present. quantity and unitPrice must be numbers (not strings).
Default vatTreatment to "inclusive" unless the document clearly states otherwise. If you can't read a field, use null (or omit the line item if it's unreadable).`;

export async function POST(req: NextRequest) {
  const { mediaType, data } = await req.json();
  if (!mediaType || !data) {
    return NextResponse.json({ error: 'Missing file data' }, { status: 400 });
  }

  try {
    const isPdf = mediaType === 'application/pdf';
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          isPdf
            ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
            : { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: 'Extract the document data now.' },
        ],
      }] as any,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const extracted = JSON.parse(clean);
    return NextResponse.json({ extracted });
  } catch (err: any) {
    console.error(err);
    const detail = err?.error?.error?.message || err?.message || 'unknown error';
    return NextResponse.json({ error: `Could not read that file — try a clearer photo or a different file. (${detail})` }, { status: 500 });
  }
}
