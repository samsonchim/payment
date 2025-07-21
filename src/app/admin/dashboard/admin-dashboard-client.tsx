
'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Student, Textbook, Transaction } from '@/lib/data';
import { FileDown, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addTextbook, deleteTextbook, updateTextbook } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const TextbookForm = ({ textbook, onDone }: { textbook?: Textbook, onDone: () => void }) => {
    const action = textbook ? updateTextbook : addTextbook;
    const [state, formAction, isPending] = useActionState(action, null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            toast({ title: textbook ? 'Textbook updated' : 'Textbook added' });
            router.refresh();
            onDone();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, textbook, onDone, router, toast]);
    
    return (
        <form action={formAction}>
            {textbook && <input type="hidden" name="id" value={textbook.id} />}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Textbook Name</Label>
                    <Input id="name" name="name" defaultValue={textbook?.name} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Price (NGN)</Label>
                    <Input id="price" name="price" type="number" defaultValue={textbook?.price} required />
                </div>
            </div>
            <DialogFooter className='mt-4'>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : (textbook ? 'Update Textbook' : 'Add Textbook')}
                </Button>
            </DialogFooter>
        </form>
    );
};

export function AdminDashboardClient({
  initialTextbooks,
  initialTransactions,
  initialStudents,
}: {
  initialTextbooks: Textbook[];
  initialTransactions: Transaction[];
  initialStudents: Student[];
}) {
  const [textbooks, setTextbooks] = useState(initialTextbooks);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [students, setStudents] = useState(initialStudents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTextbook, setEditingTextbook] = useState<Textbook | undefined>(undefined);
  const { toast } = useToast();
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  const handleDownload = () => {
    const headers = "Student Name,Registration Number,Textbook,Amount Paid,Date of Payment\n";
    const csvContent = transactions
      .map(t => `"${t.studentName}","${t.regNumber}","${t.textbookName}",${t.totalAmount},"${formatDate(t.date)}"`)
      .join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = 'payment_records.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to delete this textbook?')) {
        const result = await deleteTextbook(id);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            setTextbooks(prev => prev.filter(t => t.id !== id));
            toast({ title: 'Textbook deleted' });
            router.refresh();
        }
    }
  }

  return (
    <Tabs defaultValue="textbooks">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="textbooks">Manage Textbooks</TabsTrigger>
        <TabsTrigger value="transactions">Payment Records</TabsTrigger>
        <TabsTrigger value="students">Students</TabsTrigger>
      </TabsList>
      <TabsContent value="textbooks">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Manage Textbooks</CardTitle>
              <CardDescription>Add, edit, or remove available textbooks.</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                  <Button size="sm" className="gap-1" onClick={() => { setEditingTextbook(undefined); setDialogOpen(true)}}>
                      <PlusCircle className="h-4 w-4" />
                      Add New
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{editingTextbook ? 'Edit Textbook' : 'Add New Textbook'}</DialogTitle>
                      <DialogDescription>
                          {editingTextbook ? 'Update the details of the textbook.' : 'Fill in the details for the new textbook.'}
                      </DialogDescription>
                  </DialogHeader>
                  <TextbookForm textbook={editingTextbook} onDone={() => { setDialogOpen(false); }} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {textbooks.map(book => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.name}</TableCell>
                    <TableCell className="text-right">₦{book.price.toLocaleString()}</TableCell>
                     <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => { setEditingTextbook(book); setDialogOpen(true); }}>
                             <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                         </Button>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="transactions">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>
                {transactions.length} approved transaction(s) recorded.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={handleDownload} disabled={transactions.length === 0}>
              <FileDown className="h-4 w-4" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Reg Number</TableHead>
                          <TableHead>Textbook</TableHead>
                          <TableHead className="text-right">Amount Paid</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {transactions.length > 0 ? (
                          transactions.map((t, i) => (
                              <TableRow key={i}>
                                  <TableCell>{t.studentName}</TableCell>
                                  <TableCell>{t.regNumber}</TableCell>
                                  <TableCell>{t.textbookName}</TableCell>
                                  <TableCell className="text-right">₦{t.totalAmount.toLocaleString()}</TableCell>
                                   <TableCell className="text-right">{formatDate(t.date)}</TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center">No transactions yet.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="students">
        <Card>
            <CardHeader>
                <CardTitle>Registered Students</CardTitle>
                <CardDescription>A list of all students in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Registration Number</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student: Student) => (
                            <TableRow key={student.regNumber}>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.regNumber}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
