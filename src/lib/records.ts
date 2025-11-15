'use server';

import { createAdminClient } from '@/lib/supabase/server';

export type NewRecordInput = {
  studentName: string;
  regNumber: string;
  itemName: string; // textbook or item paid for
  amountPaid: number;
  createdAt?: string | Date; // optional custom timestamp
  isCollected?: boolean; // optional, defaults to false
  collectedBy?: string;
  collectedAt?: string | Date;
  receiptText?: string; // optional public path or data-uri for attached receipt
};

/**
 * Inserts one or more payment records into the `records` table.
 * This is the single path both the AI approval flow and admin manual insert use,
 * so behavior stays consistent across dashboards.
 */
export async function insertPaymentRecords(records: NewRecordInput[]) {
  if (!records.length) return { data: [], error: undefined };

  const supabase = await createAdminClient();

  const payload = records.map((r) => {
    const base: any = {
      student_name: r.studentName,
      reg_number: r.regNumber,
      name: r.itemName,
      amount_paid: r.amountPaid,
    };
    if (r.createdAt) {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) base.created_at = d.toISOString();
    }
    if (r.isCollected !== undefined) base.isCollected = r.isCollected;
    if (r.collectedBy) base.collectedBy = r.collectedBy;
    if (r.collectedAt) {
      const d = new Date(r.collectedAt);
      if (!isNaN(d.getTime())) base.collectedAt = d.toISOString();
    }
    if (r.receiptText) base.receipt_text = r.receiptText;
    return base;
  });

  const { data, error } = await supabase
    .from('records')
    .insert(payload)
    .select('*');

  if (error) return { data: [], error: error.message };
  return { data, error: undefined };
}
