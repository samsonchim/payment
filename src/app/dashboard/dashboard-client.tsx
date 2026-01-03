
'use client';

import { useState, useRef } from 'react';
import { useEffect } from 'react';
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

// Lightweight confetti component (no external deps)
function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    if (!active) return;
    // inject keyframes once
    if (typeof document !== 'undefined' && !document.getElementById('confetti-styles')) {
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.innerHTML = `@keyframes confetti-fall { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }`;
      document.head.appendChild(style);
    }

    const count = 36;
    setPieces(Array.from({ length: count }, (_, i) => i));
    const cleanup = setTimeout(() => setPieces([]), 3500);
    return () => clearTimeout(cleanup);
  }, [active]);

  if (!active || pieces.length === 0) return null;

  const colors = ['#E53E3E', '#ED8936', '#ECC94B', '#38A169', '#319795', '#667EEA', '#9F7AEA'];

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]">
      {pieces.map((p) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const dur = 2.5 + Math.random() * 1;
        const bg = colors[Math.floor(Math.random() * colors.length)];
        const rotate = Math.floor(Math.random() * 360);
        const transformOrigin = Math.random() > 0.5 ? 'left' : 'right';
        return (
          <div
            key={p}
            style={{
              left: `${left}%`,
              top: '-10%',
              background: bg,
              transform: `rotate(${rotate}deg)`,
              animation: `confetti-fall ${dur}s linear ${delay}s forwards`,
              transformOrigin,
            }}
            className="absolute w-1.5 h-4 rounded-sm opacity-90"
          />
        );
      })}
    </div>
  );
}

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef(null);
  const { showSuccess, showError, PopupComponent } = useSarcasticPopup();
  const router = useRouter();

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  // Helper to compute total paid for a given textbook (includes balance entries)
  const totalPaidForBook = (bookName: string) => {
    const target = (bookName || '').toLowerCase().trim();
    return (transactions || []).reduce((sum, t) => {
      const tn = (t.textbookName || '').toLowerCase();
      if (tn.startsWith(target)) {
        return sum + (Number(t.totalAmount) || 0);
      }
      return sum;
    }, 0);
  };

  // Determine if student has paid for every textbook (amount >= price for each)
  const allPaid = textbooks && textbooks.length > 0 && textbooks.every(tb => {
    const paid = totalPaidForBook(tb.name);
    return paid >= tb.price;
  });

  const addToCart = (book: Textbook) => {
    if (!cart.find(item => item.id === book.id)) {
  setCart([...cart, book]);
  showSuccess(`${book.name} added to cart! Shopping spree mode activated!`);
    }
  };

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.id !== bookId));
  };

  const handlePaystackPayment = async () => {
    if (cart.length === 0) {
      showError('Your cart is empty!');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          textbooks: cart.map(b => ({ name: b.name, price: b.price })),
          email: `${student.regNumber}@student.com`,
          name: student.name,
          regNumber: student.regNumber,
          paymentType: 'textbooks'
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Redirect to Paystack payment page
        window.location.href = data.data.link;
      } else {
        showError(data.error || 'Failed to initialize payment');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      showError('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  // Check for payment callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const receiptParam = params.get('receipt');

    if (paymentStatus === 'success' && receiptParam) {
      try {
        const data = JSON.parse(decodeURIComponent(receiptParam));
        setReceiptData(data);
        setShowDownload(true);
        showSuccess('Payment successful! You can now download your receipt.');
        // Clean URL
        window.history.replaceState({}, '', '/dashboard');
      } catch (e) {
        console.error('Error parsing receipt:', e);
      }
    } else if (paymentStatus === 'cancelled') {
      showError('Payment was cancelled');
      window.history.replaceState({}, '', '/dashboard');
    } else if (paymentStatus === 'failed') {
      showError('Payment failed. Please try again.');
      window.history.replaceState({}, '', '/dashboard');
    } else if (paymentStatus === 'error') {
      showError('An error occurred during payment.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);
  
  const paidForTextbooks = new Set((transactions || []).map((t: { textbookName: string }) => t.textbookName));

  return (
    <>
      {PopupComponent}
      {/* Support link for issues */}
      <div className="mb-3">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="text-sm">Need help?</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm flex items-center gap-2">
            If you have issues, Message Me.
            <a
              href="https://wa.me/2349162035539"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 rounded border text-xs sm:text-sm hover:bg-accent"
            >
              Message Me on WhatsApp
            </a>
          </AlertDescription>
        </Alert>
      </div>
      {/* All-paid message */}
      {allPaid && (
        <div className="mb-4 relative">
          <Card>
            <CardHeader>
              <CardTitle>You have paid for everything</CardTitle>
              <CardDescription>omo you too take this school something serious o!</CardDescription>
            </CardHeader>
          </Card>
          <Confetti active={allPaid} />
        </div>
      )}
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

      {!allPaid && (
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
                    <Alert variant="default" className="border-green-500 bg-green-50">
                        <Info className="h-4 w-4 !text-green-600" />
                        <AlertTitle className="text-sm sm:text-base text-green-900">Secure Payment</AlertTitle>
                        <AlertDescription className="text-xs sm:text-sm text-green-800">
                          Click to pay.
                        </AlertDescription>
                    </Alert>

                    <Button
                      className="w-full text-sm sm:text-base bg-orange-500 hover:bg-orange-600"
                      onClick={handlePaystackPayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ₦${totalAmount.toLocaleString()} with Paystack`
                      )}
                    </Button>
                </div>
                
                {showDownload && receiptData && (
                      <div style={{ marginTop: 24, textAlign: 'center' }}>
                    {/* Hidden receipt for PNG rendering */}
                    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                      <div ref={receiptRef}>
                        <ReceiptContent 
                          userName={receiptData.studentName || student?.name || 'User'} 
                          items={receiptData.textbooks || []} 
                          total={receiptData.amount || 0} 
                        />
                      </div>
                    </div>
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-sm sm:text-base text-green-900">Payment Successful!</AlertTitle>
                      <AlertDescription className="text-xs sm:text-sm text-green-800">
                        Transaction Reference: <strong>{receiptData.tx_ref}</strong>
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => downloadReceiptAsPng(receiptRef, receiptData.studentName || student?.name || 'User')}
                      className="w-full mt-2 text-sm sm:text-base"
                    >
                      Download Receipt (PNG)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
