"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Receipt, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalFaculty: number;
  totalBilling: number;
  pendingPayments: number;
  averageSalary: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [facultyRes, billingRes] = await Promise.all([
          fetch('/api/faculty'),
          fetch('/api/billing'),
        ]);

        const faculty = await facultyRes.json();
        const billing = await billingRes.json();

        const pendingPayments = billing.filter((b: any) => b.status === 'pending').length;
        const totalSalary = billing.reduce((sum: number, b: any) => sum + (b.netSalary || 0), 0);
        const avgSalary = billing.length > 0 ? totalSalary / billing.length : 0;

        setStats({
          totalFaculty: faculty.length,
          totalBilling: billing.length,
          pendingPayments,
          averageSalary: Math.round(avgSalary),
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total Faculty',
      value: stats?.totalFaculty || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Total Billing Records',
      value: stats?.totalBilling || 0,
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      title: 'Average Salary',
      value: `$${stats?.averageSalary.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your faculty billing system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{card.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">System operational</p>
                  <p className="text-sm text-muted-foreground">
                    All services running normally
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Manage faculty records in Faculty Management</p>
              <p>• Process billing in Billing section</p>
              <p>• View detailed analytics in Analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
