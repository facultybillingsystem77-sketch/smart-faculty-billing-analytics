import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { billing, faculty, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const designation = searchParams.get('designation');
    const month = searchParams.get('month');

    // Validate month format if provided
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { 
          error: 'Invalid month format. Expected YYYY-MM',
          code: 'INVALID_MONTH_FORMAT'
        },
        { status: 400 }
      );
    }

    // Build query with joins
    let query = db
      .select({
        billingId: billing.id,
        facultyId: faculty.id,
        facultyName: user.name,
        employeeId: faculty.employeeId,
        department: faculty.department,
        designation: faculty.designation,
        month: billing.month,
        workload: billing.workload,
      })
      .from(billing)
      .leftJoin(faculty, eq(billing.facultyId, faculty.id))
      .leftJoin(user, eq(faculty.userId, user.id));

    // Apply filters
    const conditions = [];
    if (department) {
      conditions.push(eq(faculty.department, department));
    }
    if (designation) {
      conditions.push(eq(faculty.designation, designation));
    }
    if (month) {
      conditions.push(eq(billing.month, month));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const records = await query;

    // Group by faculty and calculate workload statistics
    const facultyWorkloadMap = new Map<number, {
      facultyId: number;
      facultyName: string;
      employeeId: string;
      department: string;
      designation: string;
      totalLectures: number;
      totalLabs: number;
      totalTutorials: number;
      totalWorkload: number;
      monthCount: number;
    }>();

    for (const record of records) {
      if (!record.facultyId) continue;

      // Parse workload JSON, handle invalid JSON gracefully
      let workloadData: { lectures: number; labs: number; tutorials: number };
      try {
        if (typeof record.workload === 'string') {
          workloadData = JSON.parse(record.workload);
        } else if (typeof record.workload === 'object' && record.workload !== null) {
          workloadData = record.workload as { lectures: number; labs: number; tutorials: number };
        } else {
          workloadData = { lectures: 0, labs: 0, tutorials: 0 };
        }
      } catch (error) {
        console.error('Error parsing workload JSON:', error);
        workloadData = { lectures: 0, labs: 0, tutorials: 0 };
      }

      const lectures = Number(workloadData.lectures) || 0;
      const labs = Number(workloadData.labs) || 0;
      const tutorials = Number(workloadData.tutorials) || 0;
      const monthWorkload = lectures + labs + tutorials;

      if (facultyWorkloadMap.has(record.facultyId)) {
        const existing = facultyWorkloadMap.get(record.facultyId)!;
        existing.totalLectures += lectures;
        existing.totalLabs += labs;
        existing.totalTutorials += tutorials;
        existing.totalWorkload += monthWorkload;
        existing.monthCount += 1;
      } else {
        facultyWorkloadMap.set(record.facultyId, {
          facultyId: record.facultyId,
          facultyName: record.facultyName || '',
          employeeId: record.employeeId || '',
          department: record.department || '',
          designation: record.designation || '',
          totalLectures: lectures,
          totalLabs: labs,
          totalTutorials: tutorials,
          totalWorkload: monthWorkload,
          monthCount: 1,
        });
      }
    }

    // Calculate averages and format response
    const workload = Array.from(facultyWorkloadMap.values()).map(item => ({
      facultyId: item.facultyId,
      facultyName: item.facultyName,
      employeeId: item.employeeId,
      department: item.department,
      designation: item.designation,
      totalLectures: item.totalLectures,
      totalLabs: item.totalLabs,
      totalTutorials: item.totalTutorials,
      totalWorkload: item.totalWorkload,
      averageWorkload: item.monthCount > 0 
        ? Math.round((item.totalWorkload / item.monthCount) * 10) / 10 
        : 0,
    }));

    // Sort by totalWorkload descending (busiest faculty first)
    workload.sort((a, b) => b.totalWorkload - a.totalWorkload);

    return NextResponse.json({ workload }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}