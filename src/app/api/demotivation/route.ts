import { NextResponse } from 'next/server';
import { generateDemotivationalQuote } from '@/ai/flows/demotivational-quote';

export async function GET() {
  try {
    const quote = await generateDemotivationalQuote();
    return NextResponse.json({ quote });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to generate quote' }, { status: 500 });
  }
}
