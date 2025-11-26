import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Flutterwave from 'flutterwave-node-v3';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY!,
  process.env.FLUTTERWAVE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, textbooks, email, name, regNumber } = body;

    // Get student session
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

    if (!student) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Generate unique transaction reference
    const tx_ref = `TXB-${student.regNumber}-${Date.now()}`;

    const payload = {
      tx_ref,
      amount: amount.toString(),
      currency: 'NGN',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/flutterwave/verify`,
      payment_options: 'card,banktransfer,ussd,account',
      customer: {
        email: email || `${student.regNumber}@student.com`,
        name: name || student.name,
        phonenumber: ''
      },
      customizations: {
        title: 'CSC Payments',
        description: `Payment for: ${textbooks?.map((t: any) => t.name).join(', ') || 'Textbooks'}`,
        logo: ''
      },
      meta: {
        student_reg_number: student.regNumber,
        student_name: student.name,
        textbooks: JSON.stringify(textbooks || [])
      }
    };

    // Use the raw API since SDK doesn't have Payment.initialize
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status === 'success') {
      return NextResponse.json({
        status: 'success',
        data: {
          link: data.data.link,
          tx_ref
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Flutterwave init error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
