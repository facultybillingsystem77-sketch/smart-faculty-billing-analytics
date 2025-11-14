"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Eye,
  Download,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

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
}

interface FacultySubjectMap {
  id: number;
  facultyId: number;
  subjectId: number;
  semesterId: number;
  role: string;
  facultyName: string;
  employeeId: string;
  subjectName: string;
  subjectCode: string;
  semesterName: string;
  year: string;
}

interface SemesterView {
  semester: Semester;
  subjects: Subject[];
  totalFaculty: number;
  expanded: boolean;
}

const DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'Electrical Engineering',
  'Food Technology',
  'Mechatronics',
  'Civil & Infrastructure'
];

export default function AdminSubjectsPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterViews, setSemesterViews] = useState<SemesterView[]>([]);
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSubjectFaculty, setSelectedSubjectFaculty] = useState<FacultySubjectMap[]>([]);

  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (semesters.length > 0) {
      loadSemesterViews();
    }
  }, [semesters, filterDepartment, filterYear, searchTerm]);

  const fetchData = async () => {
    try {
      // Fetch all semesters
      const semestersRes = await fetch('/api/semesters?limit=100');
      const semestersData = await semestersRes.json();
      setSemesters(semestersData);

      // Fetch all faculty-subject mappings
      const mappingsRes = await fetch('/api/faculty-subject-map?limit=1000');
      const mappingsData = await mappingsRes.json();
      setFacultyMappings(mappingsData);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const loadSemesterViews = async () => {
    try {
      const views: SemesterView[] = [];

      // Filter semesters by year if needed
      let filteredSemesters = semesters;
      if (filterYear !== 'all') {
        filteredSemesters = semesters.filter(s => s.year === filterYear);
      }

      for (const semester of filteredSemesters) {
        // Fetch subjects for this semester
        let url = `/api/subjects?semesterId=${semester.id}&limit=100`;
        
        if (filterDepartment !== 'all') {
          url += `&department=${encodeURIComponent(filterDepartment)}`;
        }
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }

        const response = await fetch(url);
        const subjects = await response.json();

        // Calculate total unique faculty for this semester
        const semesterMappings = facultyMappings.filter(
          m => m.semesterId === semester.id
        );
        const uniqueFaculty = new Set(semesterMappings.map(m => m.facultyId));

        views.push({
          semester,
          subjects,
          totalFaculty: uniqueFaculty.size,
          expanded: false,
        });
      }

      setSemesterViews(views);
    } catch (error) {
      console.error('Failed to load semester views:', error);
      toast.error('Failed to load semester data');
    }
  };

  const toggleSemesterExpand = (index: number) => {
    setSemesterViews(prev => 
      prev.map((view, i) => 
        i === index ? { ...view, expanded: !view.expanded } : view
      )
    );
  };

  const viewSubjectDetails = async (subject: Subject) => {
    setSelectedSubject(subject);
    
    // Fetch faculty assigned to this subject
    const response = await fetch(`/api/faculty-subject-map?subjectId=${subject.id}&limit=100`);
    const mappings = await response.json();
    setSelectedSubjectFaculty(mappings);
    
    setDetailsDialogOpen(true);
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

  const clearFilters = () => {
    setFilterDepartment('all');
    setFilterYear('all');
    setSearchTerm('');
  };

  const exportSemesterData = (semester: Semester, subjects: Subject[]) => {
    const csvContent = [
      ['Subject Name', 'Code', 'Department', 'Type', 'Credits', 'Hours/Week', 'Faculty Count'].join(','),
      ...subjects.map(s => [
        s.name,
        s.subjectCode || '',
        s.department,
        s.subjectType || '',
        s.credits || '',
        s.hoursPerWeek || '',
        s.facultyCount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${semester.semesterName}-${semester.year}-subjects.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  const getTotalStats = () => {
    const totalSubjects = semesterViews.reduce((sum, view) => sum + view.subjects.length, 0);
    const totalFacultySet = new Set(facultyMappings.map(m => m.facultyId));
    const totalMappings = facultyMappings.length;
    
    return {
      totalSubjects,
      totalFaculty: totalFacultySet.size,
      totalMappings,
      activeSemesters: semesters.filter(s => s.isActive).length,
    };
  };

  const stats = getTotalStats();
  const years = Array.from(new Set(semesters.map(s => s.year))).sort().reverse();

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subject Overview & Verification</h1>
        <p className="text-muted-foreground">
          Semester-wise subject mapping and faculty assignment verification
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Across all semesters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-muted-foreground">Teaching subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMappings}</div>
            <p className="text-xs text-muted-foreground">Faculty-subject mappings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Semesters</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSemesters}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
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

      {/* Semester Views */}
      <div className="space-y-4">
        {semesterViews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No semesters found</p>
            </CardContent>
          </Card>
        ) : (
          semesterViews.map((view, index) => (
            <Card key={view.semester.id}>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => toggleSemesterExpand(index)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {view.expanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <div>
                      <CardTitle className="text-xl">
                        {view.semester.semesterName} - {view.semester.year}
                      </CardTitle>
                      <CardDescription>
                        {new Date(view.semester.startDate).toLocaleDateString()} to{' '}
                        {new Date(view.semester.endDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {view.semester.isActive && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Active
                      </Badge>
                    )}
                    <div className="text-right">
                      <div className="text-2xl font-bold">{view.subjects.length}</div>
                      <div className="text-xs text-muted-foreground">subjects</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{view.totalFaculty}</div>
                      <div className="text-xs text-muted-foreground">faculty</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportSemesterData(view.semester, view.subjects);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {view.expanded && (
                <CardContent>
                  {view.subjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No subjects assigned to this semester
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
                          <TableHead>Faculty</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {view.subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>{subject.subjectCode || '-'}</TableCell>
                            <TableCell className="text-sm">{subject.department}</TableCell>
                            <TableCell>{getTypeBadge(subject.subjectType || 'Theory')}</TableCell>
                            <TableCell>{subject.credits || '-'}</TableCell>
                            <TableCell>{subject.hoursPerWeek || '-'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={subject.facultyCount === 0 ? 'destructive' : 'secondary'}
                              >
                                {subject.facultyCount} faculty
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewSubjectDetails(subject)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Subject Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subject Details</DialogTitle>
            <DialogDescription>
              Complete information about the subject and assigned faculty
            </DialogDescription>
          </DialogHeader>

          {selectedSubject && (
            <div className="space-y-6">
              {/* Subject Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subject Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Subject Name</Label>
                      <p className="font-medium">{selectedSubject.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Subject Code</Label>
                      <p className="font-medium">{selectedSubject.subjectCode || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="font-medium">{selectedSubject.department}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <div>{getTypeBadge(selectedSubject.subjectType || 'Theory')}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Credits</Label>
                      <p className="font-medium">{selectedSubject.credits || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Hours per Week</Label>
                      <p className="font-medium">{selectedSubject.hoursPerWeek || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedSubject.description && (
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm mt-1">{selectedSubject.description}</p>
                    </div>
                  )}
                  {selectedSubject.semester && (
                    <div>
                      <Label className="text-muted-foreground">Semester</Label>
                      <p className="font-medium">
                        {selectedSubject.semester.name} - {selectedSubject.semester.year}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assigned Faculty */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assigned Faculty</CardTitle>
                  <CardDescription>
                    {selectedSubjectFaculty.length} faculty member(s) assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSubjectFaculty.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No faculty assigned to this subject</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Faculty Name</TableHead>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Assigned Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSubjectFaculty.map((mapping) => (
                          <TableRow key={mapping.id}>
                            <TableCell className="font-medium">{mapping.facultyName}</TableCell>
                            <TableCell>{mapping.employeeId}</TableCell>
                            <TableCell>{getRoleBadge(mapping.role)}</TableCell>
                            <TableCell>
                              {mapping.semesterName} ({mapping.year})
                            </TableCell>
                            <TableCell>
                              {new Date(mapping.assignedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}