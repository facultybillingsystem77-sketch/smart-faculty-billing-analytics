import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    // Validate email is provided
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { 
          error: 'Email is required',
          code: 'MISSING_EMAIL' 
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Mode 1: Initiate reset (email only)
    if (!newPassword) {
      return NextResponse.json(
        { 
          message: 'Password reset initiated. Check your email for instructions.' 
        },
        { status: 200 }
      );
    }

    // Mode 2: Complete reset (email + newPassword)
    
    // Validate password
    if (typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'New password is required',
          code: 'MISSING_PASSWORD' 
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 6 characters long',
          code: 'PASSWORD_TOO_SHORT' 
        },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and updatedAt timestamp
    const updatedUser = await db
      .update(user)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(user.email, normalizedEmail))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update password',
          code: 'UPDATE_FAILED' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Password reset successful' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}