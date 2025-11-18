"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, LayoutDashboard, ClipboardList, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function FacultyLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

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

  const navItems = [
    {
      href: '/faculty/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/faculty/subjects',
      label: 'Subjects',
      icon: BookOpen,
    },
    {
      href: '/faculty/timetable',
      label: 'Timetable',
      icon: Calendar,
    },
    {
      href: '/faculty/work-logs',
      label: 'Work Logs',
      icon: ClipboardList,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold">Faculty Portal</h1>
              <p className="text-xs text-muted-foreground">Smart Billing System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        isActive && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}