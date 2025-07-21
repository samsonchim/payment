export interface Student {
  regNumber: string;
  name: string;
}

export interface Textbook {
  id: string;
  name:string;
  price: number;
}

export interface Transaction {
  studentName: string;
  regNumber: string;
  textbooks: string[] | any; // 'any' is for prisma json type
  totalAmount: number;
  date: string; // Will be an ISO string
}

// NOTE: This file now only contains type definitions.
// The data is now managed by Prisma in a database.
// The initial data has been moved to a seeding script.
