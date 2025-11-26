'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSarcasticPopup } from '@/components/sarcastic-popup';
import { Loader2, CheckCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayBalancePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccess, showError, PopupComponent } = useSarcasticPopup();
  const router = useRouter();

  const handleFlutterwavePayment = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/flutterwave/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          textbooks: [{ name: 'Defense refreshment payment (Balance)', price: 1000 }],
          email: '', // Will use student session email
          name: '', // Will use student session name
          regNumber: '', // Will use student session
          paymentType: 'balance'
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Redirect to Flutterwave payment page
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
    const type = params.get('type');

    if (paymentStatus === 'success' && type === 'balance') {
      showSuccess('Balance payment successful! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else if (paymentStatus === 'cancelled') {
      showError('Payment was cancelled');
      window.history.replaceState({}, '', '/pay-balance');
    } else if (paymentStatus === 'failed') {
      showError('Payment failed. Please try again.');
      window.history.replaceState({}, '', '/pay-balance');
    } else if (paymentStatus === 'error') {
      showError('An error occurred during payment.');
      window.history.replaceState({}, '', '/pay-balance');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Pay Balance - Defense Refreshment Payment
            </CardTitle>
            <CardDescription className="text-center">
              Complete your payment for the remaining ₦1,000 balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Secure Payment
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Amount:</strong> ₦1,000</p>
                <p><strong>Description:</strong> Defense refreshment payment balance</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Pay securely with your card or bank transfer via Flutterwave
                </p>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handleFlutterwavePayment}
              disabled={isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay ₦1,000 with Flutterwave'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Secure payment powered by Flutterwave</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {PopupComponent}
    </div>
  );
}