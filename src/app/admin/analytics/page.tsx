"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsPage() {
  const [salaryTrends, setSalaryTrends] = useState<any>(null);
  const [departmentComparison, setDepartmentComparison] = useState<any>(null);
  const [workloadData, setWorkloadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [trendsRes, deptRes, workloadRes] = await Promise.all([
        fetch('/api/analytics/salary-trends'),
        fetch('/api/analytics/department-comparison'),
        fetch('/api/analytics/workload'),
      ]);

      const trends = await trendsRes.json();
      const dept = await deptRes.json();
      const workload = await workloadRes.json();

      setSalaryTrends(trends);
      setDepartmentComparison(dept);
      setWorkloadData(workload);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const salaryTrendChart = {
    labels: salaryTrends?.trends?.map((t: any) => t.month) || [],
    datasets: [
      {
        label: 'Total Salary',
        data: salaryTrends?.trends?.map((t: any) => t.totalSalary) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Average Salary',
        data: salaryTrends?.trends?.map((t: any) => t.averageSalary) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const departmentChart = {
    labels: departmentComparison?.comparison?.map((d: any) => d.department) || [],
    datasets: [
      {
        label: 'Total Salary',
        data: departmentComparison?.comparison?.map((d: any) => d.totalSalary) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  const workloadChart = {
    labels: ['Lectures', 'Labs', 'Tutorials'],
    datasets: [
      {
        data: [
          workloadData?.workload?.reduce((sum: number, w: any) => sum + w.totalLectures, 0) || 0,
          workloadData?.workload?.reduce((sum: number, w: any) => sum + w.totalLabs, 0) || 0,
          workloadData?.workload?.reduce((sum: number, w: any) => sum + w.totalTutorials, 0) || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Visualize salary trends and departmental insights
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Salary Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <Line
                  data={salaryTrendChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Salary Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px]">
                  <Bar
                    data={departmentChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="w-[250px] h-[250px]">
                    <Doughnut
                      data={workloadChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="space-y-4">
                {departmentComparison?.comparison?.map((dept: any) => (
                  <div key={dept.department} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{dept.department}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.facultyCount} faculty members
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${dept.totalSalary.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Avg: ${dept.averageSalary.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
