
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
    <div id="receipt-content" style={{ 
      background: '#fff', 
      padding: 32, 
      fontFamily: 'Arial, sans-serif', 
      width: 420, 
      position: 'relative',
      border: '1px solid #e5e5e5',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Watermark - Success Icon */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '120px',
        color: '#f0f9ff',
        zIndex: 0,
        opacity: 0.1
      }}>
        ✓
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          margin: '0 auto 16px',
          display: 'inline-block',
          fontSize: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          ⭐ CLASS OF CHAMPIONS 2025 ⭐
        </div>
      </div>

      {/* Amount */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 24,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ 
          fontSize: '36px', 
          fontWeight: 'bold', 
          color: '#3b82f6',
          marginBottom: 8
        }}>
          ₦{total.toLocaleString()}
        </div>
        <div style={{ 
          fontSize: '18px', 
          color: '#16a34a',
          fontWeight: '600'
        }}>
          Successful Transaction
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          marginTop: 4
        }}>
          {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>

      {/* Student Info */}
      <div style={{ 
        marginBottom: 24,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: 8,
            color: '#1e293b'
          }}>
            Student: {userName}
          </div>
        </div>
      </div>

      {/* Transaction Info */}
      <div style={{ 
        marginBottom: 24,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: 12,
          color: '#1e293b',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: 8
        }}>
          Items Purchased:
        </div>
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
          {items.map((item: { id: string; name: string; price: number }) => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '14px'
            }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>{item.name}</span>
              <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>₦{item.price.toLocaleString()}</span>
            </div>
          ))}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0 8px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1e293b'
          }}>
            <span>Total:</span>
            <span style={{ color: '#3b82f6' }}>₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7, #fbbf24)',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: 24,
        border: '1px solid #f59e0b',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#92400e',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          📋 IMPORTANT INSTRUCTION
        </div>
        <div style={{
          fontSize: '13px',
          color: '#92400e',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          Keep this receipt safe or send it to the Course Representative
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '11px', 
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        paddingTop: 16,
        position: 'relative',
        zIndex: 1,
        lineHeight: '1.4'
      }}>
        <div style={{ marginBottom: 4 }}>
          This Receipt was generated upon payment from <strong style={{ color: '#3b82f6' }}>Neon Payment</strong>
        </div>
        <div style={{ fontSize: '10px' }}>
          Developer: <strong>Samson Chi</strong>
        </div>
      </div>
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

interface DashboardClientProps {
  student: Student;
  textbooks: Textbook[];
  transactions: Transaction[];
}

export function DashboardClient({ student, textbooks, transactions }: DashboardClientProps) {
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
        reason: "Payment verified successfully! You can now download your receipt."
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

        {transactions && transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Your previous payment records.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Textbook</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="text-center">Collection Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{transaction.textbookName}</TableCell>
                      <TableCell className="text-right">₦{transaction.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatDate(transaction.date)}</TableCell>
                      <TableCell className="text-center">
                        {transaction.isCollected ? (
                          <div className="flex flex-col items-center text-green-600">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Collected</span>
                            </div>
                            <span className="text-xs text-muted-foreground">by {transaction.collectedBy}</span>
                            {transaction.collectedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(transaction.collectedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Pending Collection</span>
                          </div>
                        )}
                      </TableCell>
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
