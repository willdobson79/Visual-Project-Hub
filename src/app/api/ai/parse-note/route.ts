import { NextRequest, NextResponse } from 'next/server';

interface ParseRequest {
    text: string;
    provider: 'claude' | 'gemini' | 'openai';
    apiKey: string;
    existingCategories: string[];
}

interface ParsedCard {
    title: string;
    description: string;
    category: string;
    emoji: string;
    suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
}

function buildSystemPrompt(existingCategories: string[]): string {
    const catList = existingCategories.length > 0 ? existingCategories.join(', ') : 'none yet';
    return `Parse the provided text into PKM cards. Existing categories: ${catList}. Return a JSON array only — no markdown, no code fences, no explanation. Each item must have: title (≤60 chars), description (1-2 sentences), category (prefer existing ones), emoji (single emoji), suggestedPriority (one of: low, medium, high, urgent).`;
}

function parseResponse(raw: string): ParsedCard[] {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
    return parsed;
}

async function parseWithClaude(text: string, apiKey: string, existingCategories: string[]): Promise<ParsedCard[]> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: buildSystemPrompt(existingCategories),
        messages: [{ role: 'user', content: text }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected content type from Claude');
    return parseResponse(content.text);
}

async function parseWithGemini(text: string, apiKey: string, existingCategories: string[]): Promise<ParsedCard[]> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `${buildSystemPrompt(existingCategories)}\n\n${text}`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    return parseResponse(raw);
}

async function parseWithOpenAI(text: string, apiKey: string, existingCategories: string[]): Promise<ParsedCard[]> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: buildSystemPrompt(existingCategories) },
            { role: 'user', content: text },
        ],
        max_tokens: 2048,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    return parseResponse(raw);
}

export async function POST(req: NextRequest) {
    try {
        const body: ParseRequest = await req.json();
        const { text, provider, apiKey, existingCategories } = body;

        if (!text?.trim()) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }
        if (!apiKey?.trim()) {
            return NextResponse.json({ error: 'No API key provided' }, { status: 400 });
        }

        let cards: ParsedCard[];

        switch (provider) {
            case 'claude':
                cards = await parseWithClaude(text, apiKey, existingCategories ?? []);
                break;
            case 'gemini':
                cards = await parseWithGemini(text, apiKey, existingCategories ?? []);
                break;
            case 'openai':
                cards = await parseWithOpenAI(text, apiKey, existingCategories ?? []);
                break;
            default:
                return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
        }

        return NextResponse.json({ cards });
    } catch (err: any) {
        console.error('[AI parse-note]', err);
        return NextResponse.json({ error: err?.message ?? 'Parse failed' }, { status: 500 });
    }
}
