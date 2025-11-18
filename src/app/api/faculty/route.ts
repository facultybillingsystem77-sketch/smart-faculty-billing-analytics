import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { faculty, user } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

const VALID_DEPARTMENTS = [
  'Artificial Intelligence & Data Science',
  'Electrical Engineering',
  'Food Technology',
  'Mechatronics',
  'Civil & Infrastructure'
];
const VALID_DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const departmentFilter = searchParams.get('department');
    const designationFilter = searchParams.get('designation');

    let query = db.select({
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
    }).from(faculty).leftJoin(user, eq(faculty.userId, user.id));

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(user.name, `%${search}%`),
          like(faculty.employeeId, `%${search}%`),
          like(faculty.department, `%${search}%`),
          like(faculty.designation, `%${search}%`)
        )
      );
    }

    if (departmentFilter) {
      conditions.push(eq(faculty.department, departmentFilter));
    }

    if (designationFilter) {
      conditions.push(eq(faculty.designation, designationFilter));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      employeeId,
      department,
      designation,
      joiningDate,
      baseSalary,
      phone,
      address,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
      return NextResponse.json(
        { error: 'Employee ID is required', code: 'MISSING_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    if (!department || typeof department !== 'string' || department.trim() === '') {
      return NextResponse.json(
        { error: 'Department is required', code: 'MISSING_DEPARTMENT' },
        { status: 400 }
      );
    }

    if (!designation || typeof designation !== 'string' || designation.trim() === '') {
      return NextResponse.json(
        { error: 'Designation is required', code: 'MISSING_DESIGNATION' },
        { status: 400 }
      );
    }

    if (!joiningDate || typeof joiningDate !== 'string' || joiningDate.trim() === '') {
      return NextResponse.json(
        { error: 'Joining date is required', code: 'MISSING_JOINING_DATE' },
        { status: 400 }
      );
    }

    if (baseSalary === undefined || baseSalary === null) {
      return NextResponse.json(
        { error: 'Base salary is required', code: 'MISSING_BASE_SALARY' },
        { status: 400 }
      );
    }

    // Validate department
    if (!VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json(
        {
          error: `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(', ')}`,
          code: 'INVALID_DEPARTMENT',
        },
        { status: 400 }
      );
    }

    // Validate designation
    if (!VALID_DESIGNATIONS.includes(designation)) {
      return NextResponse.json(
        {
          error: `Invalid designation. Must be one of: ${VALID_DESIGNATIONS.join(', ')}`,
          code: 'INVALID_DESIGNATION',
        },
        { status: 400 }
      );
    }

    // Validate joiningDate format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(joiningDate)) {
      return NextResponse.json(
        {
          error: 'Invalid joining date format. Must be YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT',
        },
        { status: 400 }
      );
    }

    // Validate date is valid
    const dateObj = new Date(joiningDate);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid joining date', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    // Validate baseSalary is positive number
    const salary = parseFloat(baseSalary);
    if (isNaN(salary) || salary <= 0) {
      return NextResponse.json(
        {
          error: 'Base salary must be a positive number',
          code: 'INVALID_BASE_SALARY',
        },
        { status: 400 }
      );
    }

    // Check if userId exists in user table
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User does not exist', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check if employeeId is unique
    const existingFaculty = await db
      .select()
      .from(faculty)
      .where(eq(faculty.employeeId, employeeId.trim()))
      .limit(1);

    if (existingFaculty.length > 0) {
      return NextResponse.json(
        { error: 'Employee ID already exists', code: 'DUPLICATE_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    // Create new faculty record
    const now = new Date().toISOString();
    const newFaculty = await db
      .insert(faculty)
      .values({
        userId,
        employeeId: employeeId.trim(),
        department: department.trim(),
        designation: designation.trim(),
        joiningDate: joiningDate.trim(),
        baseSalary: salary,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newFaculty[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}