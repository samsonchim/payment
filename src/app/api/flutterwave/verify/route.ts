import { NextRequest, NextResponse } from 'next/server';
import Flutterwave from 'flutterwave-node-v3';
import { createAdminClient } from '@/lib/supabase/server';
import { insertPaymentRecords } from '@/lib/records';
import { revalidatePath } from 'next/cache';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY!,
  process.env.FLUTTERWAVE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const tx_ref = searchParams.get('tx_ref');
    const transaction_id = searchParams.get('transaction_id');

    if (status === 'cancelled') {
      // Redirect back to dashboard with error
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`
      );
    }

    if (!tx_ref || !transaction_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`
      );
    }

    // Verify the transaction using direct API call
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const response = await verifyResponse.json();

    console.log('Flutterwave verification response:', JSON.stringify(response, null, 2));

    if (
      response.status === 'success' &&
      response.data.status === 'successful' &&
      response.data.currency === 'NGN'
    ) {
      const { meta, customer, amount, charged_amount, tx_ref } = response.data;
      
      const studentRegNumber = meta?.student_reg_number;
      const studentName = meta?.student_name || customer.name;
      const textbooksJson = meta?.textbooks;

      if (!studentRegNumber) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`
        );
      }

      // Handle textbook payment
      let textbooks: Array<{ name: string; price: number }> = [];
      try {
        textbooks = textbooksJson ? JSON.parse(textbooksJson) : [];
      } catch (e) {
        console.error('Error parsing textbooks:', e);
      }

      if (textbooks.length === 0) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`
        );
      }

      // Save payment records
      const { error } = await insertPaymentRecords(
        textbooks.map(book => ({
          studentName: studentName,
          regNumber: studentRegNumber,
          itemName: book.name,
          amountPaid: book.price,
          receiptText: `Flutterwave: ${tx_ref}`
        }))
      );

      if (error) {
        console.error('Error saving payment records:', error);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`
        );
      }

      revalidatePath('/admin/dashboard');
      revalidatePath('/dashboard');

      // Redirect to success page with receipt data
      const receiptData = encodeURIComponent(JSON.stringify({
        textbooks,
        amount: charged_amount,
        tx_ref,
        studentName
      }));

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&receipt=${receiptData}`
      );
    } else {
      // Payment failed or invalid
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=failed`
      );
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=error`
    );
  }
}
