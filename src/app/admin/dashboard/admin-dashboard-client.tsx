
'use client';

import { useState, useEffect, useRef } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Student, Textbook, Transaction } from '@/lib/data';
import { FileDown, PlusCircle, Trash2, Edit, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addTextbook, deleteTextbook, updateTextbook, deleteTransaction, updateCollectionStatus, addManualRecord } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

// Helper for collection state
function CollectionDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (collector: string) => void }) {
  const [collector, setCollector] = useState('');
  const [bySelf, setBySelf] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Collection</DialogTitle>
          <DialogDescription>Enter who collected the textbook or tick 'Collect by self'.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="collector">Collector Name</Label>
          <Input id="collector" value={collector} onChange={e => setCollector(e.target.value)} disabled={bySelf} />
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="bySelf" checked={bySelf} onChange={e => setBySelf(e.target.checked)} />
            <Label htmlFor="bySelf">Collect by self</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onConfirm(bySelf ? 'Self' : collector)} disabled={!bySelf && !collector}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

  // Keep local state in sync when server props refresh
  useEffect(() => { setTransactions(initialTransactions); }, [initialTransactions]);
  useEffect(() => { setTextbooks(initialTextbooks); }, [initialTextbooks]);
  useEffect(() => { setStudents(initialStudents); }, [initialStudents]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [collectingTransactionId, setCollectingTransactionId] = useState<string | null>(null);
  
  // Initialize collected state from database data
  const [collected, setCollected] = useState<Record<string, { by: string, date: string }>>(() => {
    const initialCollected: Record<string, { by: string, date: string }> = {};
    initialTransactions.forEach(t => {
      if (t.isCollected && t.collectedBy && t.collectedAt) {
        initialCollected[t.id] = { by: t.collectedBy, date: t.collectedAt };
      }
    });
    return initialCollected;
  });
  // Recompute collected map whenever transactions refresh from server or change locally
  useEffect(() => {
    const next: Record<string, { by: string, date: string }> = {};
    transactions.forEach(t => {
      if (t.isCollected && t.collectedBy && t.collectedAt) {
        next[t.id] = { by: t.collectedBy, date: t.collectedAt };
      }
    });
    setCollected(next);
  }, [transactions]);
  
  const [editingTextbook, setEditingTextbook] = useState<Textbook | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
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

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  }

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    const result = await deleteTransaction(transactionToDelete.id);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
      toast({ title: 'Transaction deleted successfully' });
      router.refresh();
    }

    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  }

  const handleCollect = (transactionId: string) => {
    setCollectingTransactionId(transactionId);
    setCollectionDialogOpen(true);
  };

  const confirmCollect = async (collector: string) => {
    if (collectingTransactionId) {
      const result = await updateCollectionStatus(collectingTransactionId, collector);
      
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        // Update local transactions state
        setTransactions(prev => prev.map(t => 
          t.id === collectingTransactionId 
            ? { ...t, isCollected: true, collectedBy: collector, collectedAt: new Date().toISOString() }
            : t
        ));
        
        // Update local collected state for UI
        setCollected(prev => ({
          ...prev,
          [collectingTransactionId]: { by: collector, date: new Date().toISOString() }
        }));
        
        toast({ title: 'Textbook marked as collected and saved to database.' });
      }
    }
    setCollectionDialogOpen(false);
    setCollectingTransactionId(null);
  };

  // Manual record form component
  const ManualRecordForm = ({ onDone }: { onDone: () => void }) => {
    const [state, formAction, isPending] = useActionState(addManualRecord, null);
    const [regNumber, setRegNumber] = useState('');
    const student = students.find(s => s.regNumber === regNumber);
    const handledRef = useRef(false);

    useEffect(() => {
      if (state?.success && !handledRef.current) {
        handledRef.current = true;
        toast({ title: 'Record created successfully' });
        router.refresh();
        setTimeout(() => onDone(), 1000); // Delay closing to allow refresh to show the new record
      }
      if (state?.error && !handledRef.current) {
        handledRef.current = true;
        toast({ variant: 'destructive', title: 'Error', description: state.error });
      }
    }, [state, onDone, toast, router]);

    const today = new Date().toISOString().split('T')[0];

    return (
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="regNumber">Registration Number</Label>
          <Input id="regNumber" name="regNumber" value={regNumber} onChange={e => setRegNumber(e.target.value)} required />
          <p className="text-sm text-muted-foreground">
            {regNumber && (student ? `Student: ${student.name}` : 'No student found for this registration number')}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemName">What they paid for</Label>
          <Input id="itemName" name="itemName" placeholder="e.g. Discrete Structures" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (NGN)</Label>
          <Input id="amount" name="amount" type="number" min="1" step="1" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Create Record'}</Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <>
      <Tabs defaultValue="textbooks">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="textbooks">Manage Textbooks</TabsTrigger>
        <TabsTrigger value="transactions">Payment Records</TabsTrigger>
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
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Add Manual Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Manual Payment Record</DialogTitle>
                    <DialogDescription>Enter registration number, item, amount, and date. The student name will be matched automatically.</DialogDescription>
                  </DialogHeader>
                  <ManualRecordForm onDone={() => setDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              <Button size="sm" className="gap-1" onClick={handleDownload} disabled={transactions.length === 0}>
                <FileDown className="h-4 w-4" />
                Download CSV
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => router.push('/admin/manual-records')}>
                Show Manual Records
              </Button>
            </div>
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>
                {transactions.length} approved transaction(s) recorded.
              </CardDescription>
            </div>
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
                          <TableHead className="text-center">Collected</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {transactions.length > 0 ? (
                          transactions.map((t, i) => (
                              <TableRow key={t.id}>
                                  <TableCell>{t.studentName}</TableCell>
                                  <TableCell>{t.regNumber}</TableCell>
                                  <TableCell>{t.textbookName}</TableCell>
                                  <TableCell className="text-right">₦{t.totalAmount.toLocaleString()}</TableCell>
                                  <TableCell className="text-right">{formatDate(t.date)}</TableCell>
                                  <TableCell className="text-center">
                                    {collected[t.id] ? (
                                      <span className="flex flex-col items-center text-green-600">
                                        <CheckCircle className="h-4 w-4 mb-1" />
                                        <span className="text-xs">{collected[t.id].by}</span>
                                        <span className="text-xs">{new Date(collected[t.id].date).toLocaleDateString()}</span>
                                      </span>
                                    ) : (
                                      <Button size="sm" variant="outline" onClick={() => handleCollect(t.id)}>
                                        Collect
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteTransaction(t)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={7} className="text-center">No transactions yet.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
              <CollectionDialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen} onConfirm={confirmCollect} />
          </CardContent>
        </Card>
    </TabsContent>
    </Tabs>
    
    {/* Delete Transaction Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this payment record?
            This action cannot be undone and will permanently remove this transaction record from the database.
          </AlertDialogDescription>
          {transactionToDelete && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <strong>Student:</strong> {transactionToDelete.studentName}<br/>
              <strong>Registration:</strong> {transactionToDelete.regNumber}<br/>
              <strong>Textbook:</strong> {transactionToDelete.textbookName}<br/>
              <strong>Amount:</strong> ₦{transactionToDelete.totalAmount.toLocaleString()}
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDeleteTransaction}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Transaction
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
