import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { billing } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    // Get current record first to check if it exists and for recalculation
    const currentRecord = await db
      .select()
      .from(billing)
      .where(eq(billing.id, parseInt(id)))
      .limit(1);

    if (currentRecord.length === 0) {
      return NextResponse.json(
        { error: 'Billing record not found' },
        { status: 404 }
      );
    }

    const current = currentRecord[0];
    const requestBody = await request.json();

    // Extract allowed fields from request
    const {
      baseSalary,
      allowances,
      deductions,
      workload,
      status,
      paidAt,
    } = requestBody;

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'processed', 'paid'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: 'Status must be pending, processed, or paid',
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields are non-negative if provided
    if (baseSalary !== undefined) {
      if (typeof baseSalary !== 'number' || baseSalary < 0) {
        return NextResponse.json(
          {
            error: 'Base salary must be a non-negative number',
            code: 'INVALID_BASE_SALARY',
          },
          { status: 400 }
        );
      }
    }

    if (allowances !== undefined) {
      if (typeof allowances !== 'number' || allowances < 0) {
        return NextResponse.json(
          {
            error: 'Allowances must be a non-negative number',
            code: 'INVALID_ALLOWANCES',
          },
          { status: 400 }
        );
      }
    }

    if (deductions !== undefined) {
      if (typeof deductions !== 'number' || deductions < 0) {
        return NextResponse.json(
          {
            error: 'Deductions must be a non-negative number',
            code: 'INVALID_DEDUCTIONS',
          },
          { status: 400 }
        );
      }
    }

    // Validate workload format if provided
    let workloadString = undefined;
    if (workload !== undefined) {
      if (
        typeof workload !== 'object' ||
        workload === null ||
        Array.isArray(workload)
      ) {
        return NextResponse.json(
          {
            error: 'Workload must be an object',
            code: 'INVALID_WORKLOAD_FORMAT',
          },
          { status: 400 }
        );
      }

      if (
        typeof workload.lectures !== 'number' ||
        typeof workload.labs !== 'number' ||
        typeof workload.tutorials !== 'number'
      ) {
        return NextResponse.json(
          {
            error:
              'Workload must contain lectures, labs, and tutorials as numbers',
            code: 'INVALID_WORKLOAD_STRUCTURE',
          },
          { status: 400 }
        );
      }

      if (
        workload.lectures < 0 ||
        workload.labs < 0 ||
        workload.tutorials < 0
      ) {
        return NextResponse.json(
          {
            error: 'Workload values must be non-negative',
            code: 'INVALID_WORKLOAD_VALUES',
          },
          { status: 400 }
        );
      }

      workloadString = JSON.stringify(workload);
    }

    // Recalculate netSalary if any financial field is updated
    const updatedBaseSalary = baseSalary ?? current.baseSalary;
    const updatedAllowances = allowances ?? current.allowances;
    const updatedDeductions = deductions ?? current.deductions;
    const netSalary =
      updatedBaseSalary + updatedAllowances - updatedDeductions;

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString(),
      netSalary,
    };

    if (baseSalary !== undefined) updates.baseSalary = baseSalary;
    if (allowances !== undefined) updates.allowances = allowances;
    if (deductions !== undefined) updates.deductions = deductions;
    if (workloadString !== undefined) updates.workload = workloadString;
    if (status !== undefined) updates.status = status;

    // If status changed to 'paid' and paidAt not provided, set current timestamp
    if (status === 'paid' && paidAt === undefined && current.paidAt === null) {
      updates.paidAt = new Date().toISOString();
    } else if (paidAt !== undefined) {
      updates.paidAt = paidAt;
    }

    // Update billing record
    const updated = await db
      .update(billing)
      .set(updates)
      .where(eq(billing.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update billing record' },
        { status: 500 }
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