
import { getStudentSession, getTextbooks, getStudentTransactions } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { DashboardClient } from './dashboard-client';
import { AppHeader } from '@/components/app-header';

export default async function DashboardPage() {
  const student = await getStudentSession();
  if (!student) {
    redirect('/');
  }

  const textbooks = await getTextbooks();
  const transactions = await getStudentTransactions(student.regNumber);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader user={student} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DashboardClient student={student} textbooks={textbooks} transactions={transactions} />
      </main>
    </div>
  );
}
