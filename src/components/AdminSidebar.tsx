"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  BarChart3, 
  LogOut,
  GraduationCap,
  BookOpen,
  Settings
} from 'lucide-react';
import { logout } from '@/lib/auth';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    title: 'Faculty Management',
    icon: Users,
    href: '/admin/faculty',
  },
  {
    title: 'Billing',
    icon: Receipt,
    href: '/admin/billing',
  },
  {
    title: 'Subject Overview',
    icon: BookOpen,
    href: '/admin/subjects',
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/admin/settings',
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-lg font-bold">Faculty Billing</h1>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}