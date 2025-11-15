export interface Student {
  id: string;
  regNumber: string;
  name: string;
}

export interface Textbook {
  id: string;
  name:string;
  price: number;
}

export interface Transaction {
  id: string;
  studentName: string;
  regNumber: string;
  textbookName: string; 
  totalAmount: number;
  date: string; // Will be an ISO string
  isCollected?: boolean;
  collectedBy?: string;
  collectedAt?: string;
  receiptPath?: string;
}

export interface ManualRecord {
  id: string;
  studentName: string;
  regNumber: string;
  product: string;
  price: number;
  time: string;
  isCollected?: boolean;
  collectedBy?: string;
  collectedAt?: string;
}

export interface BalancePayment {
  id: string;
  studentRegNumber: string;
  itemName: string;
  amount: number;
  receiptPath: string;
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

// NOTE: This file now only contains type definitions.
// The data is now managed by the database.
