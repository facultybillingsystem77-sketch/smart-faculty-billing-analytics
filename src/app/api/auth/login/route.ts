import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email and password are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Query user by email
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.email, email.toLowerCase().trim()))
      .limit(1);

    // Check if user exists
    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    const foundUser = existingUser[0];

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const tokenPayload = {
      userId: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
      name: foundUser.name
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: '7d'
    });

    // Return success response
    return NextResponse.json(
      {
        token,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          role: foundUser.role,
          name: foundUser.name
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}