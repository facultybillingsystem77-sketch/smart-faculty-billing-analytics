import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { faculty, user, billing, workLogs, facultySubjectMap, timetable } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'Electrical Engineering',
  'Food Technology',
  'Mechatronics',
  'Civil & Infrastructure'
];
const VALID_DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid faculty ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        id: faculty.id,
        userId: faculty.userId,
        employeeId: faculty.employeeId,
        department: faculty.department,
        designation: faculty.designation,
        joiningDate: faculty.joiningDate,
        baseSalary: faculty.baseSalary,
        phone: faculty.phone,
        address: faculty.address,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(faculty)
      .leftJoin(user, eq(faculty.userId, user.id))
      .where(eq(faculty.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Faculty not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const facultyRecord = result[0];
    const response = {
      id: facultyRecord.id,
      userId: facultyRecord.userId,
      employeeId: facultyRecord.employeeId,
      department: facultyRecord.department,
      designation: facultyRecord.designation,
      joiningDate: facultyRecord.joiningDate,
      baseSalary: facultyRecord.baseSalary,
      phone: facultyRecord.phone,
      address: facultyRecord.address,
      createdAt: facultyRecord.createdAt,
      updatedAt: facultyRecord.updatedAt,
      user: {
        name: facultyRecord.userName,
        email: facultyRecord.userEmail,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid faculty ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate department if provided
    if (body.department && !VALID_DEPARTMENTS.includes(body.department)) {
      return NextResponse.json(
        {
          error: `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(', ')}`,
          code: 'INVALID_DEPARTMENT',
        },
        { status: 400 }
      );
    }

    // Validate designation if provided
    if (body.designation && !VALID_DESIGNATIONS.includes(body.designation)) {
      return NextResponse.json(
        {
          error: `Invalid designation. Must be one of: ${VALID_DESIGNATIONS.join(', ')}`,
          code: 'INVALID_DESIGNATION',
        },
        { status: 400 }
      );
    }

    // Validate baseSalary if provided
    if (body.baseSalary !== undefined) {
      const salary = parseFloat(body.baseSalary);
      if (isNaN(salary) || salary <= 0) {
        return NextResponse.json(
          {
            error: 'Base salary must be a positive number',
            code: 'INVALID_SALARY',
          },
          { status: 400 }
        );
      }
    }

    // Validate joiningDate format if provided
    if (body.joiningDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.joiningDate)) {
        return NextResponse.json(
          {
            error: 'Joining date must be in YYYY-MM-DD format',
            code: 'INVALID_DATE_FORMAT',
          },
          { status: 400 }
        );
      }

      // Additional validation to check if it's a valid date
      const date = new Date(body.joiningDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid joining date',
            code: 'INVALID_DATE',
          },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.employeeId !== undefined) updates.employeeId = body.employeeId;
    if (body.department !== undefined) updates.department = body.department;
    if (body.designation !== undefined) updates.designation = body.designation;
    if (body.joiningDate !== undefined) updates.joiningDate = body.joiningDate;
    if (body.baseSalary !== undefined) updates.baseSalary = parseFloat(body.baseSalary);
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.address !== undefined) updates.address = body.address;

    const updated = await db
      .update(faculty)
      .set(updates)
      .where(eq(faculty.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Faculty not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid faculty ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if faculty exists
    const existing = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Faculty not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete all related records first to avoid foreign key constraint errors
    // 1. Delete billing records
    await db.delete(billing).where(eq(billing.facultyId, parseInt(id)));

    // 2. Delete work logs
    await db.delete(workLogs).where(eq(workLogs.facultyId, parseInt(id)));

    // 3. Delete faculty-subject mappings
    await db.delete(facultySubjectMap).where(eq(facultySubjectMap.facultyId, parseInt(id)));

    // 4. Delete timetable entries
    await db.delete(timetable).where(eq(timetable.facultyId, parseInt(id)));

    // 5. Finally, delete the faculty record
    const deleted = await db
      .delete(faculty)
      .where(eq(faculty.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Faculty deleted successfully',
        faculty: deleted[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}