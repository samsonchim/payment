
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSarcasticPopup } from '@/components/sarcastic-popup';
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
      background: 'hsl(0, 0%, 100%)', 
      padding: window.innerWidth < 640 ? 16 : 32, 
      fontFamily: 'Arial, sans-serif', 
      width: window.innerWidth < 640 ? 320 : 420, 
      position: 'relative',
      border: '3px solid hsl(142, 76%, 36%)',
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
        color: 'hsl(142, 76%, 90%)',
        zIndex: 0,
        opacity: 0.1
      }}>
        ✓
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: window.innerWidth < 640 ? 16 : 24, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 25%))',
          color: 'white',
          padding: window.innerWidth < 640 ? '8px 16px' : '12px 24px',
          borderRadius: '8px',
          margin: '0 auto 16px',
          display: 'inline-block',
          fontSize: window.innerWidth < 640 ? '16px' : '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          boxShadow: '0 4px 12px hsla(142, 76%, 36%, 0.3)'
        }}>
          ⭐ CLASS OF CHAMPIONS 2025 ⭐
        </div>
      </div>

      {/* Amount */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: window.innerWidth < 640 ? 16 : 24,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ 
          fontSize: window.innerWidth < 640 ? '28px' : '36px', 
          fontWeight: 'bold', 
          color: 'hsl(142, 76%, 36%)',
          marginBottom: 8
        }}>
          ₦{total.toLocaleString()}
        </div>
        <div style={{ 
          fontSize: window.innerWidth < 640 ? '14px' : '18px', 
          color: 'hsl(142, 70%, 40%)',
          fontWeight: '600'
        }}>
          Successful Transaction
        </div>
        <div style={{ 
          fontSize: window.innerWidth < 640 ? '12px' : '14px', 
          color: 'hsl(142, 40%, 40%)',
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
          background: 'hsl(138, 76%, 97%)',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid hsl(142, 76%, 80%)'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: 8,
            color: 'hsl(142, 76%, 25%)'
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
          color: 'hsl(142, 76%, 25%)',
          borderBottom: '2px solid hsl(142, 76%, 36%)',
          paddingBottom: 8
        }}>
          Items Purchased:
        </div>
        <div style={{ background: 'hsl(138, 76%, 97%)', padding: '12px', borderRadius: '6px', border: '1px solid hsl(142, 76%, 80%)' }}>
          {items.map((item: { id: string; name: string; price: number }) => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid hsl(142, 76%, 85%)',
              fontSize: '14px'
            }}>
              <span style={{ fontWeight: '500', color: 'hsl(142, 76%, 30%)' }}>{item.name}</span>
              <span style={{ fontWeight: 'bold', color: 'hsl(142, 76%, 36%)' }}>₦{item.price.toLocaleString()}</span>
            </div>
          ))}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0 8px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'hsl(142, 76%, 25%)'
          }}>
            <span>Total:</span>
            <span style={{ color: 'hsl(142, 76%, 36%)' }}>₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'linear-gradient(135deg, hsl(142, 76%, 95%), hsl(142, 76%, 85%))',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: 24,
        border: '2px solid hsl(142, 76%, 60%)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'hsl(142, 76%, 25%)',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          📋 IMPORTANT INSTRUCTION
        </div>
        <div style={{
          fontSize: '13px',
          color: 'hsl(142, 76%, 30%)',
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
        color: 'hsl(142, 76%, 30%)',
        borderTop: '2px solid hsl(142, 76%, 80%)',
        paddingTop: 16,
        position: 'relative',
        zIndex: 1,
        lineHeight: '1.4'
      }}>
        <div style={{ marginBottom: 4 }}>
          This Receipt was generated upon payment from <strong style={{ color: 'hsl(142, 76%, 36%)' }}>Neon Payment</strong>
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
  const { showSuccess, showError, showVerification, PopupComponent } = useSarcasticPopup();
  const router = useRouter();

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  // Check if student is eligible for balance payment (paid exactly ₦2,000 for Defense refreshment)
  const isEligibleForBalancePayment = () => {
    const normalize = (s?: string) => (s || '').toLowerCase().trim();
    const isDefenseBase = (name?: string) => {
      const n = normalize(name);
      // Accept common variants, exclude any balance entries
      const isDefense = n === 'defense refreshment payment' || n === 'defence refreshment payment';
      const isBalanceTag = n.includes('(balance)');
      return isDefense && !isBalanceTag;
    };

    const relevant = transactions.filter(t => isDefenseBase(t.textbookName));
    const totalPaid = relevant.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    return totalPaid === 2000;
  };

  const addToCart = (book: Textbook) => {
    if (!cart.find(item => item.id === book.id)) {
  setCart([...cart, book]);
  showSuccess(`${book.name} added to cart! Shopping spree mode activated!`);
    }
  };

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.id !== bookId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      showError('Whoa there! That file is bigger than your hopes and dreams! Keep it under 4MB, please!');
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
      showError('Hold up! You forgot to upload the receipt! How am I supposed to verify thin air?');
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
      // Show random sarcastic verification message
      showVerification();
    } else {
      setVerificationResult(result);
  showError(result.reason || 'Payment verification failed! Better double check that receipt!');
    }

    setIsVerifying(false);
  };
  
  const paidForTextbooks = new Set((transactions || []).map((t: { textbookName: string }) => t.textbookName));

  return (
    <>
      {PopupComponent}
      <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Available Textbooks</CardTitle>
            <CardDescription className="text-sm">Select the textbooks you wish to pay for.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {textbooks.map(book => (
              <Card key={book.id}>
                <CardContent className="p-3 sm:p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm sm:text-base">{book.name}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">₦{book.price.toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToCart(book)}
                    disabled={!!cart.find(i => i.id === book.id) || paidForTextbooks.has(book.name)}
                    className="text-xs sm:text-sm"
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

        {isEligibleForBalancePayment() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                Balance Payment
              </CardTitle>
              <CardDescription className="text-sm">You have a remaining balance of ₦1,000 for Defense refreshment payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/pay-balance')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Pay Balance (₦1,000)
              </Button>
            </CardContent>
          </Card>
        )}

        {transactions && transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
                Payment History
              </CardTitle>
              <CardDescription className="text-sm">Your previous payment records.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Textbook</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Collection Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs sm:text-sm">{transaction.textbookName}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">₦{transaction.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{formatDate(transaction.date)}</TableCell>
                        <TableCell className="text-center">
                          {transaction.isCollected ? (
                            <div className="flex flex-col items-center text-green-600">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
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
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs font-medium">Pending Collection</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance card moved above Payment History */}
      </div>

      <div>
        <Card className="sticky top-4 sm:top-6 lg:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" /> Your Cart
            </CardTitle>
            <CardDescription className="text-sm">Review your selection and proceed with payment verification.</CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">Your cart is empty.</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="flex-1 text-sm sm:text-base">{item.name}</span>
                      <span className="font-mono text-sm sm:text-base">₦{item.price.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={() => removeFromCart(item.id)}>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className='space-y-3 sm:space-y-4'>
                    <Alert variant="default" className="border-accent">
                        <Info className="h-4 w-4 !text-accent" />
                        <AlertTitle className="text-sm sm:text-base">Payment Information</AlertTitle>
                        <AlertDescription className="text-xs sm:text-sm">
                            Please transfer <strong>₦{totalAmount.toLocaleString()}</strong> to the account below:
                            <ul className="mt-2 list-none space-y-1 text-xs sm:text-sm">
                                <li><strong>Bank:</strong> Palmpay</li>
                                <li><strong>Account Number:</strong> 7065136040</li>
                                <li><strong>Account Name:</strong> Mmegwa Uzonna Anthony</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="receipt" className="text-sm sm:text-base">Upload Payment Receipt</Label>
                      <Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
                    </div>
                    <Button className="w-full text-sm sm:text-base" onClick={handleVerify} disabled={isVerifying}>
                      {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify Payment
                    </Button>
                </div>
                
                {verificationResult && (
                  <>
                    <Alert variant={verificationResult.isApproved ? 'default' : 'destructive'} className={verificationResult.isApproved ? 'border-green-500' : ''}>
                      {verificationResult.isApproved ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <AlertTitle className="text-sm sm:text-base">{verificationResult.isApproved ? 'Payment Approved' : 'Payment Rejected'}</AlertTitle>
                      <AlertDescription className="text-xs sm:text-sm">{verificationResult.reason}</AlertDescription>
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
                          className="mt-2 text-sm sm:text-base"
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
    </>
  );
}
