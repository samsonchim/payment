import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyBalancePayment } from '@/ai/flows/verify-balance-payment';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

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

    // Save receipt image to public/uploads/balance_receipts
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'balance_receipts');
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Parse data URI
    const match = receiptDataUri.match(/^data:(image\/[^;]+);base64,(.+)$/);
    let publicPath = '';
    if (match) {
      const mime = match[1];
      const b64 = match[2];
      const ext = mime.split('/')[1] || 'png';
      const fileName = `${randomUUID()}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
      publicPath = `/uploads/balance_receipts/${fileName}`;
    } else {
      // Fallback: store entire data URI (shouldn't usually happen)
      publicPath = receiptDataUri;
    }

    // Record balance payment with stored path
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('balance_payments')
      .insert({
        student_reg_number: student.regNumber,
        item_name: 'Defense refreshment payment',
        amount: 1000,
        receipt_text: publicPath,
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
