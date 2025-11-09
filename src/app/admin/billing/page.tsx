"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Billing {
  id: number;
  facultyId: number;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  workload: any;
  status: string;
  employeeId: string;
  facultyName: string;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      const response = await fetch('/api/billing?limit=100');
      const data = await response.json();
      setBilling(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch billing records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (record: Billing) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Salary Slip', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Employee: ${record.facultyName}`, 20, 40);
    doc.text(`Employee ID: ${record.employeeId}`, 20, 50);
    doc.text(`Month: ${record.month}`, 20, 60);
    doc.text(`Status: ${record.status.toUpperCase()}`, 20, 70);

    // Salary breakdown table
    autoTable(doc, {
      startY: 80,
      head: [['Description', 'Amount']],
      body: [
        ['Base Salary', `$${record.baseSalary.toLocaleString()}`],
        ['Allowances', `$${record.allowances.toLocaleString()}`],
        ['Deductions', `$${record.deductions.toLocaleString()}`],
        ['Net Salary', `$${record.netSalary.toLocaleString()}`],
      ],
      theme: 'grid',
    });

    // Workload information
    const workload = typeof record.workload === 'string' 
      ? JSON.parse(record.workload) 
      : record.workload;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Workload Type', 'Hours']],
      body: [
        ['Lectures', workload.lectures || 0],
        ['Labs', workload.labs || 0],
        ['Tutorials', workload.tutorials || 0],
      ],
      theme: 'grid',
    });

    doc.save(`salary-slip-${record.employeeId}-${record.month}.pdf`);
    
    toast({
      title: 'Success',
      description: 'PDF generated successfully',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      processed: 'secondary',
      pending: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const filteredBilling = billing.filter((b) => {
    const matchesSearch = 
      b.facultyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing Management</h1>
        <p className="text-muted-foreground">
          Manage salary billing and generate salary slips
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBilling.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{b.facultyName}</div>
                      <div className="text-sm text-muted-foreground">{b.employeeId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{b.month}</TableCell>
                  <TableCell>${b.baseSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">+${b.allowances.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">-${b.deductions.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">${b.netSalary.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(b.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generatePDF(b)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
