import { NextResponse } from 'next/server';
import { generateDemotivationalQuote } from '@/ai/flows/demotivational-quote';

export const revalidate = 0;

export async function GET() {
  try {
    const quote = await generateDemotivationalQuote();
    return NextResponse.json({ quote });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate quote' }, { status: 500 });
  }
}
