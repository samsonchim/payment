
'use client';

import { useState, useRef } from 'react';
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

// For PNG receipt generation
// @ts-ignore
import html2canvas from 'html2canvas';

interface ReceiptContentProps {
  userName: string;
  items: { id: string; name: string; price: number }[];
  total: number;
}
function ReceiptContent({ userName, items, total }: ReceiptContentProps) {
  return (
    <div id="receipt-content" style={{ background: '#fff', padding: 24, fontFamily: 'Arial', width: 400 }}>
      <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 16 }}>CLASS of CHAMPIONS 2023</h1>
      <p><strong>Name:</strong> {userName}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '24px 0' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Item</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: { id: string; name: string; price: number }) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>₦{item.price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: 8, fontWeight: 'bold' }}>Total</td>
            <td style={{ border: '1px solid #ddd', padding: 8, fontWeight: 'bold' }}>₦{total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#888' }}>by Samson Chi</div>
    </div>
  );
}

async function downloadReceiptAsPng(receiptRef: React.RefObject<HTMLDivElement>, userName: string) {
  if (!receiptRef.current) return;
  const canvas = await html2canvas(receiptRef.current);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${userName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
  const [cart, setCart] = useState<Textbook[]>([]);
  const [receiptDataUri, setReceiptDataUri] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isApproved: boolean; reason: string } | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const receiptRef = useRef(null);
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
      reason: "Payment verified successfully! You can now download your receipt. Please send a screenshot of your receipt to Samson's WhatsApp."
    });
  setShowDownload(true);

    } else {
        setVerificationResult(result);
    }

    setIsVerifying(false);
  };
  
  const paidForTextbooks = new Set((transactions || []).map((t: { textbookName: string }) => t.textbookName));

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
                    return (
                      <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                          <Card>
                            <CardHeader>
                              <CardTitle>Available Textbooks</CardTitle>
                              <CardDescription>Select the textbooks you wish to pay for.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                              {textbooks.map((book: { id: string; name: string; price: number }) => (
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
                                      disabled={!!cart.find((i: { id: string }) => i.id === book.id) || paidForTextbooks.has(book.name)}
                                    >
                                      {cart.find((i: { id: string }) => i.id === book.id) 
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
                          {/* ...existing code... */}
                        </div>
                        {/* ...existing code... */}
                      </div>
                    );
                  }
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
                                <li><strong>Bank:</strong> Opay</li>
                                <li><strong>Account Number:</strong> 7065136040</li>
                                <li><strong>Account Name:</strong> Mmegwa Uzonna Anthony</li>
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
                  <>
                    <Alert variant={verificationResult.isApproved ? 'default' : 'destructive'} className={verificationResult.isApproved ? 'border-green-500' : ''}>
                      {verificationResult.isApproved ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <AlertTitle>{verificationResult.isApproved ? 'Payment Approved' : 'Payment Rejected'}</AlertTitle>
                      <AlertDescription>{verificationResult.reason}</AlertDescription>
                    </Alert>
                    {verificationResult.isApproved && showDownload && (
                      <div style={{ marginTop: 24, textAlign: 'center' }}>
                        {/* Hidden receipt for PNG rendering */}
                        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                          <div ref={receiptRef}>
                            <ReceiptContent userName={student?.name || 'User'} items={cart} total={totalAmount} />
                          </div>
                        </div>
                        <Button
                          onClick={() => downloadReceiptAsPng(receiptRef, student?.name || 'User')}
                          className="mt-2"
                        >
                          Download Receipt (PNG)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
