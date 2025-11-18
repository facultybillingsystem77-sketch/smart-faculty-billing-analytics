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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Calendar, Clock, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';

interface TimetableEntry {
  id: number;
  facultyId: number;
  subjectId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  semesterId: number;
  createdAt: string;
  updatedAt: string;
  subjectName: string;
  subjectCode: string;
  subjectType: string;
  department: string;
  semesterName: string;
  year: string;
}

interface Subject {
  id: number;
  name: string;
  subjectCode: string;
  subjectType: string;
  department: string;
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
  conflictingEntry?: TimetableEntry;
  message: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function FacultyTimetable() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [conflictCheck, setConflictCheck] = useState<ConflictCheck | null>(null);

  const [formData, setFormData] = useState({
    subjectId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: '',
    semesterId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchTimetable();
    }
  }, [selectedSemester, profile]);

  useEffect(() => {
    if (formData.subjectId && formData.semesterId && formData.dayOfWeek && formData.startTime && formData.endTime) {
      checkConflict();
    } else {
      setConflictCheck(null);
    }
  }, [formData.subjectId, formData.semesterId, formData.dayOfWeek, formData.startTime, formData.endTime]);

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

      // Fetch my subjects
      const mappingsRes = await fetch(`/api/faculty-subject-map?facultyId=${myProfile.id}&limit=100`);
      const mappings = await mappingsRes.json();

      // Get unique subjects
      const uniqueSubjects = mappings.reduce((acc: Subject[], curr: any) => {
        if (!acc.find(s => s.id === curr.subjectId)) {
          acc.push({
            id: curr.subjectId,
            name: curr.subjectName,
            subjectCode: curr.subjectCode,
            subjectType: curr.subjectType || 'Theory',
            department: curr.department,
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

      const response = await fetch(url);
      const data = await response.json();
      setTimetable(data);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      toast.error('Failed to load timetable');
    }
  };

  const checkConflict = async () => {
    if (!profile || !formData.subjectId || !formData.semesterId) return;

    try {
      const response = await fetch('/api/timetable/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: profile.id,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          semesterId: parseInt(formData.semesterId),
          excludeId: editingEntry?.id,
        }),
      });

      const data = await response.json();
      setConflictCheck(data);
    } catch (error) {
      console.error('Failed to check conflict:', error);
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

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    if (conflictCheck?.hasConflict) {
      toast.error('Cannot save: Time slot conflicts with existing entry');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        facultyId: profile.id,
        subjectId: parseInt(formData.subjectId),
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomNumber: formData.roomNumber.trim() || null,
        semesterId: parseInt(formData.semesterId),
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

        toast.success('Timetable entry updated successfully');
      } else {
        // Create new entry
        const response = await fetch('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create timetable entry');
        }

        toast.success('Timetable entry created successfully');
      }

      setDialogOpen(false);
      setEditingEntry(null);
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
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      roomNumber: entry.roomNumber || '',
      semesterId: entry.semesterId.toString(),
    });
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

    if (!confirm('This will generate a weekly timetable based on your assigned subjects. Continue?')) {
      return;
    }

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

      const data = await response.json();
      toast.success(`Timetable generated! Created ${data.createdCount} entries.`);
      await fetchTimetable();
    } catch (error: any) {
      console.error('Failed to generate timetable:', error);
      toast.error(error.message || 'Failed to generate timetable');
    }
  };

  const resetForm = () => {
    setFormData({
      subjectId: '',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      roomNumber: '',
      semesterId: '',
    });
    setConflictCheck(null);
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    resetForm();
    setDialogOpen(true);
  };

  const getEntriesForDay = (day: string) => {
    return timetable
      .filter(entry => entry.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getSubjectTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Theory: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      Lab: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Practical: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };

    return (
      <Badge className={colors[type] || colors.Theory} variant="outline" className="text-xs">
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
          <h1 className="text-3xl font-bold tracking-tight">My Timetable</h1>
          <p className="text-muted-foreground">
            Manage your weekly class schedule with conflict detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateTimetable}>
            <Download className="h-4 w-4 mr-2" />
            Auto-Generate
          </Button>
          <Button onClick={handleNewEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timetable.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Subjects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mySubjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timetable.reduce((sum, entry) => {
                const start = parseInt(entry.startTime.split(':')[0]);
                const end = parseInt(entry.endTime.split(':')[0]);
                return sum + (end - start);
              }, 0)} hrs
            </div>
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
      </div>

      {/* Semester Filter */}
      {semesters.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter by Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-64">
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
          </CardContent>
        </Card>
      )}

      {/* Weekly Timetable View */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const entries = getEntriesForDay(day);
          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{day}</span>
                  <Badge variant="secondary">{entries.length} classes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No classes scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{entry.subjectName}</span>
                            <Badge variant="outline" className="text-xs">{entry.subjectCode}</Badge>
                            {getSubjectTypeBadge(entry.subjectType)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{entry.startTime} - {entry.endTime}</span>
                            </div>
                            {entry.roomNumber && (
                              <div className="flex items-center gap-1">
                                <span>Room: {entry.roomNumber}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-xs">{entry.semesterName} ({entry.year})</span>
                            </div>
                          </div>
                        </div>
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
            </DialogTitle>
            <DialogDescription>
              Schedule a class session. Conflicts will be detected automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                    {mySubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.subjectCode})
                      </SelectItem>
                    ))}
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

            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">
                Day of Week <span className="text-destructive">*</span>
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

            <div className="grid grid-cols-3 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g., A101"
                />
              </div>
            </div>

            {/* Conflict Warning */}
            {conflictCheck?.hasConflict && (
              <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-destructive">Time Conflict Detected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {conflictCheck.message}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || conflictCheck?.hasConflict}
              >
                {submitting
                  ? editingEntry
                    ? 'Updating...'
                    : 'Creating...'
                  : editingEntry
                  ? 'Update Entry'
                  : 'Create Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
