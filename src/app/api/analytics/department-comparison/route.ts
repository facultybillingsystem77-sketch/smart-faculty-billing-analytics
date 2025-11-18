import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { billing, faculty } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startMonth = searchParams.get('startMonth');
    const endMonth = searchParams.get('endMonth');

    // Validate date format if provided
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (startMonth && !dateRegex.test(startMonth)) {
      return NextResponse.json({
        error: 'Invalid startMonth format. Expected YYYY-MM',
        code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }
    if (endMonth && !dateRegex.test(endMonth)) {
      return NextResponse.json({
        error: 'Invalid endMonth format. Expected YYYY-MM',
        code: 'INVALID_DATE_FORMAT'
      }, { status: 400 });
    }

    // Build query with date filters
    let query = db.select({
      billingId: billing.id,
      facultyId: billing.facultyId,
      month: billing.month,
      baseSalary: billing.baseSalary,
      allowances: billing.allowances,
      deductions: billing.deductions,
      netSalary: billing.netSalary,
      workload: billing.workload,
      department: faculty.department,
    }).from(billing).leftJoin(faculty, eq(billing.facultyId, faculty.id));

    // Apply date range filters
    const conditions = [];
    if (startMonth) {
      conditions.push(gte(billing.month, startMonth));
    }
    if (endMonth) {
      conditions.push(lte(billing.month, endMonth));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    // Group by department and calculate aggregates
    const departmentMap = new Map<string, {
      department: string;
      facultyIds: Set<number>;
      totalSalary: number;
      salaries: number[];
      totalAllowances: number;
      totalDeductions: number;
      totalWorkload: number;
    }>();

    for (const record of results) {
      const dept = record.department || 'Unknown';
      
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          department: dept,
          facultyIds: new Set(),
          totalSalary: 0,
          salaries: [],
          totalAllowances: 0,
          totalDeductions: 0,
          totalWorkload: 0,
        });
      }

      const deptData = departmentMap.get(dept)!;
      
      // Track unique faculty members
      if (record.facultyId) {
        deptData.facultyIds.add(record.facultyId);
      }

      // Sum financial metrics
      deptData.totalSalary += record.netSalary || 0;
      deptData.salaries.push(record.netSalary || 0);
      deptData.totalAllowances += record.allowances || 0;
      deptData.totalDeductions += record.deductions || 0;

      // Parse and sum workload
      try {
        const workload = record.workload as { lectures?: number; labs?: number; tutorials?: number } | null;
        if (workload) {
          const lectures = workload.lectures || 0;
          const labs = workload.labs || 0;
          const tutorials = workload.tutorials || 0;
          deptData.totalWorkload += lectures + labs + tutorials;
        }
      } catch (error) {
        console.error('Error parsing workload JSON:', error);
        // Continue processing other records
      }
    }

    // Transform to final format with calculated averages
    const comparison = Array.from(departmentMap.values()).map(dept => ({
      department: dept.department,
      facultyCount: dept.facultyIds.size,
      totalSalary: Math.round(dept.totalSalary * 100) / 100,
      averageSalary: dept.salaries.length > 0 
        ? Math.round((dept.totalSalary / dept.salaries.length) * 100) / 100 
        : 0,
      totalAllowances: Math.round(dept.totalAllowances * 100) / 100,
      totalDeductions: Math.round(dept.totalDeductions * 100) / 100,
      totalWorkload: dept.totalWorkload,
    }));

    // Sort by totalSalary descending
    comparison.sort((a, b) => b.totalSalary - a.totalSalary);

    return NextResponse.json({ comparison }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}