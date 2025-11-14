'use server';

/**
 * @fileOverview This flow verifies a balance payment receipt for Defense refreshment payment.
 *
 * - verifyBalancePayment - The main function to initiate the verification process.
 * - VerifyBalancePaymentInput - The input type for the verifyBalancePayment function.
 * - VerifyBalancePaymentOutput - The return type for the verifyBalancePayment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyBalancePaymentInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of the payment receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expectedAmount: z.number().describe('The expected payment amount (should be 1000).'),
  itemName: z.string().describe('The item being paid for (should be Defense refreshment payment balance).')
});
export type VerifyBalancePaymentInput = z.infer<typeof VerifyBalancePaymentInputSchema>;

const VerifyBalancePaymentOutputSchema = z.object({
  isApproved: z.boolean().describe('Whether the payment receipt is approved or not.'),
  reason: z.string().describe('The reason for approval or rejection.'),
});
export type VerifyBalancePaymentOutput = z.infer<typeof VerifyBalancePaymentOutputSchema>;

export async function verifyBalancePayment(input: VerifyBalancePaymentInput): Promise<VerifyBalancePaymentOutput> {
  return verifyBalancePaymentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyBalancePaymentPrompt',
  input: {schema: VerifyBalancePaymentInputSchema},
  output: {schema: VerifyBalancePaymentOutputSchema},
  prompt: `You are an expert payment receipt verification system for balance payments. Your task is to meticulously check a payment receipt against a set of strict criteria for Defense refreshment payment balance.

You will receive an image of a payment receipt, the expected payment amount, and the item name.

For the payment to be approved, ALL of the following conditions MUST be met:
1. The amount paid on the receipt must be EXACTLY 1000. No more, no less.
2. The recipient's account number MUST be EXACTLY "9135315917".
3. The recipient's bank name MUST be "Opay" or "Opay MFB".
4. The recipient's account name MUST be EXACTLY one of the following (any order is acceptable):
  - "Promise Ogbu Ucha"
  - "Promise Ucha Ogbu"
  - "Ogbu Ucha Promise"

If any of these conditions are not met, you must reject the payment.

IMPORTANT: When checking the payment amount, ignore commas, currency symbols, and trailing ".00" decimals. For example, "₦1,000.00" and "1000" should both match.

Based on your strict verification, set the isApproved output field to true only if all conditions are met. Otherwise, set it to false. Provide a clear and detailed reason for your decision in the reason output field, mentioning which specific check failed.

Receipt Image: {{media url=receiptDataUri}}
Expected Amount: {{{expectedAmount}}}
Item: {{{itemName}}}
`,
});

const verifyBalancePaymentFlow = ai.defineFlow(
  {
    name: 'verifyBalancePaymentFlow',
    inputSchema: VerifyBalancePaymentInputSchema,
    outputSchema: VerifyBalancePaymentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);