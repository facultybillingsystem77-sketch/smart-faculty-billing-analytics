import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workLogs, faculty, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Validate date format YYYY-MM-DD
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate time format HH:MM (24-hour)
function isValidTime(timeString: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}

// Calculate total hours between two times
function calculateHours(timeIn: string, timeOut: string): number {
  const [inHours, inMinutes] = timeIn.split(':').map(Number);
  const [outHours, outMinutes] = timeOut.split(':').map(Number);
  
  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;
  
  const diffMinutes = outTotalMinutes - inTotalMinutes;
  return diffMinutes / 60;
}

// Validate timeOut is after timeIn
function isTimeOutAfterTimeIn(timeIn: string, timeOut: string): boolean {
  const hours = calculateHours(timeIn, timeOut);
  return hours > 0;
}

// Validate activity type
function isValidActivityType(activityType: string): boolean {
  const validTypes = ['lecture', 'lab', 'tutorial', 'exam_duty', 'project_guidance', 'other'];
  return validTypes.includes(activityType);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Fetch work log with faculty and user details
    const result = await db
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
        employeeId: faculty.employeeId,
      })
      .from(workLogs)
      .innerJoin(faculty, eq(workLogs.facultyId, faculty.id))
      .innerJoin(user, eq(faculty.userId, user.id))
      .where(eq(workLogs.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Work log not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if work log exists
    const existing = await db
      .select()
      .from(workLogs)
      .where(eq(workLogs.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Work log not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { date, timeIn, timeOut, department, subject, activityType, description } = body;

    // Validate date format if provided
    if (date !== undefined && !isValidDate(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    // Validate time formats if provided
    if (timeIn !== undefined && !isValidTime(timeIn)) {
      return NextResponse.json(
        { error: 'Invalid timeIn format. Use HH:MM (24-hour format)', code: 'INVALID_TIME_IN_FORMAT' },
        { status: 400 }
      );
    }

    if (timeOut !== undefined && !isValidTime(timeOut)) {
      return NextResponse.json(
        { error: 'Invalid timeOut format. Use HH:MM (24-hour format)', code: 'INVALID_TIME_OUT_FORMAT' },
        { status: 400 }
      );
    }

    // Determine final timeIn and timeOut for validation
    const finalTimeIn = timeIn !== undefined ? timeIn : existing[0].timeIn;
    const finalTimeOut = timeOut !== undefined ? timeOut : existing[0].timeOut;

    // Validate timeOut is after timeIn
    if (!isTimeOutAfterTimeIn(finalTimeIn, finalTimeOut)) {
      return NextResponse.json(
        { error: 'timeOut must be after timeIn', code: 'INVALID_TIME_RANGE' },
        { status: 400 }
      );
    }

    // Validate activity type if provided
    if (activityType !== undefined && !isValidActivityType(activityType)) {
      return NextResponse.json(
        { error: 'Invalid activityType. Must be one of: lecture, lab, tutorial, exam_duty, project_guidance, other', code: 'INVALID_ACTIVITY_TYPE' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (date !== undefined) updates.date = date;
    if (timeIn !== undefined) updates.timeIn = timeIn;
    if (timeOut !== undefined) updates.timeOut = timeOut;
    if (department !== undefined) updates.department = department;
    if (subject !== undefined) updates.subject = subject;
    if (activityType !== undefined) updates.activityType = activityType;
    if (description !== undefined) updates.description = description;

    // Recalculate totalHours if time fields changed
    if (timeIn !== undefined || timeOut !== undefined) {
      updates.totalHours = calculateHours(finalTimeIn, finalTimeOut);
    }

    // Update the work log
    const updated = await db
      .update(workLogs)
      .set(updates)
      .where(eq(workLogs.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update work log', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if work log exists
    const existing = await db
      .select()
      .from(workLogs)
      .where(eq(workLogs.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Work log not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the work log
    const deleted = await db
      .delete(workLogs)
      .where(eq(workLogs.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete work log', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Work log deleted successfully',
        deletedRecord: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}