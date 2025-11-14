import { getAdminSession, getManualRecords } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ManualRecordsPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    redirect('/admin');
  }

  const records = await getManualRecords();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader user={{ name: 'Admin' }} isAdmin={true} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Manual Records</h1>
            <p className="text-sm text-muted-foreground">All transactions inserted manually by admin.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manual Payment Records</CardTitle>
            <CardDescription>{records.length} record(s) found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Reg Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-center">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.studentName}</TableCell>
                      <TableCell>{r.regNumber}</TableCell>
                      <TableCell>{r.product}</TableCell>
                      <TableCell className="text-right">₦{r.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatDate(r.time)}</TableCell>
                      <TableCell className="text-center">
                        {r.isCollected ? (
                          <span className="text-green-600 text-sm">Collected{r.collectedBy ? ` by ${r.collectedBy}` : ''}</span>
                        ) : (
                          <span className="text-orange-600 text-sm">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No manual records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
