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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';

interface TimetableEntry {
  id: number;
  facultyId: number;
  subjectId: number;
  semesterId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  createdAt: string;
  updatedAt: string;
  facultyName: string;
  employeeId: string;
  subjectName: string;
  subjectCode: string;
  semesterName: string;
}

interface Subject {
  id: number;
  name: string;
  subjectCode: string;
}

interface Semester {
  id: number;
  year: string;
  semesterNumber: number;
  semesterName: string;
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

interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subjectName: string;
    roomNumber: string | null;
  }>;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export default function FacultyTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [conflictCheck, setConflictCheck] = useState<ConflictCheck | null>(null);
  const [generating, setGenerating] = useState(false);

  // Filter
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    subjectId: '',
    semesterId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchTimetable();
    }
  }, [selectedSemester, selectedDay, profile]);

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

      // Fetch semesters
      const semestersRes = await fetch('/api/semesters?isActive=true&limit=100');
      const semestersData = await semestersRes.json();
      setSemesters(semestersData);

      // Fetch my assigned subjects
      const mappingsRes = await fetch(`/api/faculty-subject-map?facultyId=${myProfile.id}&limit=100`);
      const mappingsData = await mappingsRes.json();
      
      // Extract unique subjects
      const uniqueSubjects = mappingsData.reduce((acc: Subject[], mapping: any) => {
        if (!acc.find(s => s.id === mapping.subjectId)) {
          acc.push({
            id: mapping.subjectId,
            name: mapping.subjectName,
            subjectCode: mapping.subjectCode,
          });
        }
        return acc;
      }, []);
      
      setMySubjects(uniqueSubjects);

      await fetchTimetable();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    if (!profile) return;

    try {
      let url = `/api/timetable?facultyId=${profile.id}&limit=100`;
      
      if (selectedSemester !== 'all') {
        url += `&semesterId=${selectedSemester}`;
      }
      if (selectedDay !== 'all') {
        url += `&dayOfWeek=${selectedDay}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setTimetable(data);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      toast.error('Failed to load timetable');
    }
  };

  const checkConflicts = async () => {
    if (!profile) return;

    const payload = {
      facultyId: profile.id,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      excludeId: editingEntry?.id,
    };

    try {
      const response = await fetch('/api/timetable/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setConflictCheck(result);
      
      if (result.hasConflict) {
        toast.error(`Conflict detected! ${result.conflicts.length} overlapping slot(s)`);
      } else {
        toast.success('No conflicts detected');
      }
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      toast.error('Failed to check for conflicts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validation
    if (!formData.subjectId || !formData.semesterId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);

    if (endMinutes <= startMinutes) {
      toast.error('End time must be after start time');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        facultyId: profile.id,
        subjectId: parseInt(formData.subjectId),
        semesterId: parseInt(formData.semesterId),
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomNumber: formData.roomNumber.trim() || null,
      };

      if (editingEntry) {
        // Update existing entry
        const response = await fetch(`/api/timetable/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update timetable entry');
        }

        toast.success('Timetable updated successfully');
      } else {
        // Create new entry
        const response = await fetch('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          
          if (error.code === 'TIME_CONFLICT') {
            toast.error('Time conflict detected! Please choose a different time slot.');
          } else {
            throw new Error(error.error || 'Failed to create timetable entry');
          }
          return;
        }

        toast.success('Timetable entry added successfully');
      }

      setDialogOpen(false);
      setEditingEntry(null);
      setConflictCheck(null);
      resetForm();
      await fetchTimetable();
    } catch (error: any) {
      console.error('Failed to submit timetable entry:', error);
      toast.error(error.message || 'Failed to submit timetable entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      subjectId: entry.subjectId.toString(),
      semesterId: entry.semesterId.toString(),
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      roomNumber: entry.roomNumber || '',
    });
    setConflictCheck(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/timetable/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete timetable entry');
      }

      toast.success('Timetable entry deleted successfully');
      await fetchTimetable();
    } catch (error) {
      console.error('Failed to delete timetable entry:', error);
      toast.error('Failed to delete timetable entry');
    }
  };

  const handleGenerateTimetable = async () => {
    if (!profile) return;

    if (!confirm('This will generate a timetable based on your assigned subjects. Continue?')) {
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/timetable/generate-faculty-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: profile.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate timetable');
      }

      const result = await response.json();
      toast.success(`Timetable generated! ${result.generated} entries created, ${result.skipped} skipped due to conflicts.`);
      await fetchTimetable();
    } catch (error: any) {
      console.error('Failed to generate timetable:', error);
      toast.error(error.message || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const exportTimetable = () => {
    const csvContent = [
      ['Day', 'Start Time', 'End Time', 'Subject', 'Subject Code', 'Semester', 'Room'].join(','),
      ...timetable.map(entry => [
        entry.dayOfWeek,
        entry.startTime,
        entry.endTime,
        entry.subjectName,
        entry.subjectCode,
        entry.semesterName,
        entry.roomNumber || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${profile?.employeeId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Timetable exported successfully');
  };

  const resetForm = () => {
    setFormData({
      subjectId: '',
      semesterId: '',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      roomNumber: '',
    });
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setConflictCheck(null);
    resetForm();
    setDialogOpen(true);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getWeekView = () => {
    const weekView: Record<string, TimetableEntry[]> = {};
    
    DAYS_OF_WEEK.forEach(day => {
      weekView[day] = timetable
        .filter(entry => entry.dayOfWeek === day)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    });

    return weekView;
  };

  const getDayBadge = (day: string) => {
    const entries = timetable.filter(e => e.dayOfWeek === day);
    const totalHours = entries.reduce((sum, entry) => {
      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);
      return sum + (end - start) / 60;
    }, 0);

    return (
      <Badge variant="secondary" className="ml-2">
        {entries.length} slots ({totalHours.toFixed(1)}h)
      </Badge>
    );
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

  const weekView = getWeekView();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Timetable</h1>
          <p className="text-muted-foreground">
            Manage your class schedule with conflict detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateTimetable} variant="outline" disabled={generating || mySubjects.length === 0}>
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Auto Generate'}
          </Button>
          <Button onClick={exportTimetable} variant="outline" disabled={timetable.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleNewEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timetable.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timetable.reduce((sum, entry) => {
                const start = timeToMinutes(entry.startTime);
                const end = timeToMinutes(entry.endTime);
                return sum + (end - start) / 60;
              }, 0).toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(timetable.map(e => e.subjectId)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(timetable.map(e => e.dayOfWeek)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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
              <Label>Day</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                onClick={() => {
                  setSelectedSemester('all');
                  setSelectedDay('all');
                }} 
                variant="outline" 
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week View */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map(day => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {day}
                {getDayBadge(day)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekView[day].length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No classes scheduled for {day}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekView[day].map((entry) => {
                      const duration = (timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime)) / 60;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {entry.startTime} - {entry.endTime}
                          </TableCell>
                          <TableCell>{entry.subjectName}</TableCell>
                          <TableCell>{entry.subjectCode}</TableCell>
                          <TableCell className="text-sm">{entry.semesterName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.roomNumber || 'TBA'}</Badge>
                          </TableCell>
                          <TableCell>{duration.toFixed(1)}h</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
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
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
            </DialogTitle>
            <DialogDescription>
              Schedule a class slot with automatic conflict detection
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {conflictCheck && conflictCheck.hasConflict && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Time Conflict Detected!</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">The selected time overlaps with {conflictCheck.conflicts.length} existing slot(s):</p>
                  <ul className="list-disc list-inside">
                    {conflictCheck.conflicts.map((conflict, i) => (
                      <li key={i}>
                        {conflict.dayOfWeek} {conflict.startTime}-{conflict.endTime}: {conflict.subjectName}
                        {conflict.roomNumber && ` (Room: ${conflict.roomNumber})`}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {conflictCheck && !conflictCheck.hasConflict && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>No Conflicts</AlertTitle>
                <AlertDescription>
                  The selected time slot is available!
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectId">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {mySubjects.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No subjects assigned
                      </div>
                    ) : (
                      mySubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name} ({subject.subjectCode})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semesterId">
                  Semester <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.semesterId}
                  onValueChange={(value) => setFormData({ ...formData, semesterId: value })}
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">
                  Day <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">
                  End Time <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number (Optional)</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g., Room 301, Lab A"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={checkConflicts}
                disabled={!formData.subjectId || !formData.semesterId}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Check Conflicts
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingEntry(null);
                  setConflictCheck(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingEntry
                    ? 'Updating...'
                    : 'Adding...'
                  : editingEntry
                  ? 'Update Entry'
                  : 'Add Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
