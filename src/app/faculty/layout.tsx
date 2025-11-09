"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut } from 'lucide-react';

export default function FacultyLayout({
  children


}: {children: React.ReactNode;}) {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'faculty') {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-8 !font-(family-name:--font-roboto)">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold !shadow-[0_6px_12px_-2px_rgba(226,232,240,0.2),0_4px_8px_-2px_rgba(226,232,240,0.15)] !bg-white">Faculty Portal</h1>
              <p className="text-xs text-muted-foreground">Smart Billing System</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>);

}