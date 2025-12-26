import { NextResponse } from 'next/server';

type ExplainResult = {
  plain: string;
  sec30: string;
  kid10: string;
  manager: string;
  linkedin: string;
  tweet: string;
};

function buildPrompt(input: string) {
  return `
You are a clarity-first explainer.

TASK:
Explain the user's topic in 6 formats.

RULES:
- Be accurate and practical.
- Use simple language.
- Avoid filler and hype.
- No emojis.
- Keep each section concise.

OUTPUT FORMAT (must be valid JSON with these exact keys):
{
  "plain": "...",
  "sec30": "...",
  "kid10": "...",
  "manager": "...",
  "linkedin": "...",
  "tweet": "..."
}

TOPIC:
${input}
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? '').trim();

    if (!text || text.length < 3) {
      return NextResponse.json({ error: 'Please enter at least 3 characters.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY in .env.local' },
        { status: 500 }
      );
    }

    // Direct OpenAI REST call (no extra SDK needed)
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: buildPrompt(text),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `OpenAI error (${resp.status}): ${errText}` },
        { status: 500 }
      );
    }

    const data = await resp.json();

    // The Responses API typically returns text in output[0].content[0].text
    const outText =
      data?.output?.[0]?.content?.find((c: { type: string; text: string }) => c?.type === 'output_text')?.text ??
      data?.output_text ??
      '';

    if (!outText) {
      return NextResponse.json({ error: 'No output received from model.' }, { status: 500 });
    }

    let parsed: ExplainResult | null = null;
    try {
      parsed = JSON.parse(outText);
    } catch {
      // If model returned non-JSON, fail loudly (better than silently wrong)
      return NextResponse.json(
        { error: 'Model did not return valid JSON. Try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      { error: error.message ?? 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
