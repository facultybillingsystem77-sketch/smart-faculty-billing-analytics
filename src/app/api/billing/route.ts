import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { billing, faculty, user } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const facultyIdParam = searchParams.get('facultyId');
    const monthParam = searchParams.get('month');
    const statusParam = searchParams.get('status');

    let query = db
      .select({
        id: billing.id,
        facultyId: billing.facultyId,
        month: billing.month,
        baseSalary: billing.baseSalary,
        allowances: billing.allowances,
        deductions: billing.deductions,
        netSalary: billing.netSalary,
        workload: billing.workload,
        status: billing.status,
        generatedAt: billing.generatedAt,
        paidAt: billing.paidAt,
        createdAt: billing.createdAt,
        updatedAt: billing.updatedAt,
        employeeId: faculty.employeeId,
        facultyName: user.name,
      })
      .from(billing)
      .leftJoin(faculty, eq(billing.facultyId, faculty.id))
      .leftJoin(user, eq(faculty.userId, user.id))
      .orderBy(desc(billing.generatedAt));

    const conditions = [];

    if (facultyIdParam) {
      const facultyId = parseInt(facultyIdParam);
      if (!isNaN(facultyId)) {
        conditions.push(eq(billing.facultyId, facultyId));
      }
    }

    if (monthParam) {
      conditions.push(eq(billing.month, monthParam));
    }

    if (statusParam) {
      conditions.push(eq(billing.status, statusParam));
    }

    if (search) {
      conditions.push(like(faculty.employeeId, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
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
      facultyId,
      month,
      baseSalary,
      allowances,
      deductions,
      workload,
      status,
    } = body;

    // Validate required fields
    if (!facultyId) {
      return NextResponse.json(
        { error: 'facultyId is required', code: 'MISSING_FACULTY_ID' },
        { status: 400 }
      );
    }

    if (!month) {
      return NextResponse.json(
        { error: 'month is required', code: 'MISSING_MONTH' },
        { status: 400 }
      );
    }

    if (baseSalary === undefined || baseSalary === null) {
      return NextResponse.json(
        { error: 'baseSalary is required', code: 'MISSING_BASE_SALARY' },
        { status: 400 }
      );
    }

    if (allowances === undefined || allowances === null) {
      return NextResponse.json(
        { error: 'allowances is required', code: 'MISSING_ALLOWANCES' },
        { status: 400 }
      );
    }

    if (deductions === undefined || deductions === null) {
      return NextResponse.json(
        { error: 'deductions is required', code: 'MISSING_DEDUCTIONS' },
        { status: 400 }
      );
    }

    if (!workload) {
      return NextResponse.json(
        { error: 'workload is required', code: 'MISSING_WORKLOAD' },
        { status: 400 }
      );
    }

    // Validate month format
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        {
          error: 'month must be in YYYY-MM format',
          code: 'INVALID_MONTH_FORMAT',
        },
        { status: 400 }
      );
    }

    // Validate numeric fields are non-negative
    if (baseSalary < 0) {
      return NextResponse.json(
        {
          error: 'baseSalary must be non-negative',
          code: 'INVALID_BASE_SALARY',
        },
        { status: 400 }
      );
    }

    if (allowances < 0) {
      return NextResponse.json(
        {
          error: 'allowances must be non-negative',
          code: 'INVALID_ALLOWANCES',
        },
        { status: 400 }
      );
    }

    if (deductions < 0) {
      return NextResponse.json(
        {
          error: 'deductions must be non-negative',
          code: 'INVALID_DEDUCTIONS',
        },
        { status: 400 }
      );
    }

    // Validate workload object structure
    if (
      typeof workload !== 'object' ||
      workload === null ||
      typeof workload.lectures !== 'number' ||
      typeof workload.labs !== 'number' ||
      typeof workload.tutorials !== 'number'
    ) {
      return NextResponse.json(
        {
          error:
            'workload must be an object with lectures, labs, and tutorials as numbers',
          code: 'INVALID_WORKLOAD',
        },
        { status: 400 }
      );
    }

    // Validate workload numbers are non-negative
    if (
      workload.lectures < 0 ||
      workload.labs < 0 ||
      workload.tutorials < 0
    ) {
      return NextResponse.json(
        {
          error: 'workload values must be non-negative',
          code: 'INVALID_WORKLOAD_VALUES',
        },
        { status: 400 }
      );
    }

    // Validate facultyId exists
    const facultyRecord = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, facultyId))
      .limit(1);

    if (facultyRecord.length === 0) {
      return NextResponse.json(
        { error: 'Faculty not found', code: 'FACULTY_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate status
    const billingStatus = status || 'pending';
    const validStatuses = ['pending', 'processed', 'paid'];
    if (!validStatuses.includes(billingStatus)) {
      return NextResponse.json(
        {
          error: 'status must be one of: pending, processed, paid',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Calculate net salary
    const netSalary = baseSalary + allowances - deductions;

    // Generate timestamps
    const now = new Date().toISOString();

    // Store workload as JSON string
    const workloadJson = JSON.stringify(workload);

    // Insert billing record
    const newBilling = await db
      .insert(billing)
      .values({
        facultyId,
        month,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        workload: workloadJson as any,
        status: billingStatus,
        generatedAt: now,
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newBilling[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}