"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, BookOpen, Users, Calendar, Filter, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';

interface Subject {
  id: number;
  name: string;
  subjectCode: string;
  department: string;
  subjectType: string;
  credits: number;
  hoursPerWeek: number;
  semesterId: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  semester: {
    name: string;
    year: string;
  } | null;
  facultyCount: number;
}

interface Semester {
  id: number;
  year: string;
  semesterNumber: number;
  semesterName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FacultyProfile {
  id: number;
  employeeId: string;
  department: string;
  designation: string;
  userName: string;
  userEmail: string;
}

interface FacultySubjectMap {
  id: number;
  facultyId: number;
  subjectId: number;
  semesterId: number;
  role: string;
  assignedAt: string;
  facultyName: string;
  employeeId: string;
  subjectName: string;
  subjectCode: string;
  semesterName: string;
  year: string;
}

const DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'Mechatronics',
  'Food Technology',
  'Electrical Engineering',
  'Civil & Infrastructure',
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
];

const SUBJECT_TYPES = ['Theory', 'Lab', 'Practical'];

export default function FacultySubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [mySubjects, setMySubjects] = useState<FacultySubjectMap[]>([]);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSubjectForAssign, setSelectedSubjectForAssign] = useState<Subject | null>(null);

  // Filters
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form state for subject
  const [formData, setFormData] = useState({
    name: '',
    subjectCode: '',
    department: '',
    subjectType: 'Theory',
    credits: '',
    hoursPerWeek: '',
    semesterId: '',
    description: '',
  });

  // Form state for assignment
  const [assignmentData, setAssignmentData] = useState({
    semesterId: '',
    role: 'primary',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchSubjects();
      fetchMySubjects();
    }
  }, [selectedSemester, filterDepartment, filterType, searchTerm, profile]);

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

      // Fetch semesters
      const semestersRes = await fetch('/api/semesters?isActive=true&limit=100');
      const semestersData = await semestersRes.json();
      setSemesters(semestersData);

      await fetchSubjects();
      await fetchMySubjects();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      let url = '/api/subjects?limit=100&includeInactive=false';
      
      if (selectedSemester !== 'all') {
        url += `&semesterId=${selectedSemester}`;
      }
      if (filterDepartment !== 'all') {
        url += `&department=${encodeURIComponent(filterDepartment)}`;
      }
      if (filterType !== 'all') {
        url += `&subjectType=${filterType}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const fetchMySubjects = async () => {
    if (!profile) return;
    
    try {
      let url = `/api/faculty-subject-map?facultyId=${profile.id}&limit=100`;
      
      if (selectedSemester !== 'all') {
        url += `&semesterId=${selectedSemester}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setMySubjects(data);
    } catch (error) {
      console.error('Failed to fetch my subjects:', error);
      toast.error('Failed to load your subjects');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validation
    if (!formData.name || !formData.subjectCode || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.credits && parseFloat(formData.credits) <= 0) {
      toast.error('Credits must be a positive number');
      return;
    }

    if (formData.hoursPerWeek && parseFloat(formData.hoursPerWeek) <= 0) {
      toast.error('Hours per week must be a positive number');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        subjectCode: formData.subjectCode.trim().toUpperCase(),
        department: formData.department,
        subjectType: formData.subjectType,
        isActive: true,
      };

      if (formData.credits) payload.credits = parseFloat(formData.credits);
      if (formData.hoursPerWeek) payload.hoursPerWeek = parseFloat(formData.hoursPerWeek);
      if (formData.semesterId) payload.semesterId = parseInt(formData.semesterId);
      if (formData.description) payload.description = formData.description.trim();

      if (editingSubject) {
        // Update existing subject
        const response = await fetch(`/api/subjects/${editingSubject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update subject');
        }

        toast.success('Subject updated successfully');
      } else {
        // Create new subject
        const response = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create subject');
        }

        const newSubject = await response.json();
        
        // Auto-assign to current faculty if semester is selected
        if (formData.semesterId) {
          try {
            await fetch('/api/faculty-subject-map', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                facultyId: profile.id,
                subjectId: newSubject.id,
                semesterId: parseInt(formData.semesterId),
                role: 'primary',
              }),
            });
          } catch (assignError) {
            console.warn('Failed to auto-assign subject:', assignError);
          }
        }

        toast.success('Subject created successfully');
      }

      setDialogOpen(false);
      setEditingSubject(null);
      resetForm();
      await fetchSubjects();
      await fetchMySubjects();
    } catch (error: any) {
      console.error('Failed to submit subject:', error);
      toast.error(error.message || 'Failed to submit subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedSubjectForAssign) return;

    if (!assignmentData.semesterId) {
      toast.error('Please select a semester');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/faculty-subject-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: profile.id,
          subjectId: selectedSubjectForAssign.id,
          semesterId: parseInt(assignmentData.semesterId),
          role: assignmentData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign subject');
      }

      toast.success('Subject assigned to you successfully');
      setAssignDialogOpen(false);
      setSelectedSubjectForAssign(null);
      resetAssignmentForm();
      await fetchMySubjects();
    } catch (error: any) {
      console.error('Failed to assign subject:', error);
      toast.error(error.message || 'Failed to assign subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      subjectCode: subject.subjectCode || '',
      department: subject.department,
      subjectType: subject.subjectType || 'Theory',
      credits: subject.credits?.toString() || '',
      hoursPerWeek: subject.hoursPerWeek?.toString() || '',
      semesterId: subject.semesterId?.toString() || '',
      description: subject.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subject? This will also remove all faculty assignments.')) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete subject');
      }

      toast.success('Subject deleted successfully');
      await fetchSubjects();
      await fetchMySubjects();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const handleUnassign = async (mapId: number) => {
    if (!confirm('Are you sure you want to unassign this subject?')) {
      return;
    }

    try {
      const response = await fetch(`/api/faculty-subject-map/${mapId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unassign subject');
      }

      toast.success('Subject unassigned successfully');
      await fetchMySubjects();
      await fetchSubjects();
    } catch (error) {
      console.error('Failed to unassign subject:', error);
      toast.error('Failed to unassign subject');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subjectCode: '',
      department: profile?.department || '',
      subjectType: 'Theory',
      credits: '',
      hoursPerWeek: '',
      semesterId: '',
      description: '',
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentData({
      semesterId: '',
      role: 'primary',
    });
  };

  const handleNewSubject = () => {
    setEditingSubject(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleAssignSubject = (subject: Subject) => {
    setSelectedSubjectForAssign(subject);
    resetAssignmentForm();
    setAssignDialogOpen(true);
  };

  const clearFilters = () => {
    setSelectedSemester('all');
    setFilterDepartment('all');
    setFilterType('all');
    setSearchTerm('');
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Theory: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      Lab: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Practical: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };

    return (
      <Badge className={colors[type] || colors.Theory} variant="outline">
        {type}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === 'primary') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Primary</Badge>;
    }
    return <Badge variant="outline">Co-Teacher</Badge>;
  };

  const isSubjectAssignedToMe = (subjectId: number) => {
    return mySubjects.some(ms => ms.subjectId === subjectId);
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
          <h1 className="text-3xl font-bold tracking-tight">Subject Management</h1>
          <p className="text-muted-foreground">
            Manage subjects, assign to semesters, and track your teaching load
          </p>
        </div>
        <Button onClick={handleNewSubject}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Subject
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Subjects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mySubjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Semesters</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{semesters.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate">{profile.department}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Assigned Subjects */}
      {mySubjects.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Assigned Subjects
            </CardTitle>
            <CardDescription>
              Subjects currently assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySubjects.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.subjectName}</TableCell>
                    <TableCell>{mapping.subjectCode}</TableCell>
                    <TableCell>
                      {mapping.semesterName} ({mapping.year})
                    </TableCell>
                    <TableCell>{getRoleBadge(mapping.role)}</TableCell>
                    <TableCell>
                      {new Date(mapping.assignedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassign(mapping.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
              <Label>Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id.toString()}>
                      {sem.semesterName} - {sem.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {SUBJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2 flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subjects</CardTitle>
          <CardDescription>
            View and manage all subjects in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No subjects found</p>
              <Button onClick={handleNewSubject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Subject
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Hours/Week</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.subjectCode || '-'}</TableCell>
                    <TableCell className="text-sm">{subject.department}</TableCell>
                    <TableCell>{getTypeBadge(subject.subjectType || 'Theory')}</TableCell>
                    <TableCell>{subject.credits || '-'}</TableCell>
                    <TableCell>{subject.hoursPerWeek || '-'}</TableCell>
                    <TableCell>
                      {subject.semester ? (
                        <div className="text-sm">
                          <div>{subject.semester.name}</div>
                          <div className="text-muted-foreground">{subject.semester.year}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{subject.facultyCount} faculty</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!isSubjectAssignedToMe(subject.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignSubject(subject)}
                            title="Assign to me"
                          >
                            <Users className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(subject)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subject.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Subject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingSubject ? 'update' : 'create'} a subject
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Subject Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Machine Learning"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectCode">
                  Subject Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subjectCode"
                  value={formData.subjectCode}
                  onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS401"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
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
                <Label htmlFor="subjectType">
                  Subject Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subjectType}
                  onValueChange={(value) => setFormData({ ...formData, subjectType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  placeholder="e.g., 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hoursPerWeek">Hours/Week</Label>
                <Input
                  id="hoursPerWeek"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hoursPerWeek}
                  onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                  placeholder="e.g., 4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semesterId">Semester</Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={(value) => setFormData({ ...formData, semesterId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {semesters.map((sem) => (
                      <SelectItem key={sem.id} value={sem.id.toString()}>
                        {sem.semesterName} - {sem.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add subject description or notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingSubject(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingSubject
                    ? 'Updating...'
                    : 'Creating...'
                  : editingSubject
                  ? 'Update Subject'
                  : 'Create Subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Subject Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subject to Me</DialogTitle>
            <DialogDescription>
              Assign &quot;{selectedSubjectForAssign?.name}&quot; to yourself for a specific semester
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignToMe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignSemester">
                Semester <span className="text-destructive">*</span>
              </Label>
              <Select
                value={assignmentData.semesterId}
                onValueChange={(value) => setAssignmentData({ ...assignmentData, semesterId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id.toString()}>
                      {sem.semesterName} - {sem.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={assignmentData.role}
                onValueChange={(value) => setAssignmentData({ ...assignmentData, role: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Teacher</SelectItem>
                  <SelectItem value="co-teacher">Co-Teacher</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Primary teachers are the main instructors, co-teachers assist with the subject
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssignDialogOpen(false);
                  setSelectedSubjectForAssign(null);
                  resetAssignmentForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Assigning...' : 'Assign to Me'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}