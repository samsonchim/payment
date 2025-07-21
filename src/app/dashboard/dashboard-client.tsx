
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { verifyAndRecordPayment } from '@/lib/actions';
import type { Student, Textbook, Transaction } from '@/lib/data';
import { ShoppingCart, CheckCircle, XCircle, Loader2, Info, History } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

export function DashboardClient({ student, textbooks, transactions }: { student: Student; textbooks: Textbook[], transactions: Transaction[] }) {
  const [cart, setCart] = useState<Textbook[]>([]);
  const [receiptDataUri, setReceiptDataUri] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isApproved: boolean; reason: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  const addToCart = (book: Textbook) => {
    if (!cart.find(item => item.id === book.id)) {
      setCart([...cart, book]);
      toast({
        title: `${book.name} added to cart.`,
      });
    }
  };

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.id !== bookId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a receipt smaller than 4MB.' });
          e.target.value = ''; // Reset file input
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!receiptDataUri) {
      toast({ variant: 'destructive', title: 'No receipt uploaded', description: 'Please upload a payment receipt.' });
      return;
    }
    setIsVerifying(true);
    setVerificationResult(null);
    const result = await verifyAndRecordPayment(cart, receiptDataUri);

    if (result.isApproved) {
        setVerificationResult({
            isApproved: true,
            reason: "Payment verified successfully! Please send a screenshot of your receipt to Samson's WhatsApp. Your dashboard will reset shortly."
        });

        // Wait a few seconds before resetting the state so the user can read the message
        setTimeout(() => {
            setCart([]);
            setReceiptDataUri(null);
            setVerificationResult(null);
            router.refresh(); 
        }, 5000); 

    } else {
        setVerificationResult(result);
    }

    setIsVerifying(false);
  };
  
  const paidForTextbooks = new Set(transactions.map(t => t.textbookName));

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Available Textbooks</CardTitle>
            <CardDescription>Select the textbooks you wish to pay for.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {textbooks.map(book => (
              <Card key={book.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{book.name}</p>
                    <p className="text-muted-foreground">₦{book.price.toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToCart(book)}
                    disabled={!!cart.find(i => i.id === book.id) || paidForTextbooks.has(book.name)}
                  >
                    {cart.find(i => i.id === book.id) 
                      ? 'In Cart' 
                      : paidForTextbooks.has(book.name)
                        ? 'Paid'
                        : 'Add to Cart'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <History className="h-6 w-6" /> Payment History
              </CardTitle>
              <CardDescription>A record of your past payments.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Textbook</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>{t.textbookName}</TableCell>
                      <TableCell className="text-right">₦{t.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" /> Your Cart
            </CardTitle>
            <CardDescription>Review your selection and proceed with payment verification.</CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="flex-1">{item.name}</span>
                      <span className="font-mono">₦{item.price.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={() => removeFromCart(item.id)}>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className='space-y-4'>
                    <Alert variant="default" className="border-accent">
                        <Info className="h-4 w-4 !text-accent" />
                        <AlertTitle>Payment Information</AlertTitle>
                        <AlertDescription>
                            Please transfer <strong>₦{totalAmount.toLocaleString()}</strong> to the account below:
                            <ul className="mt-2 list-none space-y-1">
                                <li><strong>Bank:</strong> Moniepoint</li>
                                <li><strong>Account Number:</strong> 9162035539</li>
                                <li><strong>Account Name:</strong> Chimaraoke Samson</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="receipt">Upload Payment Receipt</Label>
                      <Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <Button className="w-full" onClick={handleVerify} disabled={isVerifying}>
                      {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify Payment
                    </Button>
                </div>
                
                {verificationResult && (
                  <Alert variant={verificationResult.isApproved ? 'default' : 'destructive'} className={verificationResult.isApproved ? 'border-green-500' : ''}>
                    {verificationResult.isApproved ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>{verificationResult.isApproved ? 'Payment Approved' : 'Payment Rejected'}</AlertTitle>
                    <AlertDescription>{verificationResult.reason}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
