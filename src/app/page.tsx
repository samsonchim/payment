'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginStudent } from '@/lib/actions';
import { AppLogo } from '@/components/icons';
import { Preloader } from '@/components/preloader';
import { useSarcasticPopup } from '@/components/sarcastic-popup';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}

export default function StudentLoginPage() {
  const router = useRouter();
  const { showSuccess, showError, PopupComponent } = useSarcasticPopup();
  const [state, formAction] = useActionState(loginStudent, null);
  const [showPreloader, setShowPreloader] = useState(true);

  const handled = useRef({ success: false, error: false });
  useEffect(() => {
    if (state?.success && !handled.current.success) {
      handled.current.success = true;
      showSuccess('Login successful! Welcome back, scholar!');
      router.replace('/dashboard');
    } else if (state?.error && !handled.current.error) {
      handled.current.error = true;
      showError(state.error || 'Login failed! Did you forget your name again?');
    }
    // Only depend on state and router to avoid re-running due to changing function identities
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, router]);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} duration={2500} />;
  }

  return (
    <>
      {PopupComponent}
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-white">
        <div className="w-full max-w-md">
          {/* Welcome Banner */}
          <div className="mb-6 text-center">
         
            <p className="text-green-600 font-medium">
           { /*  Time to pay up and level up! */}
            </p>
          </div>
          <div className="relative">
            <Card className="shadow-xl border-green-200">
            <CardHeader className="text-center bg-gradient-to-br from-green-50 to-white">
              <div className="mx-auto mb-4">
                <AppLogo />
              </div>
              <CardTitle className="text-2xl text-green-800">Student Login</CardTitle>
              <CardDescription className="text-green-600">Enter your registration number to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regNumber" className="text-green-700">Registration Number</Label>
                  <Input
                    id="regNumber"
                    name="regNumber"
                    placeholder="20231385311"
                    required
                    className="text-base border-green-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <SubmitButton />
              </form>
            </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-center text-sm text-green-700">
            Are you an admin?{' '}
            <a href="/admin" className="font-medium text-green-600 hover:text-green-800 hover:underline">
              Login here
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
