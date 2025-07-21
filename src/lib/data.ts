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
}

// NOTE: This file now only contains type definitions.
// The data is now managed by the database.
