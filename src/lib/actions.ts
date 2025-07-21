
'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Textbook, Student, Transaction } from './data';
import { verifyPaymentReceipt } from '@/ai/flows/verify-payment-receipt';
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
  
  const supabase = createAdminClient();
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

  cookies().set(STUDENT_COOKIE, JSON.stringify(studentData), {
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
    cookies().set(ADMIN_COOKIE, 'true', {
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
  cookies().delete(STUDENT_COOKIE);
  cookies().delete(ADMIN_COOKIE);
}

// --- Session Actions ---

export async function getStudentSession(): Promise<Student | null> {
  const cookie = cookies().get(STUDENT_COOKIE);
  if (cookie) {
    return JSON.parse(cookie.value);
  }
  return null;
}

export async function getAdminSession() {
  return cookies().get(ADMIN_COOKIE)?.value === 'true';
}

// --- Data Fetching Actions ---

export async function getTextbooks(): Promise<Textbook[]> {
  const supabase = createAdminClient();
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

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
      console.error('Error fetching transactions:', error);
      return [];
  }
  
  return (data || []).map(t => ({
      id: t.id,
      studentName: t.student_name, 
      regNumber: t.reg_number,
      textbookName: t.name,
      totalAmount: t.amount_paid,
      date: new Date(t.created_at).toISOString() 
  }));
}

export async function getStudentTransactions(regNumber: string): Promise<Transaction[]> {
  if (!regNumber) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('reg_number', regNumber)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching student transactions:', error);
    return [];
  }

  return (data || []).map(t => ({
      id: t.id,
      studentName: t.student_name,
      regNumber: t.reg_number,
      textbookName: t.name,
      totalAmount: t.amount_paid,
      date: new Date(t.created_at).toISOString()
  }));
}


export async function getStudents(): Promise<Student[]> {
  const supabase = createAdminClient();
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
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting transaction:', error);
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
  
  const supabase = createAdminClient();
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

  const supabase = createAdminClient();
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
    const supabase = createAdminClient();
    const { error } = await supabase.from('textbooks').delete().eq('id', id);
    if (error) {
        return { error: "Error deleting textbook." };
    }
    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true };
}


// --- Student Payment Action ---

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
      const supabaseAdmin = createAdminClient();
      const recordsToInsert = cart.map(book => ({
        student_name: student.name,
        reg_number: student.regNumber,
        name: book.name,
        amount_paid: book.price,
      }));

      const { error } = await supabaseAdmin.from('records').insert(recordsToInsert);

      if (error) {
        console.error('Error saving record:', error);
        // Return a specific error message if the database insert fails
        return {
          isApproved: true, // The payment itself was valid
          reason: `Payment approved, but failed to save record: ${error.message}. Please contact the administrator.`
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
