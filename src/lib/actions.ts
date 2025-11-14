
'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import type { Textbook, Student, Transaction, ManualRecord, BalancePayment } from './data';
import { verifyPaymentReceipt } from '@/ai/flows/verify-payment-receipt';
import { verifyBalancePayment } from '@/ai/flows/verify-balance-payment';
import { insertPaymentRecords } from '@/lib/records';
import { revalidatePath } from 'next/cache';

const STUDENT_COOKIE = 'student_session';
const ADMIN_COOKIE = 'admin_session';

// --- Authentication Actions ---

export async function loginStudent(prevState: any, formData: FormData) {
  const schema = z.object({
    regNumber: z.string().trim().min(1, 'Registration number is required.'),
  });
  const parse = schema.safeParse({ regNumber: formData.get('regNumber') });

  if (!parse.success) {
    return { error: parse.error.errors[0].message };
  }
  
  const supabase = await createAdminClient();
  const { data: student, error } = await supabase
    .from('students')
    .select('id, reg_number, name')
    .eq('reg_number', parse.data.regNumber) 
    .single();

  if (error || !student) {
    console.error('Login error:', error);
    return { error: 'Invalid registration number.' };
  }
  
  const studentData: Student = {
    id: student.id,
    regNumber: student.reg_number,
    name: student.name
  };

  const cookieStore = await cookies();
  cookieStore.set(STUDENT_COOKIE, JSON.stringify(studentData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });

  return { success: true };
}

export async function loginAdmin(prevState: any, formData: FormData) {
  const schema = z.object({
    username: z.string().min(1, 'Username is required.'),
    password: z.string().min(1, 'Password is required.'),
  });
  const parse = schema.safeParse(Object.fromEntries(formData));

  if (!parse.success) {
    return { error: parse.error.errors[0].message };
  }

  const { username, password } = parse.data;

  // This is a mock admin login. In a real app, you'd use Supabase Auth.
  if (username === 'admin' && password === 'password123') {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return { success: true };
  }

  return { error: 'Invalid username or password.' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_COOKIE);
  cookieStore.delete(ADMIN_COOKIE);
}

// --- Session Actions ---

export async function getStudentSession(): Promise<Student | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(STUDENT_COOKIE);
  if (cookie) {
    return JSON.parse(cookie.value);
  }
  return null;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === 'true';
}

// --- Data Fetching Actions ---

export async function getTextbooks(): Promise<Textbook[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('textbooks')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
      console.error('Error fetching textbooks:', error);
      return [];
  }
  return data || [];
}

export async function getManualRecords(): Promise<ManualRecord[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('manual_records')
    .select('*')
    .order('time', { ascending: false });

  if (error) {
    console.error('Error fetching manual records:', error);
    return [];
  }

  return (data || []).map(m => ({
    id: m.id,
    studentName: m.student_name,
    regNumber: m.reg_number,
    product: m.product,
    price: Number(m.price) || 0,
    time: new Date(m.time).toISOString(),
    isCollected: m.is_collected || false,
    collectedBy: m.collected_by || undefined,
    collectedAt: m.collected_at ? new Date(m.collected_at).toISOString() : undefined,
  }));
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createAdminClient();

  // Fetch from records table
  const { data: recordsData, error: recordsError } = await supabase
    .from('records')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch from manual_records table
  const { data: manualData, error: manualError } = await supabase
    .from('manual_records')
    .select('*')
    .order('time', { ascending: false });

  if (recordsError) {
    console.error('Error fetching records:', recordsError);
  }
  if (manualError) {
    console.error('Error fetching manual records:', manualError);
  }

  const transactions: Transaction[] = [];

  // Map records
  if (recordsData) {
    transactions.push(...recordsData.map(t => ({
      id: t.id,
      studentName: t.student_name,
      regNumber: t.reg_number,
      textbookName: t.name,
      totalAmount: t.amount_paid,
      date: new Date(t.created_at).toISOString(),
      isCollected: t.isCollected || false,
      collectedBy: t.collectedBy,
      collectedAt: t.collectedAt
    })));
  }

  // Map manual records
  if (manualData) {
    transactions.push(...manualData.map(m => ({
      id: m.id,
      studentName: m.student_name,
      regNumber: m.reg_number,
      textbookName: m.product,
      totalAmount: m.price,
      date: new Date(m.time).toISOString(),
      isCollected: m.is_collected || false,
      collectedBy: m.collected_by,
      collectedAt: m.collected_at
    })));
  }

  // Fetch from balance_payments table
  const { data: balanceData, error: balanceError } = await supabase
    .from('balance_payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (balanceError) {
    console.error('Error fetching balance payments:', balanceError);
  }

  // Map balance payments
  if (balanceData) {
    transactions.push(...balanceData.map(b => ({
      id: b.id,
      studentName: '', // Not stored, but can be fetched from student
      regNumber: b.student_reg_number,
      textbookName: `${b.item_name} (Balance)`,
      totalAmount: b.amount,
      date: new Date(b.created_at).toISOString(),
      isCollected: true, // Balance payments are considered collected
      collectedBy: 'AI Verified',
      collectedAt: b.verified_at
    })));
  }

  // Sort combined results by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}

export async function getStudentTransactions(regNumber: string): Promise<Transaction[]> {
  if (!regNumber) return [];

  const supabase = await createAdminClient();

  // Fetch from records table
  const { data: recordsData, error: recordsError } = await supabase
    .from('records')
    .select('*')
    .eq('reg_number', regNumber)
    .order('created_at', { ascending: false });

  // Fetch from manual_records table
  const { data: manualData, error: manualError } = await supabase
    .from('manual_records')
    .select('*')
    .eq('reg_number', regNumber)
    .order('time', { ascending: false });

  if (recordsError) {
    console.error('Error fetching student records:', recordsError);
  }
  if (manualError) {
    console.error('Error fetching student manual records:', manualError);
  }

  const transactions: Transaction[] = [];

  // Map records
  if (recordsData) {
    transactions.push(...recordsData.map(t => ({
      id: t.id,
      studentName: t.student_name,
      regNumber: t.reg_number,
      textbookName: t.name,
      totalAmount: t.amount_paid,
      date: new Date(t.created_at).toISOString(),
      isCollected: t.isCollected || false,
      collectedBy: t.collectedBy,
      collectedAt: t.collectedAt
    })));
  }

  // Map manual records
  if (manualData) {
    transactions.push(...manualData.map(m => ({
      id: m.id,
      studentName: m.student_name,
      regNumber: m.reg_number,
      textbookName: m.product,
      totalAmount: m.price,
      date: new Date(m.time).toISOString(),
      isCollected: m.is_collected || false,
      collectedBy: m.collected_by,
      collectedAt: m.collected_at
    })));
  }

  // Also include any verified balance payments for this student
  const { data: balanceData, error: balanceError } = await supabase
    .from('balance_payments')
    .select('*')
    .eq('student_reg_number', regNumber)
    .order('created_at', { ascending: false });

  if (balanceError) {
    console.error('Error fetching student balance payments:', balanceError);
  }

  if (balanceData) {
    transactions.push(...balanceData.map(b => ({
      id: b.id,
      studentName: '', // Not stored in table
      regNumber: b.student_reg_number,
      textbookName: `${b.item_name} (Balance)`,
      totalAmount: b.amount,
      date: new Date(b.created_at).toISOString(),
      isCollected: true,
      collectedBy: 'AI Verified',
      collectedAt: b.verified_at
    })));
  }

  // (Duplicate block removed)

  // Sort combined results by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return transactions;
}


export async function getStudents(): Promise<Student[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('students')
    .select('id, reg_number, name')
    .order('name', { ascending: true });
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  return (data || []).map(s => ({
    id: s.id,
    regNumber: s.reg_number,
    name: s.name,
  }));
}

export async function deleteTransaction(transactionId: string) {
  try {
    const supabase = await createAdminClient();

    // Try to delete from records table
    const { error: recErr } = await supabase
      .from('records')
      .delete()
      .eq('id', transactionId);

    const { error: manErr } = await supabase
      .from('manual_records')
      .delete()
      .eq('id', transactionId);

    if (recErr && manErr) {
      console.error('Error deleting transaction:', recErr, manErr);
      return { error: 'Failed to delete transaction.' };
    }

    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Delete transaction error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}


// --- Admin Data Mutation Actions ---

export async function addTextbook(prevState: any, formData: FormData) {
  const schema = z.object({
    name: z.string().min(3),
    price: z.coerce.number().positive(),
  });
  const data = schema.safeParse(Object.fromEntries(formData));
  if (!data.success) return { error: "Invalid data" };
  
  const supabase = await createAdminClient();
  const { error } = await supabase.from('textbooks').insert({
    name: data.data.name,
    price: data.data.price
  });

  if (error) {
      console.error('Supabase error:', error);
      if (error.code === '23505') { 
          return { error: "A textbook with this name already exists." }
      }
      return { error: "Error adding textbook. " + error.message }
  }
  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateTextbook(prevState: any, formData: FormData) {
  const schema = z.object({
    id: z.string(),
    name: z.string().min(3),
    price: z.coerce.number().positive(),
  });
   const data = schema.safeParse(Object.fromEntries(formData));
  if (!data.success) return { error: "Invalid data" };

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('textbooks')
    .update({ name: data.data.name, price: data.data.price })
    .eq('id', data.data.id);

  if (error) {
    return { error: "Error updating textbook." }
  }

  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTextbook(id: string) {
  const supabase = await createAdminClient();
    const { error } = await supabase.from('textbooks').delete().eq('id', id);
    if (error) {
        return { error: "Error deleting textbook." };
    }
    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateCollectionStatus(transactionId: string, collectedBy: string) {
  const supabase = await createAdminClient();

  // Try to update in records table
  const { error: recordsError } = await supabase
    .from('records')
    .update({
      isCollected: true,
      collectedBy: collectedBy,
      collectedAt: new Date().toISOString()
    })
    .eq('id', transactionId);

  // Try to update in manual_records table
  const { error: manualError } = await supabase
    .from('manual_records')
    .update({
      is_collected: true,
      collected_by: collectedBy,
      collected_at: new Date().toISOString()
    })
    .eq('id', transactionId);

  if (recordsError && manualError) {
    console.error('Error updating collection status in both tables:', recordsError, manualError);
    return { error: 'Failed to update collection status' };
  }

  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');
  return { success: true };
}


// --- Balance Payment Actions ---

export async function submitBalancePayment(receiptDataUri: string) {
  const student = await getStudentSession();
  if (!student) {
    throw new Error('Student not authenticated');
  }

  // Verify the balance payment
  const verification = await verifyBalancePayment({
    receiptDataUri,
    expectedAmount: 1000,
    itemName: 'Defense refreshment payment balance'
  });

  if (!verification.isApproved) {
    return verification;
  }

  // Insert into balance_payments table
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('balance_payments')
    .insert({
      student_reg_number: student.regNumber,
      item_name: 'Defense refreshment payment',
      amount: 1000,
      receipt_text: receiptDataUri,
      verified: true,
      verified_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting balance payment:', error);
    throw new Error('Failed to record balance payment');
  }

  revalidatePath('/dashboard');
  return verification;
}

export async function verifyAndRecordPayment(
  cart: Textbook[],
  receiptDataUri: string,
) {
  const student = await getStudentSession();
  if (!student) {
    throw new Error('Unauthorized');
  }

  if (!receiptDataUri) {
    return { isApproved: false, reason: 'Please upload a receipt image.'}
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  const textbookList = cart.map(item => item.name);

  try {
    const result = await verifyPaymentReceipt({
      receiptDataUri,
      expectedAmount: totalAmount,
      textbookList: textbookList.join(', '),
    });

    if (result.isApproved) {
      const { error } = await insertPaymentRecords(
        cart.map(book => ({
          studentName: student.name,
          regNumber: student.regNumber,
          itemName: book.name,
          amountPaid: book.price,
        }))
      );

      if (error) {
        console.error('Error saving record:', error);
        return {
          isApproved: true,
          reason: `Payment approved, but failed to save record: ${error}. Please contact the administrator.`
        };
      }
      
      revalidatePath('/admin/dashboard');
      revalidatePath('/dashboard');
    }

    return result;
  } catch (error) {
    console.error('AI verification failed:', error);
    return {
      isApproved: false,
      reason: 'An error occurred during verification. Please try again later.',
    };
  }
}

// --- Admin: Manual record creation ---

// --- Admin Manual Record Creation ---

export async function addManualRecord(prevState: any, formData: FormData) {
  const schema = z.object({
    regNumber: z.string().trim().min(1, 'Registration number is required.'),
    itemName: z.string().trim().min(2, 'Item name is required.'),
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    date: z.string().optional(), // ISO date string (YYYY-MM-DD)
  });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid data' };
  }

  const { regNumber, itemName, amount, date } = parsed.data;

  try {
    const supabase = await createAdminClient();

    // Look up student by reg number
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('name, reg_number')
      .eq('reg_number', regNumber)
      .single();

    if (studentError || !student) {
      return { error: 'Student not found for the provided registration number.' };
    }

    // Insert into manual_records table
    const recordTime = date ? new Date(date) : new Date();
    const recordData = {
      student_name: student.name,
      reg_number: student.reg_number,
      product: itemName,
      price: amount,
      time: recordTime,
      is_collected: true,
      collected_by: 'Admin',
      collected_at: new Date(),
    };

    const { data, error } = await supabase
      .from('manual_records')
      .insert(recordData)
      .select()
      .single();
    if (error) {
      return { error: `Failed to create record: ${error}` };
    }

  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');
  return { success: true, record: data?.[0] };
  } catch (e: any) {
    return { error: 'Unexpected error creating record.' };
  }
}
