import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long', code: 'PASSWORD_TOO_SHORT' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'faculty'];
    const userRole = role || 'faculty';
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Role must be either admin or faculty', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_EXISTS' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate timestamps
    const now = new Date().toISOString();

    // Insert new user
    const newUser = await db
      .insert(user)
      .values({
        email: sanitizedEmail,
        password: hashedPassword,
        role: userRole,
        name: sanitizedName,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser[0];

    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}