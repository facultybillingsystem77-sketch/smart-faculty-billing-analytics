"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Loader2, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  paidAt: string | null;
}

interface Faculty {
  id: number;
  employeeId: string;
  userName: string;
  baseSalary: number;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<Billing[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Billing | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    facultyId: '',
    month: new Date().toISOString().slice(0, 7),
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    lectures: 0,
    labs: 0,
    tutorials: 0,
    status: 'pending',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [billingRes, facultyRes] = await Promise.all([
        fetch('/api/billing?limit=100'),
        fetch('/api/faculty?limit=100')
      ]);
      
      const billingData = await billingRes.json();
      const facultyData = await facultyRes.json();
      
      setBilling(billingData);
      setFacultyList(facultyData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalary = async () => {
    if (!formData.facultyId) {
      toast.error('Please select a faculty member');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: parseInt(formData.facultyId),
          month: formData.month,
          baseSalary: formData.baseSalary,
          allowances: formData.allowances,
          deductions: formData.deductions,
          workload: {
            lectures: formData.lectures,
            labs: formData.labs,
            tutorials: formData.tutorials,
          },
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add salary record');
      }

      toast.success('Salary record added successfully');
      setAddDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add salary record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSalary = async () => {
    if (!selectedRecord) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/billing/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseSalary: formData.baseSalary,
          allowances: formData.allowances,
          deductions: formData.deductions,
          workload: {
            lectures: formData.lectures,
            labs: formData.labs,
            tutorials: formData.tutorials,
          },
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update salary record');
      }

      toast.success('Salary record updated successfully');
      setEditDialogOpen(false);
      setSelectedRecord(null);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update salary record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSalary = async () => {
    if (!selectedRecord) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/billing/${selectedRecord.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete salary record');
      }

      toast.success('Salary record deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedRecord(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete salary record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovePayment = async (record: Billing) => {
    try {
      const response = await fetch(`/api/billing/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve payment');
      }

      toast.success('Payment approved successfully');
      await fetchData();
    } catch (error) {
      toast.error('Failed to approve payment');
    }
  };

  const handleMarkUnpaid = async (record: Billing) => {
    try {
      const response = await fetch(`/api/billing/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'pending',
          paidAt: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as unpaid');
      }

      toast.success('Payment marked as unpaid');
      await fetchData();
    } catch (error) {
      toast.error('Failed to mark as unpaid');
    }
  };

  const openEditDialog = (record: Billing) => {
    setSelectedRecord(record);
    const workload = typeof record.workload === 'string' 
      ? JSON.parse(record.workload) 
      : record.workload;
    
    setFormData({
      facultyId: record.facultyId.toString(),
      month: record.month,
      baseSalary: record.baseSalary,
      allowances: record.allowances,
      deductions: record.deductions,
      lectures: workload.lectures || 0,
      labs: workload.labs || 0,
      tutorials: workload.tutorials || 0,
      status: record.status,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (record: Billing) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      facultyId: '',
      month: new Date().toISOString().slice(0, 7),
      baseSalary: 0,
      allowances: 0,
      deductions: 0,
      lectures: 0,
      labs: 0,
      tutorials: 0,
      status: 'pending',
    });
  };

  const handleFacultySelect = (facultyId: string) => {
    const selected = facultyList.find(f => f.id.toString() === facultyId);
    if (selected) {
      setFormData({
        ...formData,
        facultyId,
        baseSalary: selected.baseSalary,
      });
    }
  };

  const generatePDF = (record: Billing) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Salary Slip', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Employee: ${record.facultyName}`, 20, 40);
    doc.text(`Employee ID: ${record.employeeId}`, 20, 50);
    doc.text(`Month: ${record.month}`, 20, 60);
    doc.text(`Status: ${record.status.toUpperCase()}`, 20, 70);

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
    toast.success('PDF generated successfully');
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

  const calculateNetSalary = () => {
    return formData.baseSalary + formData.allowances - formData.deductions;
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Management</h1>
          <p className="text-muted-foreground">
            Add, edit, approve, and manage salary records
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Salary Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Salary Record</DialogTitle>
              <DialogDescription>
                Create a new salary record for a faculty member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty Member *</Label>
                <Select value={formData.facultyId} onValueChange={handleFacultySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyList.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.userName} ({f.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month *</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Base Salary *</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    min="0"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances</Label>
                  <Input
                    id="allowances"
                    type="number"
                    min="0"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    min="0"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Workload Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lectures">Lectures (Hours)</Label>
                    <Input
                      id="lectures"
                      type="number"
                      min="0"
                      value={formData.lectures}
                      onChange={(e) => setFormData({ ...formData, lectures: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labs">Labs (Hours)</Label>
                    <Input
                      id="labs"
                      type="number"
                      min="0"
                      value={formData.labs}
                      onChange={(e) => setFormData({ ...formData, labs: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tutorials">Tutorials (Hours)</Label>
                    <Input
                      id="tutorials"
                      type="number"
                      min="0"
                      value={formData.tutorials}
                      onChange={(e) => setFormData({ ...formData, tutorials: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Net Salary:</span>
                  <span className="text-2xl text-primary">${calculateNetSalary().toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleAddSalary} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</> : 'Add Record'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          <div className="rounded-md border">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBilling.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No salary records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBilling.map((b) => (
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generatePDF(b)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(b)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {b.status !== 'paid' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprovePayment(b)}
                              title="Mark as Paid"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkUnpaid(b)}
                              title="Mark as Unpaid"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(b)}
                            title="Delete"
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Salary Record</DialogTitle>
            <DialogDescription>
              Update salary details for {selectedRecord?.facultyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-month">Month</Label>
                <Input
                  id="edit-month"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-baseSalary">Base Salary</Label>
                <Input
                  id="edit-baseSalary"
                  type="number"
                  min="0"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-allowances">Allowances</Label>
                <Input
                  id="edit-allowances"
                  type="number"
                  min="0"
                  value={formData.allowances}
                  onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deductions">Deductions</Label>
                <Input
                  id="edit-deductions"
                  type="number"
                  min="0"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Workload Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-lectures">Lectures</Label>
                  <Input
                    id="edit-lectures"
                    type="number"
                    min="0"
                    value={formData.lectures}
                    onChange={(e) => setFormData({ ...formData, lectures: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-labs">Labs</Label>
                  <Input
                    id="edit-labs"
                    type="number"
                    min="0"
                    value={formData.labs}
                    onChange={(e) => setFormData({ ...formData, labs: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tutorials">Tutorials</Label>
                  <Input
                    id="edit-tutorials"
                    type="number"
                    min="0"
                    value={formData.tutorials}
                    onChange={(e) => setFormData({ ...formData, tutorials: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Net Salary:</span>
                <span className="text-2xl text-primary">${calculateNetSalary().toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditSalary} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the salary record for {selectedRecord?.facultyName} ({selectedRecord?.month}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSalary} disabled={submitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}