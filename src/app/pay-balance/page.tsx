'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSarcasticPopup } from '@/components/sarcastic-popup';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayBalancePage() {
  const [receiptDataUri, setReceiptDataUri] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isApproved: boolean; reason: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError, PopupComponent } = useSarcasticPopup();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        showError('Whoa there! That file is bigger than your hopes and dreams! Keep it under 4MB, please!');
        e.target.value = ''; // Reset file input
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setReceiptDataUri(result);
          showSuccess('Receipt uploaded! Ready to submit.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!receiptDataUri) {
      showError('Please upload a receipt first!');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/balance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptDataUri }),
      });
      const result = await res.json();
      if (res.ok) {
        const message = result?.message || 'Payment submitted and pending admin confirmation.';
        setVerificationResult({ isApproved: true, reason: message });
        showSuccess(message);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        showError(result?.error ?? 'Submission failed');
      }
    } catch (error) {
      console.error('Balance payment error:', error);
      showError('Oops! Something went wrong. Please try again!');
    } finally {
      setIsVerifying(false);
    }
  };

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
            {/* Account Details */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Payment Details</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Amount:</strong> ₦1,000</p>
                <p><strong>Account Name:</strong> Promise Ogbu Ucha</p>
                <p className="text-xs text-muted-foreground">(Also accepted: Promise Ucha Ogbu, Ogbu Ucha Promise)</p>
                <p><strong>Account Number:</strong> 9135315917</p>
                <p><strong>Bank:</strong> Opay or Opay MFB</p>
                <p><strong>Description:</strong> Defense refreshment payment balance</p>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-4">
              <Label htmlFor="receipt" className="text-base font-medium">
                Upload Payment Receipt
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt"
                />
                <div className="space-y-4">
                  {receiptDataUri ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="text-sm text-gray-600">Receipt uploaded successfully!</p>
                      <img
                        src={receiptDataUri}
                        alt="Receipt preview"
                        className="max-w-full h-48 object-contain mx-auto border rounded"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        Click to upload your payment receipt
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 4MB
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isVerifying}
                  >
                    {receiptDataUri ? 'Change Receipt' : 'Select Receipt'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!receiptDataUri || isVerifying}
              className="w-full"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Payment'
              )}
            </Button>

            {/* Verification Result */}
            {verificationResult && (
              (() => {
                const isPending = verificationResult.reason?.toLowerCase().includes('pending');
                const isApproved = verificationResult.isApproved && !isPending;
                const boxClass = isPending
                  ? 'bg-blue-50 border border-blue-200'
                  : isApproved
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200';
                const iconClass = isPending
                  ? 'text-blue-500'
                  : isApproved
                    ? 'text-green-500'
                    : 'text-red-500';
                const titleClass = isPending
                  ? 'text-blue-800'
                  : isApproved
                    ? 'text-green-800'
                    : 'text-red-800';
                const textClass = isPending
                  ? 'text-blue-700'
                  : isApproved
                    ? 'text-green-700'
                    : 'text-red-700';
                const title = isPending
                  ? 'Payment Submitted'
                  : isApproved
                    ? 'Payment Approved!'
                    : 'Payment Rejected';
                return (
                  <div className={`p-4 rounded-lg ${boxClass}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-5 w-5 ${iconClass}`} />
                      <span className={`font-medium ${titleClass}`}>{title}</span>
                    </div>
                    <p className={`text-sm mt-1 ${textClass}`}>
                      {verificationResult.reason}
                    </p>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>
      {PopupComponent}
    </div>
  );
}