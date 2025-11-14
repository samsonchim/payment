'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OutputSchema = z.object({
  quote: z
    .string()
    .describe('A short sarcastic demotivational one-liner about quitting school, no emojis, 15-25 words.'),
});
export type DemotivationalQuote = z.infer<typeof OutputSchema>;

const prompt = ai.definePrompt({
  name: 'demotivationalQuotePrompt',
  input: { schema: z.object({}) },
  output: { schema: OutputSchema },
  prompt: `You are a witty, sarcastic copywriter. Write one short, biting, demotivational one-liner suggesting the user should quit school.

Rules:
- Tone: playful, sarcastic, dry; avoid profanity and hate.
- Audience: general; keep it safe and non-targeted.
- No emojis, no hashtags, no quotes, no newlines.
- 15 to 25 words.

Return JSON with field 'quote'.`,
});

const demotivationalQuoteFlow = ai.defineFlow(
  {
    name: 'demotivationalQuoteFlow',
    inputSchema: z.object({}),
    outputSchema: OutputSchema,
  },
  async () => {
    const { output } = await prompt({});
    return output!;
  }
);

export async function generateDemotivationalQuote(): Promise<string> {
  const { quote } = await demotivationalQuoteFlow({});
  return quote;
}
