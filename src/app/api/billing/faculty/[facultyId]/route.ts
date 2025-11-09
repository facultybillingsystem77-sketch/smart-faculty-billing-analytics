import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { billing, faculty, user } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facultyId: string }> }
) {
  try {
    const { facultyId } = await params;
    const { searchParams } = new URL(request.url);

    // Validate facultyId parameter
    if (!facultyId || isNaN(parseInt(facultyId))) {
      return NextResponse.json(
        {
          error: 'Valid faculty ID is required',
          code: 'INVALID_FACULTY_ID',
        },
        { status: 400 }
      );
    }

    const facultyIdInt = parseInt(facultyId);

    // Check if faculty exists
    const facultyExists = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, facultyIdInt))
      .limit(1);

    if (facultyExists.length === 0) {
      return NextResponse.json(
        {
          error: 'Faculty not found',
          code: 'FACULTY_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const startMonth = searchParams.get('startMonth');
    const endMonth = searchParams.get('endMonth');

    // Build query with joins
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
        faculty: {
          employeeId: faculty.employeeId,
          name: user.name,
        },
      })
      .from(billing)
      .leftJoin(faculty, eq(billing.facultyId, faculty.id))
      .leftJoin(user, eq(faculty.userId, user.id))
      .$dynamic();

    // Build where conditions
    const conditions = [eq(billing.facultyId, facultyIdInt)];

    // Apply month filter
    if (month) {
      conditions.push(eq(billing.month, month));
    }

    // Apply status filter
    if (status) {
      conditions.push(eq(billing.status, status));
    }

    // Apply date range filter
    if (startMonth) {
      conditions.push(gte(billing.month, startMonth));
    }

    if (endMonth) {
      conditions.push(lte(billing.month, endMonth));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting, pagination
    const results = await query
      .orderBy(desc(billing.month))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}