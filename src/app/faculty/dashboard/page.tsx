"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getUser } from '@/lib/auth';
import { Download, User, Receipt, Calendar, DollarSign, Edit, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface FacultyProfile {
  id: number;
  employeeId: string;
  department: string;
  designation: string;
  joiningDate: string;
  baseSalary: number;
  phone: string | null;
  address: string | null;
  userName: string;
  userEmail: string;
  userId: number;
}

interface BillingRecord {
  id: number;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  workload: any;
  status: string;
  generatedAt: string;
}

export default function FacultyDashboard() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [workloadDialogOpen, setWorkloadDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    phone: '',
    address: ''
  });

  // Workload form state
  const [workloadForm, setWorkloadForm] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    lectures: 0,
    labs: 0,
    tutorials: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = getUser();
      if (!user) return;

      // Fetch faculty profile
      const facultyRes = await fetch('/api/faculty');
      const allFaculty = await facultyRes.json();
      const myProfile = allFaculty.find((f: any) => f.userEmail === user.email);

      if (myProfile) {
        setProfile(myProfile);
        setEditForm({
          phone: myProfile.phone || '',
          address: myProfile.address || ''
        });

        // Fetch billing records for this faculty
        const billingRes = await fetch(`/api/billing/faculty/${myProfile.id}`);
        const billing = await billingRes.json();
        setBillingRecords(billing);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/faculty/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editForm.phone.trim() || null,
          address: editForm.address.trim() || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      setEditDialogOpen(false);
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWorkload = async () => {
    if (!profile) return;

    setSubmitting(true);
    try {
      // Calculate allowances based on workload (example calculation)
      const allowances = workloadForm.lectures * 50 + workloadForm.labs * 40 + workloadForm.tutorials * 30;
      const netSalary = profile.baseSalary + allowances;

      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: profile.id,
          month: workloadForm.month,
          baseSalary: profile.baseSalary,
          allowances: allowances,
          deductions: 0,
          netSalary: netSalary,
          workload: {
            lectures: workloadForm.lectures,
            labs: workloadForm.labs,
            tutorials: workloadForm.tutorials
          },
          status: 'pending'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit workload');
      }

      toast.success('Workload submitted successfully');
      setWorkloadDialogOpen(false);
      setWorkloadForm({
        month: new Date().toISOString().slice(0, 7),
        lectures: 0,
        labs: 0,
        tutorials: 0
      });
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Failed to submit workload:', error);
      toast.error(error.message || 'Failed to submit workload');
    } finally {
      setSubmitting(false);
    }
  };

  const generatePDF = (record: BillingRecord) => {
    if (!profile) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Salary Slip', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Employee: ${profile.userName}`, 20, 40);
    doc.text(`Employee ID: ${profile.employeeId}`, 20, 50);
    doc.text(`Department: ${profile.department}`, 20, 60);
    doc.text(`Designation: ${profile.designation}`, 20, 70);
    doc.text(`Month: ${record.month}`, 20, 80);
    doc.text(`Status: ${record.status.toUpperCase()}`, 20, 90);

    // Salary breakdown table
    autoTable(doc, {
      startY: 100,
      head: [['Description', 'Amount']],
      body: [
      ['Base Salary', `$${record.baseSalary.toLocaleString()}`],
      ['Allowances', `$${record.allowances.toLocaleString()}`],
      ['Deductions', `$${record.deductions.toLocaleString()}`],
      ['Net Salary', `$${record.netSalary.toLocaleString()}`]],

      theme: 'grid'
    });

    // Workload information
    const workload = typeof record.workload === 'string' ?
    JSON.parse(record.workload) :
    record.workload;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Workload Type', 'Hours']],
      body: [
      ['Lectures', workload.lectures || 0],
      ['Labs', workload.labs || 0],
      ['Tutorials', workload.tutorials || 0]],

      theme: 'grid'
    });

    doc.save(`salary-slip-${record.month}.pdf`);

    toast.success('Salary slip downloaded successfully');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      processed: 'secondary',
      pending: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) =>
          <Skeleton key={i} className="h-32" />
          )}
        </div>
      </div>);

  }

  if (!profile) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No faculty profile found</p>
          </CardContent>
        </Card>
      </div>);

  }

  const currentMonthBilling = billingRecords[0]; // Most recent billing record
  const workload = currentMonthBilling?.workload ?
  typeof currentMonthBilling.workload === 'string' ?
  JSON.parse(currentMonthBilling.workload) :
  currentMonthBilling.workload :
  { lectures: 0, labs: 0, tutorials: 0 };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile.userName}</h1>
          <p className="text-muted-foreground">
            {profile.designation} - {profile.department}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your contact information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows={3} />

                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={workloadDialogOpen} onOpenChange={setWorkloadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Workload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Monthly Workload</DialogTitle>
                <DialogDescription>
                  Enter your workload details for billing calculation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="month"
                    value={workloadForm.month}
                    onChange={(e) => setWorkloadForm({ ...workloadForm, month: e.target.value })} />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="lectures">Lectures (Hours)</Label>
                  <Input
                    id="lectures"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={workloadForm.lectures}
                    onChange={(e) => setWorkloadForm({ ...workloadForm, lectures: parseInt(e.target.value) || 0 })} />

                  <p className="text-xs text-muted-foreground">Allowance: $50 per hour</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labs">Labs (Hours)</Label>
                  <Input
                    id="labs"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={workloadForm.labs}
                    onChange={(e) => setWorkloadForm({ ...workloadForm, labs: parseInt(e.target.value) || 0 })} />

                  <p className="text-xs text-muted-foreground">Allowance: $40 per hour</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tutorials">Tutorials (Hours)</Label>
                  <Input
                    id="tutorials"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={workloadForm.tutorials}
                    onChange={(e) => setWorkloadForm({ ...workloadForm, tutorials: parseInt(e.target.value) || 0 })} />

                  <p className="text-xs text-muted-foreground">Allowance: $30 per hour</p>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Allowances:</span>
                    <span className="font-semibold">
                      ${workloadForm.lectures * 50 + workloadForm.labs * 40 + workloadForm.tutorials * 30}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Base Salary:</span>
                    <span className="font-semibold">${profile.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total Estimated:</span>
                    <span>${(profile.baseSalary + workloadForm.lectures * 50 + workloadForm.labs * 40 + workloadForm.tutorials * 30).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setWorkloadDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitWorkload} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Workload'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Profile Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty ID</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.employeeId}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profile.baseSalary.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joining Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(profile.joiningDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingRecords.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-lg">{profile.userName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{profile.userEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-lg">{profile.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Designation</p>
              <p className="text-lg">{profile.designation}</p>
            </div>
            {profile.phone &&
            <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg">{profile.phone}</p>
              </div>
            }
            {profile.address &&
            <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-lg">{profile.address}</p>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Current Workload */}
      {currentMonthBilling &&
      <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Month Workload ({currentMonthBilling.month})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{workload.lectures}</p>
                <p className="text-sm text-muted-foreground">Lectures</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{workload.labs}</p>
                <p className="text-sm text-muted-foreground">Labs</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{workload.tutorials}</p>
                <p className="text-sm text-muted-foreground">Tutorials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      }

      {/* Salary History */}
      <Card>
        <CardHeader>
          <CardTitle>Salary History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingRecords.map((record) =>
            <div
              key={record.id}
              className="flex items-center justify-between border-b pb-4 last:border-0">

                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{record.month}</p>
                      <p className="text-sm text-muted-foreground">
                        Generated: {new Date(record.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>{getStatusBadge(record.status)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Net Salary</p>
                    <p className="text-lg font-bold">${record.netSalary.toLocaleString()}</p>
                  </div>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePDF(record)}>

                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
            {billingRecords.length === 0 &&
            <p className="text-center text-muted-foreground py-8">
                No salary records available
              </p>
            }
          </div>
        </CardContent>
      </Card>
    </div>);

}