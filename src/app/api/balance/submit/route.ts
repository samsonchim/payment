import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyBalancePayment } from '@/ai/flows/verify-balance-payment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { receiptDataUri } = body as { receiptDataUri?: string };

    if (!receiptDataUri) {
      return NextResponse.json({ error: 'Missing receiptDataUri' }, { status: 400 });
    }

    // Get student session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('student_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    let student: { id: string; regNumber: string; name: string } | null = null;
    try {
      student = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    if (!student || !student.regNumber) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify balance payment via AI flow
    const verification = await verifyBalancePayment({
      receiptDataUri,
      expectedAmount: 1000,
      itemName: 'Defense refreshment payment balance',
    });

    if (!verification.isApproved) {
      return NextResponse.json(verification, { status: 200 });
    }

    // Record balance payment
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('balance_payments')
      .insert({
        student_reg_number: student.regNumber,
        item_name: 'Defense refreshment payment',
        amount: 1000,
        receipt_text: receiptDataUri,
        verified: true,
        verified_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to record balance payment' }, { status: 500 });
    }

    return NextResponse.json(verification, { status: 200 });
  } catch (e: any) {
    console.error('Balance submit error:', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
