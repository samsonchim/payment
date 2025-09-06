'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loginStudent } from '@/lib/actions';
import { AppLogo } from '@/components/icons';
import { Preloader } from '@/components/preloader';

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
  const { toast } = useToast();
  const [state, formAction] = useActionState(loginStudent, null);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
      router.push('/dashboard');
    }
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: state.error,
      });
    }
  }, [state, router, toast]);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} duration={2500} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
               <AppLogo />
            </div>
            <CardTitle className="text-2xl">Student Login</CardTitle>
            <CardDescription>Enter your registration number to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="regNumber">Registration Number</Label>
                <Input
                  id="regNumber"
                  name="regNumber"
                  placeholder="20231385311"
                  required
                  className="text-base"
                />
              </div>
              <SubmitButton />
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
            Are you an admin?{' '}
            <a href="/admin" className="font-medium text-primary hover:underline">
                Login here
            </a>
        </p>
      </div>
    </main>
  );
}
