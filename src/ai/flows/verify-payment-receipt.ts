'use server';

/**
 * @fileOverview This flow verifies a payment receipt against the expected payment details.
 *
 * - verifyPaymentReceipt - The main function to initiate the verification process.
 * - VerifyPaymentReceiptInput - The input type for the verifyPaymentReceipt function.
 * - VerifyPaymentReceiptOutput - The return type for the verifyPaymentReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyPaymentReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of the payment receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expectedAmount: z.number().describe('The expected payment amount.'),
  textbookList: z.string().describe('A list of the textbooks the student is paying for.')
});
export type VerifyPaymentReceiptInput = z.infer<typeof VerifyPaymentReceiptInputSchema>;

const VerifyPaymentReceiptOutputSchema = z.object({
  isApproved: z.boolean().describe('Whether the payment receipt is approved or not.'),
  reason: z.string().describe('The reason for approval or rejection.'),
});
export type VerifyPaymentReceiptOutput = z.infer<typeof VerifyPaymentReceiptOutputSchema>;

export async function verifyPaymentReceipt(input: VerifyPaymentReceiptInput): Promise<VerifyPaymentReceiptOutput> {
  return verifyPaymentReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyPaymentReceiptPrompt',
  input: {schema: VerifyPaymentReceiptInputSchema},
  output: {schema: VerifyPaymentReceiptOutputSchema},
  prompt: `You are an expert payment receipt verification system. Your task is to meticulously check a payment receipt against a set of strict criteria.

You will receive an image of a payment receipt, the expected payment amount, and a list of textbooks.

For the payment to be approved, ALL of the following conditions MUST be met:
1. The amount paid on the receipt must be equal to or GREATER THAN the expected amount. If it is less than the expected amount, you must reject it. Any amount paid over the expected amount is considered a tip.
2. The recipient's bank name MUST be "Moniepoint".
3. The recipient's name MUST be EXACTLY "Chimaraoke Samson" or "Samson Chimaraoke". No other variations or additional names are acceptable. The order of the first and last name does not matter.

If any of these conditions are not met, you must reject the payment. DO NOT check the account number.

IMPORTANT: When checking the payment amount, ignore commas, currency symbols, and trailing ".00" decimals. For example, "₦2,600.00" and "2600" should both match an expected amount of 2600.

Based on your strict verification, set the isApproved output field to true only if all conditions are met. Otherwise, set it to false. Provide a clear and detailed reason for your decision in the reason output field, mentioning which specific check failed.

Receipt Image: {{media url=receiptDataUri}}
Expected Amount: {{{expectedAmount}}}
Textbooks: {{{textbookList}}}
`,
});

const verifyPaymentReceiptFlow = ai.defineFlow(
  {
    name: 'verifyPaymentReceiptFlow',
    inputSchema: VerifyPaymentReceiptInputSchema,
    outputSchema: VerifyPaymentReceiptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
