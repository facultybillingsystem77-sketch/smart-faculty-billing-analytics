"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Filter, 
  Search, 
  TrendingUp,
  Building2,
  GraduationCap
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

interface FacultySubjectMap {
  id: number;
  facultyId: number;
  subjectId: number;
  semesterId: number;
  role: string;
  assignedAt: string;
  facultyName: string;
  employeeId: string;
  department: string;
  designation: string;
  subjectName: string;
  subjectCode: string;
  semesterName: string;
  year: string;
}

interface DepartmentStats {
  department: string;
  subjectCount: number;
  facultyCount: number;
  totalCredits: number;
  totalHours: number;
}

const DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'Electrical Engineering',
  'Food Technology',
  'Mechatronics',
  'Civil & Infrastructure'
];

export default function AdminSubjectsOverview() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [facultyMappings, setFacultyMappings] = useState<FacultySubjectMap[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // View mode
  const [viewMode, setViewMode] = useState<'subjects' | 'departments' | 'faculty'>('subjects');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchFacultyMappings();
  }, [selectedSemester, filterDepartment, filterType, searchTerm]);

  const fetchData = async () => {
    try {
      // Fetch semesters
      const semestersRes = await fetch('/api/semesters?isActive=true&limit=100');
      const semestersData = await semestersRes.json();
      setSemesters(semestersData);

      await fetchSubjects();
      await fetchFacultyMappings();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      let url = '/api/subjects?limit=1000&includeInactive=false';
      
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

  const fetchFacultyMappings = async () => {
    try {
      let url = '/api/faculty-subject-map?limit=1000';
      
      if (selectedSemester !== 'all') {
        url += `&semesterId=${selectedSemester}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setFacultyMappings(data);
    } catch (error) {
      console.error('Failed to fetch faculty mappings:', error);
    }
  };

  const getDepartmentStats = (): DepartmentStats[] => {
    const stats: Record<string, DepartmentStats> = {};

    subjects.forEach(subject => {
      if (!stats[subject.department]) {
        stats[subject.department] = {
          department: subject.department,
          subjectCount: 0,
          facultyCount: 0,
          totalCredits: 0,
          totalHours: 0,
        };
      }

      stats[subject.department].subjectCount++;
      stats[subject.department].totalCredits += subject.credits || 0;
      stats[subject.department].totalHours += subject.hoursPerWeek || 0;
    });

    // Count unique faculty per department
    const facultyByDept: Record<string, Set<number>> = {};
    facultyMappings.forEach(mapping => {
      if (!facultyByDept[mapping.department]) {
        facultyByDept[mapping.department] = new Set();
      }
      facultyByDept[mapping.department].add(mapping.facultyId);
    });

    Object.keys(stats).forEach(dept => {
      stats[dept].facultyCount = facultyByDept[dept]?.size || 0;
    });

    return Object.values(stats).sort((a, b) => b.subjectCount - a.subjectCount);
  };

  const getSubjectFaculty = (subjectId: number) => {
    return facultyMappings.filter(m => m.subjectId === subjectId);
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

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const departmentStats = getDepartmentStats();
  const totalSubjects = subjects.length;
  const totalFaculty = new Set(facultyMappings.map(m => m.facultyId)).size;
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
  const averageFacultyPerSubject = totalSubjects > 0 
    ? (facultyMappings.length / totalSubjects).toFixed(1)
    : '0';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subject Overview</h1>
        <p className="text-muted-foreground">
          Comprehensive view of all subjects, departments, and faculty assignments
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
            <div className="text-2xl font-bold">{totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              Across {departmentStats.length} departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFaculty}</div>
            <p className="text-xs text-muted-foreground">
              Teaching assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits}</div>
            <p className="text-xs text-muted-foreground">
              Credit hours offered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Faculty/Subject</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageFacultyPerSubject}</div>
            <p className="text-xs text-muted-foreground">
              Faculty per subject
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={viewMode === 'subjects' ? 'default' : 'outline'}
          onClick={() => setViewMode('subjects')}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Subjects View
        </Button>
        <Button
          variant={viewMode === 'departments' ? 'default' : 'outline'}
          onClick={() => setViewMode('departments')}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Departments View
        </Button>
        <Button
          variant={viewMode === 'faculty' ? 'default' : 'outline'}
          onClick={() => setViewMode('faculty')}
        >
          <Users className="h-4 w-4 mr-2" />
          Faculty Assignments
        </Button>
      </div>

      {/* Filters */}
      {viewMode === 'subjects' && (
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
                    <SelectItem value="Theory">Theory</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Practical">Practical</SelectItem>
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
      )}

      {/* Content based on view mode */}
      {viewMode === 'subjects' && (
        <Card>
          <CardHeader>
            <CardTitle>All Subjects</CardTitle>
            <CardDescription>
              Complete list of subjects with faculty assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No subjects found matching your filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Hours/Week</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Faculty Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => {
                    const assignedFaculty = getSubjectFaculty(subject.id);
                    return (
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
                          {assignedFaculty.length > 0 ? (
                            <div className="space-y-1">
                              {assignedFaculty.map((faculty) => (
                                <div key={faculty.id} className="text-sm flex items-center gap-2">
                                  <span>{faculty.facultyName}</span>
                                  {getRoleBadge(faculty.role)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="secondary">No faculty</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'departments' && (
        <Card>
          <CardHeader>
            <CardTitle>Department-wise Statistics</CardTitle>
            <CardDescription>
              Subject and faculty distribution across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentStats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No department data available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Total Credits</TableHead>
                    <TableHead>Total Hours/Week</TableHead>
                    <TableHead>Avg Credits/Subject</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((stat) => (
                    <TableRow key={stat.department}>
                      <TableCell className="font-medium">{stat.department}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.subjectCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stat.facultyCount}</Badge>
                      </TableCell>
                      <TableCell>{stat.totalCredits}</TableCell>
                      <TableCell>{stat.totalHours}</TableCell>
                      <TableCell>
                        {stat.subjectCount > 0 
                          ? (stat.totalCredits / stat.subjectCount).toFixed(1)
                          : '0'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'faculty' && (
        <Card>
          <CardHeader>
            <CardTitle>Faculty Subject Assignments</CardTitle>
            <CardDescription>
              All faculty members and their assigned subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {facultyMappings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No faculty assignments found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facultyMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">{mapping.facultyName}</TableCell>
                      <TableCell>{mapping.employeeId}</TableCell>
                      <TableCell className="text-sm">{mapping.department}</TableCell>
                      <TableCell className="text-sm">{mapping.designation}</TableCell>
                      <TableCell>{mapping.subjectName}</TableCell>
                      <TableCell>{mapping.subjectCode}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{mapping.semesterName}</div>
                          <div className="text-muted-foreground">{mapping.year}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(mapping.role)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(mapping.assignedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}