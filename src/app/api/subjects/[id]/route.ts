import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

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

    // Fetch subject by ID
    const subject = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, parseInt(id)))
      .limit(1);

    if (subject.length === 0) {
      return NextResponse.json(
        { error: 'Subject not found', code: 'SUBJECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(subject[0], { status: 200 });
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

    // Check if subject exists
    const existingSubject = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, parseInt(id)))
      .limit(1);

    if (existingSubject.length === 0) {
      return NextResponse.json(
        { error: 'Subject not found', code: 'SUBJECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, department, isActive } = body;

    // Validate inputs
    if (name !== undefined && typeof name === 'string' && name.trim() === '') {
      return NextResponse.json(
        { error: 'Subject name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (department !== undefined && typeof department === 'string' && department.trim() === '') {
      return NextResponse.json(
        { error: 'Department cannot be empty', code: 'INVALID_DEPARTMENT' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name !== undefined && typeof name === 'string' ? name.trim() : undefined;
    const sanitizedDepartment = department !== undefined && typeof department === 'string' ? department.trim() : undefined;

    // Check for duplicate name (if name is being updated)
    if (sanitizedName !== undefined) {
      const duplicateSubject = await db
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.name, sanitizedName),
            ne(subjects.id, parseInt(id))
          )
        )
        .limit(1);

      if (duplicateSubject.length > 0) {
        return NextResponse.json(
          { error: 'Subject name already exists', code: 'DUPLICATE_NAME' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      name?: string;
      department?: string;
      isActive?: number;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (sanitizedName !== undefined) {
      updateData.name = sanitizedName;
    }

    if (sanitizedDepartment !== undefined) {
      updateData.department = sanitizedDepartment;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive ? 1 : 0;
    }

    // Update subject
    const updated = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.id, parseInt(id)))
      .returning();

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

    // Check if subject exists
    const existingSubject = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, parseInt(id)))
      .limit(1);

    if (existingSubject.length === 0) {
      return NextResponse.json(
        { error: 'Subject not found', code: 'SUBJECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete: set isActive to false
    const deactivated = await db
      .update(subjects)
      .set({
        isActive: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subjects.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Subject deactivated successfully',
        subject: deactivated[0],
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