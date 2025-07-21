
import { getAdminSession, getStudents, getTextbooks, getTransactions } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { AdminDashboardClient } from './admin-dashboard-client';
import { AppHeader } from '@/components/app-header';

export default async function AdminDashboardPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    redirect('/admin');
  }

  const textbooks = await getTextbooks();
  const transactions = await getTransactions();
  const students = await getStudents();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader user={{ name: 'Admin' }} isAdmin={true} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <AdminDashboardClient 
          initialTextbooks={textbooks} 
          initialTransactions={transactions}
          initialStudents={students}
        />
      </main>
    </div>
  );
}
