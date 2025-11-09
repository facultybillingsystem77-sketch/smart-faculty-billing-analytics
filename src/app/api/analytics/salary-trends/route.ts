import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { billing, faculty } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const designation = searchParams.get('designation');
    const startMonth = searchParams.get('startMonth');
    const endMonth = searchParams.get('endMonth');

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}$/;
    if (startMonth && !dateRegex.test(startMonth)) {
      return NextResponse.json(
        { 
          error: 'Invalid startMonth format. Use YYYY-MM',
          code: 'INVALID_DATE_FORMAT'
        },
        { status: 400 }
      );
    }
    if (endMonth && !dateRegex.test(endMonth)) {
      return NextResponse.json(
        { 
          error: 'Invalid endMonth format. Use YYYY-MM',
          code: 'INVALID_DATE_FORMAT'
        },
        { status: 400 }
      );
    }

    // Build query with left join to faculty table
    let query = db
      .select({
        month: billing.month,
        netSalary: billing.netSalary,
        allowances: billing.allowances,
        deductions: billing.deductions,
        department: faculty.department,
        designation: faculty.designation,
      })
      .from(billing)
      .leftJoin(faculty, eq(billing.facultyId, faculty.id));

    // Build filter conditions
    const conditions = [];

    if (department) {
      conditions.push(eq(faculty.department, department));
    }

    if (designation) {
      conditions.push(eq(faculty.designation, designation));
    }

    if (startMonth) {
      conditions.push(gte(billing.month, startMonth));
    }

    if (endMonth) {
      conditions.push(lte(billing.month, endMonth));
    }

    // Apply filters if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query
    const results = await query;

    // Group by month and calculate aggregates
    const monthlyData = results.reduce((acc, record) => {
      const month = record.month;
      
      if (!acc[month]) {
        acc[month] = {
          month,
          totalSalary: 0,
          totalAllowances: 0,
          totalDeductions: 0,
          recordCount: 0,
          salarySum: 0,
        };
      }

      acc[month].totalSalary += record.netSalary || 0;
      acc[month].totalAllowances += record.allowances || 0;
      acc[month].totalDeductions += record.deductions || 0;
      acc[month].recordCount += 1;
      acc[month].salarySum += record.netSalary || 0;

      return acc;
    }, {} as Record<string, {
      month: string;
      totalSalary: number;
      totalAllowances: number;
      totalDeductions: number;
      recordCount: number;
      salarySum: number;
    }>);

    // Convert to array and calculate average salary
    const trends = Object.values(monthlyData).map(data => ({
      month: data.month,
      totalSalary: Math.round(data.totalSalary * 100) / 100,
      averageSalary: data.recordCount > 0 
        ? Math.round((data.salarySum / data.recordCount) * 100) / 100
        : 0,
      totalAllowances: Math.round(data.totalAllowances * 100) / 100,
      totalDeductions: Math.round(data.totalDeductions * 100) / 100,
      recordCount: data.recordCount,
    }));

    // Sort by month ascending (oldest to newest)
    trends.sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({ trends }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}