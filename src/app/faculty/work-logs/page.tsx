"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Clock, Calendar as CalendarIcon, Filter, AlertTriangle, CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';

interface WorkLog {
  id: number;
  facultyId: number;
  date: string;
  timeIn: string;
  timeOut: string;
  department: string;
  subject: string;
  activityType: string;
  description: string | null;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  facultyName?: string;
  employeeId?: string;
}

interface Subject {
  id: number;
  name: string;
  department: string;
  isActive: boolean;
}

interface FacultyProfile {
  id: number;
  employeeId: string;
  department: string;
  designation: string;
  userName: string;
  userEmail: string;
}

interface ValidationIssue {
  type: 'overlap' | 'impossible' | 'pattern' | 'anomaly';
  severity: 'high' | 'medium' | 'low';
  message: string;
  logIds: number[];
  suggestion?: string;
  details?: any;
}

interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalLogs: number;
    totalHours: number;
    averageHoursPerDay: number;
    maxHoursInDay: number;
  };
}

const DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'Mechatronics',
  'Food Technology',
  'Electrical Engineering',
  'Civil & Infrastructure',
];

const ACTIVITY_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'lab', label: 'Lab' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'exam_duty', label: 'Exam Duty' },
  { value: 'project_guidance', label: 'Project Guidance' },
  { value: 'other', label: 'Other' },
];

export default function WorkLogsPage() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [highlightedLogIds, setHighlightedLogIds] = useState<Set<number>>(new Set());

  // Filter states
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterActivityType, setFilterActivityType] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeIn: '09:00',
    timeOut: '10:00',
    department: '',
    subject: '',
    activityType: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter subjects when department changes
    if (formData.department) {
      const filtered = subjects.filter((s) => s.department === formData.department);
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
    // Reset subject when department changes
    setFormData((prev) => ({ ...prev, subject: '' }));
  }, [formData.department, subjects]);

  const fetchData = async () => {
    try {
      const user = getUser();
      if (!user) {
        toast.error('Please log in to continue');
        return;
      }

      // Fetch faculty profile
      const facultyRes = await fetch('/api/faculty');
      const allFaculty = await facultyRes.json();
      const myProfile = allFaculty.find((f: any) => f.userEmail === user.email);

      if (!myProfile) {
        toast.error('Faculty profile not found');
        setLoading(false);
        return;
      }

      setProfile(myProfile);
      setFormData((prev) => ({ ...prev, department: myProfile.department }));

      // Fetch subjects
      const subjectsRes = await fetch('/api/subjects?limit=100');
      const subjectsData = await subjectsRes.json();
      setSubjects(subjectsData);

      // Fetch work logs for this faculty
      await fetchWorkLogs(myProfile.id);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkLogs = async (facultyId: number) => {
    try {
      let url = `/api/work-logs?facultyId=${facultyId}&limit=100`;
      
      if (filterStartDate) url += `&startDate=${filterStartDate}`;
      if (filterEndDate) url += `&endDate=${filterEndDate}`;
      if (filterDepartment !== 'all') url += `&department=${filterDepartment}`;
      if (filterActivityType !== 'all') url += `&activityType=${filterActivityType}`;

      const response = await fetch(url);
      const data = await response.json();
      setWorkLogs(data);
    } catch (error) {
      console.error('Failed to fetch work logs:', error);
      toast.error('Failed to load work logs');
    }
  };

  const handleValidate = async () => {
    if (!profile) return;

    setValidating(true);
    setValidationResult(null);
    setHighlightedLogIds(new Set());

    try {
      const response = await fetch('/api/work-logs/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: profile.id,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);

      // Collect all log IDs mentioned in issues
      const allIssueLogIds = new Set<number>();
      result.issues.forEach((issue) => {
        issue.logIds.forEach((id) => allIssueLogIds.add(id));
      });
      setHighlightedLogIds(allIssueLogIds);

      if (result.isValid) {
        toast.success('✓ All work logs validated successfully! No issues detected.');
      } else {
        const highSeverityCount = result.issues.filter((i) => i.severity === 'high').length;
        if (highSeverityCount > 0) {
          toast.error(`⚠ Found ${highSeverityCount} critical issue(s) that need attention`);
        } else {
          toast.warning(`Found ${result.issues.length} issue(s) - please review`);
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate work logs');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validation
    if (!formData.department || !formData.subject || !formData.activityType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const timeInParts = formData.timeIn.split(':').map(Number);
    const timeOutParts = formData.timeOut.split(':').map(Number);
    const timeInMinutes = timeInParts[0] * 60 + timeInParts[1];
    const timeOutMinutes = timeOutParts[0] * 60 + timeOutParts[1];

    if (timeOutMinutes <= timeInMinutes) {
      toast.error('Time Out must be after Time In');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        facultyId: profile.id,
        date: formData.date,
        timeIn: formData.timeIn,
        timeOut: formData.timeOut,
        department: formData.department,
        subject: formData.subject,
        activityType: formData.activityType,
        description: formData.description.trim() || null,
      };

      if (editingLog) {
        // Update existing log
        const response = await fetch(`/api/work-logs/${editingLog.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update work log');
        }

        toast.success('Work log updated successfully');
      } else {
        // Create new log
        const response = await fetch('/api/work-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create work log');
        }

        toast.success('Work log created successfully');
      }

      setDialogOpen(false);
      setEditingLog(null);
      resetForm();
      await fetchWorkLogs(profile.id);
      // Clear validation when logs change
      setValidationResult(null);
      setHighlightedLogIds(new Set());
    } catch (error: any) {
      console.error('Failed to submit work log:', error);
      toast.error(error.message || 'Failed to submit work log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (log: WorkLog) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      timeIn: log.timeIn,
      timeOut: log.timeOut,
      department: log.department,
      subject: log.subject,
      activityType: log.activityType,
      description: log.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;

    try {
      const response = await fetch(`/api/work-logs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete work log');
      }

      toast.success('Work log deleted successfully');
      if (profile) await fetchWorkLogs(profile.id);
      // Clear validation when logs change
      setValidationResult(null);
      setHighlightedLogIds(new Set());
    } catch (error) {
      console.error('Failed to delete work log:', error);
      toast.error('Failed to delete work log');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      timeIn: '09:00',
      timeOut: '10:00',
      department: profile?.department || '',
      subject: '',
      activityType: '',
      description: '',
    });
  };

  const handleNewLog = () => {
    setEditingLog(null);
    resetForm();
    setDialogOpen(true);
  };

  const applyFilters = () => {
    if (profile) {
      fetchWorkLogs(profile.id);
      // Clear validation when filters change
      setValidationResult(null);
      setHighlightedLogIds(new Set());
    }
  };

  const clearFilters = () => {
    setFilterDepartment('all');
    setFilterActivityType('all');
    setFilterStartDate('');
    setFilterEndDate('');
    if (profile) {
      fetchWorkLogs(profile.id);
      setValidationResult(null);
      setHighlightedLogIds(new Set());
    }
  };

  const getActivityBadge = (activityType: string) => {
    const colors: Record<string, string> = {
      lecture: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      lab: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      tutorial: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      exam_duty: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      project_guidance: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    const label = ACTIVITY_TYPES.find((t) => t.value === activityType)?.label || activityType;

    return (
      <Badge className={colors[activityType] || colors.other} variant="outline">
        {label}
      </Badge>
    );
  };

  const getIssueSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'overlap':
        return 'Overlapping Hours';
      case 'impossible':
        return 'Impossible Entry';
      case 'pattern':
        return 'Suspicious Pattern';
      case 'anomaly':
        return 'Anomaly Detected';
      default:
        return type;
    }
  };

  const calculateTotalHours = () => {
    return workLogs.reduce((sum, log) => sum + log.totalHours, 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faculty profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Logs</h1>
          <p className="text-muted-foreground">
            Track your hours, activities, and tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleValidate} variant="outline" disabled={validating || workLogs.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            {validating ? 'Validating...' : 'AI Validate'}
          </Button>
          <Button onClick={handleNewLog}>
            <Plus className="h-4 w-4 mr-2" />
            Log Work Hours
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="mb-6 space-y-4">
          {/* Summary Card */}
          <Card className={validationResult.isValid ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-orange-200 bg-orange-50 dark:bg-orange-950'}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {validationResult.isValid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                )}
                <div>
                  <CardTitle className="text-lg">
                    {validationResult.isValid ? 'All Clear!' : 'Issues Detected'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.isValid
                      ? 'Your timesheet has been validated with no issues found.'
                      : `Found ${validationResult.issues.length} issue(s) that need attention.`}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs Checked</p>
                  <p className="text-2xl font-bold">{validationResult.stats.totalLogs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{validationResult.stats.totalHours}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                  <p className="text-2xl font-bold">{validationResult.stats.averageHoursPerDay}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Hours/Day</p>
                  <p className="text-2xl font-bold">{validationResult.stats.maxHoursInDay}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          {validationResult.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationResult.issues.map((issue, index) => (
                  <Alert
                    key={index}
                    className={
                      issue.severity === 'high'
                        ? 'border-red-200 bg-red-50 dark:bg-red-950'
                        : issue.severity === 'medium'
                        ? 'border-orange-200 bg-orange-50 dark:bg-orange-950'
                        : 'border-blue-200 bg-blue-50 dark:bg-blue-950'
                    }
                  >
                    <div className="flex gap-3">
                      {getIssueSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-normal">
                            {getIssueTypeLabel(issue.type)}
                          </Badge>
                          <Badge
                            variant={
                              issue.severity === 'high'
                                ? 'destructive'
                                : issue.severity === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {issue.severity.toUpperCase()}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription>
                          <p className="font-medium mb-2">{issue.message}</p>
                          {issue.suggestion && (
                            <p className="text-sm text-muted-foreground mb-2">
                              💡 <span className="font-medium">Suggestion:</span> {issue.suggestion}
                            </p>
                          )}
                          {issue.details && (
                            <div className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded mt-2">
                              <p className="font-medium mb-1">Details:</p>
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(issue.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          <p className="text-xs mt-2 text-muted-foreground">
                            Affected Log IDs: {issue.logIds.join(', ')}
                          </p>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateTotalHours()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                workLogs.filter(
                  (log) =>
                    log.date.startsWith(new Date().toISOString().slice(0, 7))
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workLogs.length > 0
                ? (parseFloat(calculateTotalHours()) / workLogs.length).toFixed(1)
                : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={filterActivityType} onValueChange={setFilterActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Work Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {workLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No work logs found</p>
              <Button onClick={handleNewLog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Log
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workLogs.map((log) => {
                  const isHighlighted = highlightedLogIds.has(log.id);
                  return (
                    <TableRow
                      key={log.id}
                      className={isHighlighted ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isHighlighted && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          {new Date(log.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.timeIn} - {log.timeOut}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.department}</TableCell>
                      <TableCell className="font-medium">{log.subject}</TableCell>
                      <TableCell>{getActivityBadge(log.activityType)}</TableCell>
                      <TableCell className="font-semibold">
                        {log.totalHours.toFixed(2)}h
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(log)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLog ? 'Edit Work Log' : 'Log Work Hours'}
            </DialogTitle>
            <DialogDescription>
              Record your daily activities and working hours
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityType">
                  Activity Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.activityType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, activityType: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeIn">
                  Time In <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="timeIn"
                  type="time"
                  value={formData.timeIn}
                  onChange={(e) =>
                    setFormData({ ...formData, timeIn: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeOut">
                  Time Out <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="timeOut"
                  type="time"
                  value={formData.timeOut}
                  onChange={(e) =>
                    setFormData({ ...formData, timeOut: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject: value })
                }
                required
                disabled={!formData.department}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      formData.department
                        ? 'Select subject'
                        : 'Select department first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No subjects available for this department
                    </div>
                  ) : (
                    filteredSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this activity..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingLog(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingLog
                    ? 'Updating...'
                    : 'Creating...'
                  : editingLog
                  ? 'Update Log'
                  : 'Create Log'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}