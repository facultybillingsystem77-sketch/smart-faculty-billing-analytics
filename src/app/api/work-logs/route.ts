import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workLogs, faculty, user } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// Helper function to validate date format (YYYY-MM-DD)
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Helper function to validate time format (HH:MM)
function isValidTime(timeString: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
}

// Helper function to calculate hours between two times
function calculateHours(timeIn: string, timeOut: string): number {
  const [inHours, inMinutes] = timeIn.split(':').map(Number);
  const [outHours, outMinutes] = timeOut.split(':').map(Number);
  
  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;
  
  const diffMinutes = outTotalMinutes - inTotalMinutes;
  return diffMinutes / 60;
}

// Helper function to validate timeOut is after timeIn
function isTimeOutAfterTimeIn(timeIn: string, timeOut: string): boolean {
  const hours = calculateHours(timeIn, timeOut);
  return hours > 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Filter parameters
    const facultyIdParam = searchParams.get('facultyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const departmentParam = searchParams.get('department');
    const activityTypeParam = searchParams.get('activityType');
    
    // Build WHERE conditions
    const conditions = [];
    
    if (facultyIdParam) {
      const facultyId = parseInt(facultyIdParam);
      if (isNaN(facultyId)) {
        return NextResponse.json({
          error: 'Invalid facultyId parameter',
          code: 'INVALID_FACULTY_ID'
        }, { status: 400 });
      }
      conditions.push(eq(workLogs.facultyId, facultyId));
    }
    
    if (startDate) {
      if (!isValidDate(startDate)) {
        return NextResponse.json({
          error: 'Invalid startDate format. Use YYYY-MM-DD',
          code: 'INVALID_START_DATE'
        }, { status: 400 });
      }
      conditions.push(gte(workLogs.date, startDate));
    }
    
    if (endDate) {
      if (!isValidDate(endDate)) {
        return NextResponse.json({
          error: 'Invalid endDate format. Use YYYY-MM-DD',
          code: 'INVALID_END_DATE'
        }, { status: 400 });
      }
      conditions.push(lte(workLogs.date, endDate));
    }
    
    if (departmentParam) {
      conditions.push(eq(workLogs.department, departmentParam));
    }
    
    if (activityTypeParam) {
      const validActivityTypes = ['lecture', 'lab', 'tutorial', 'exam_duty', 'project_guidance', 'other'];
      if (!validActivityTypes.includes(activityTypeParam)) {
        return NextResponse.json({
          error: 'Invalid activityType. Must be one of: lecture, lab, tutorial, exam_duty, project_guidance, other',
          code: 'INVALID_ACTIVITY_TYPE'
        }, { status: 400 });
      }
      conditions.push(eq(workLogs.activityType, activityTypeParam));
    }
    
    // Build query with joins
    let query = db
      .select({
        id: workLogs.id,
        facultyId: workLogs.facultyId,
        date: workLogs.date,
        timeIn: workLogs.timeIn,
        timeOut: workLogs.timeOut,
        department: workLogs.department,
        subject: workLogs.subject,
        activityType: workLogs.activityType,
        description: workLogs.description,
        totalHours: workLogs.totalHours,
        createdAt: workLogs.createdAt,
        updatedAt: workLogs.updatedAt,
        facultyName: user.name,
        employeeId: faculty.employeeId
      })
      .from(workLogs)
      .innerJoin(faculty, eq(workLogs.facultyId, faculty.id))
      .innerJoin(user, eq(faculty.userId, user.id));
    
    // Apply WHERE conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting and pagination
    const results = await query
      .orderBy(desc(workLogs.date), desc(workLogs.timeIn))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      facultyId,
      date,
      timeIn,
      timeOut,
      department,
      subject,
      activityType,
      description
    } = body;
    
    // Validate required fields
    if (!facultyId) {
      return NextResponse.json({
        error: 'facultyId is required',
        code: 'MISSING_FACULTY_ID'
      }, { status: 400 });
    }
    
    if (!date) {
      return NextResponse.json({
        error: 'date is required',
        code: 'MISSING_DATE'
      }, { status: 400 });
    }
    
    if (!timeIn) {
      return NextResponse.json({
        error: 'timeIn is required',
        code: 'MISSING_TIME_IN'
      }, { status: 400 });
    }
    
    if (!timeOut) {
      return NextResponse.json({
        error: 'timeOut is required',
        code: 'MISSING_TIME_OUT'
      }, { status: 400 });
    }
    
    if (!department) {
      return NextResponse.json({
        error: 'department is required',
        code: 'MISSING_DEPARTMENT'
      }, { status: 400 });
    }
    
    if (!subject) {
      return NextResponse.json({
        error: 'subject is required',
        code: 'MISSING_SUBJECT'
      }, { status: 400 });
    }
    
    if (!activityType) {
      return NextResponse.json({
        error: 'activityType is required',
        code: 'MISSING_ACTIVITY_TYPE'
      }, { status: 400 });
    }
    
    // Validate facultyId is a valid integer
    const parsedFacultyId = parseInt(facultyId);
    if (isNaN(parsedFacultyId)) {
      return NextResponse.json({
        error: 'facultyId must be a valid integer',
        code: 'INVALID_FACULTY_ID'
      }, { status: 400 });
    }
    
    // Validate facultyId exists
    const existingFaculty = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, parsedFacultyId))
      .limit(1);
    
    if (existingFaculty.length === 0) {
      return NextResponse.json({
        error: 'Faculty not found',
        code: 'FACULTY_NOT_FOUND'
      }, { status: 404 });
    }
    
    // Validate date format
    if (!isValidDate(date)) {
      return NextResponse.json({
        error: 'Invalid date format. Use YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }
    
    // Validate time formats
    if (!isValidTime(timeIn)) {
      return NextResponse.json({
        error: 'Invalid timeIn format. Use HH:MM (24-hour format)',
        code: 'INVALID_TIME_IN_FORMAT'
      }, { status: 400 });
    }
    
    if (!isValidTime(timeOut)) {
      return NextResponse.json({
        error: 'Invalid timeOut format. Use HH:MM (24-hour format)',
        code: 'INVALID_TIME_OUT_FORMAT'
      }, { status: 400 });
    }
    
    // Validate timeOut is after timeIn
    if (!isTimeOutAfterTimeIn(timeIn, timeOut)) {
      return NextResponse.json({
        error: 'timeOut must be after timeIn',
        code: 'INVALID_TIME_RANGE'
      }, { status: 400 });
    }
    
    // Validate activityType
    const validActivityTypes = ['lecture', 'lab', 'tutorial', 'exam_duty', 'project_guidance', 'other'];
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json({
        error: 'Invalid activityType. Must be one of: lecture, lab, tutorial, exam_duty, project_guidance, other',
        code: 'INVALID_ACTIVITY_TYPE'
      }, { status: 400 });
    }
    
    // Calculate total hours
    const totalHours = calculateHours(timeIn, timeOut);
    
    // Create work log
    const now = new Date().toISOString();
    const newWorkLog = await db
      .insert(workLogs)
      .values({
        facultyId: parsedFacultyId,
        date: date.trim(),
        timeIn: timeIn.trim(),
        timeOut: timeOut.trim(),
        department: department.trim(),
        subject: subject.trim(),
        activityType: activityType.trim(),
        description: description ? description.trim() : null,
        totalHours,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    return NextResponse.json(newWorkLog[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}