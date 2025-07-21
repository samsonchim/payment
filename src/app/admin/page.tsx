'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loginAdmin } from '@/lib/actions';
import { AppLogo } from '@/components/icons';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(loginAdmin, null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Login Successful',
        description: 'Welcome, Admin!',
      });
      router.push('/admin/dashboard');
    }
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: state.error,
      });
    }
  }, [state, router, toast]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AppLogo />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to manage the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="admin"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <SubmitButton />
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
            Not an admin?{' '}
            <a href="/" className="font-medium text-primary hover:underline">
                Login as student
            </a>
        </p>
      </div>
    </main>
  );
}
