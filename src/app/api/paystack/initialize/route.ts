import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL;
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: PAYSTACK_SECRET_KEY is missing' },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl();
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Server misconfigured: NEXT_PUBLIC_APP_URL is missing' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { amount, textbooks, email, name, regNumber, paymentType } = body ?? {};

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

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const amountInKobo = Math.round(amountNumber * 100);

    const reference = `PSK-${student.regNumber}-${Date.now()}`;

    const initPayload = {
      email: email || `${student.regNumber}@student.com`,
      amount: amountInKobo,
      reference,
      callback_url: `${appUrl}/api/paystack/verify`,
      metadata: {
        student_reg_number: student.regNumber,
        student_name: name || student.name,
        regNumber: regNumber || student.regNumber,
        paymentType: paymentType || 'textbooks',
        textbooks: Array.isArray(textbooks) ? textbooks : [],
      },
    };

    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initPayload),
    });

    const initData = await initRes.json();

    if (initRes.ok && initData?.status === true && initData?.data?.authorization_url) {
      return NextResponse.json({
        status: 'success',
        data: {
          link: initData.data.authorization_url,
          reference: initData.data.reference || reference,
        },
      });
    }

    return NextResponse.json(
      { error: initData?.message || 'Failed to initialize payment' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Paystack init error:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
