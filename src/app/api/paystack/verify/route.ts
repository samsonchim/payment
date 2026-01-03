import { NextRequest, NextResponse } from 'next/server';
import { insertPaymentRecords } from '@/lib/records';
import { revalidatePath } from 'next/cache';

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL;
}

export async function GET(req: NextRequest) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const baseUrl = appUrl();

    if (!secretKey || !baseUrl) {
      return NextResponse.redirect(`${baseUrl || ''}/dashboard?payment=error`);
    }

    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=error`);
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData?.status !== true) {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed`);
    }

    const data = verifyData.data;

    if (data?.status !== 'success' || data?.currency !== 'NGN') {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed`);
    }

    const metadata = data?.metadata || {};
    const studentRegNumber = metadata?.student_reg_number || metadata?.regNumber;
    const studentName = metadata?.student_name || data?.customer?.first_name || '';
    const textbooks = Array.isArray(metadata?.textbooks) ? metadata.textbooks : [];

    if (!studentRegNumber || textbooks.length === 0) {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=error`);
    }

    const amountPaid = Number(data?.amount) / 100;

    const { error } = await insertPaymentRecords(
      textbooks.map((book: any) => ({
        studentName: studentName,
        regNumber: studentRegNumber,
        itemName: String(book?.name ?? ''),
        amountPaid: Number(book?.price) || 0,
        receiptText: `Paystack: ${reference}`,
      }))
    );

    if (error) {
      console.error('Error saving payment records:', error);
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=error`);
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');

    const receiptData = encodeURIComponent(
      JSON.stringify({
        textbooks,
        amount: amountPaid,
        tx_ref: reference,
        studentName,
      })
    );

    return NextResponse.redirect(
      `${baseUrl}/dashboard?payment=success&receipt=${receiptData}`
    );
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    const baseUrl = appUrl();
    return NextResponse.redirect(`${baseUrl || ''}/dashboard?payment=error`);
  }
}
