'use client';

import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InstallPWA } from './install-pwa';

interface AppHeaderProps {
  user?: { name: string; regNumber?: string };
  isAdmin?: boolean;
}

export function AppHeader({ user, isAdmin }: AppHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    if(isAdmin) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
            <AppLogo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
            <InstallPWA />
            {user && (
                <div className="text-right">
                    <p className="text-sm font-medium">{user.name}</p>
                    {user.regNumber && <p className="text-xs text-muted-foreground">{user.regNumber}</p>}
                </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
            </Button>
        </div>
      </div>
    </header>
  );
}
