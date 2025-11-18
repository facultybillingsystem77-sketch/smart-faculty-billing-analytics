import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq, like, and, asc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = db.select().from(subjects);

    const conditions = [];

    // By default, only return active subjects unless includeInactive is true
    if (!includeInactive) {
      conditions.push(eq(subjects.isActive, 1));
    }

    // Filter by department if provided
    if (department) {
      conditions.push(eq(subjects.department, department));
    }

    // Search by name if provided
    if (search) {
      conditions.push(like(subjects.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort by department ASC, then name ASC
    const results = await query
      .orderBy(asc(subjects.department), asc(subjects.name))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, department, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!department || typeof department !== 'string' || department.trim() === '') {
      return NextResponse.json(
        { error: 'Department is required and must be a non-empty string', code: 'INVALID_DEPARTMENT' },
        { status: 400 }
      );
    }

    // Trim and sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedDepartment = department.trim();

    // Check if subject name already exists (case-insensitive)
    const existingSubject = await db.select()
      .from(subjects)
      .where(sql`lower(${subjects.name}) = lower(${sanitizedName})`)
      .limit(1);

    if (existingSubject.length > 0) {
      return NextResponse.json(
        { error: 'A subject with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      name: sanitizedName,
      department: sanitizedDepartment,
      isActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
      createdAt: now,
      updatedAt: now,
    };

    // Insert the new subject
    const newSubject = await db.insert(subjects)
      .values(insertData)
      .returning();

    return NextResponse.json(newSubject[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}