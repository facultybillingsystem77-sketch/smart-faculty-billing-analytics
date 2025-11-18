import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, faculty } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user from database
    const users = await db.select().from(user).where(eq(user.id, decoded.userId));
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = users[0];
    const profile: any = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      createdAt: currentUser.createdAt,
    };

    // If faculty, get additional details
    if (currentUser.role === 'faculty') {
      const facultyData = await db.select().from(faculty).where(eq(faculty.userId, currentUser.id));
      if (facultyData.length > 0) {
        profile.faculty = facultyData[0];
      }
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Update user name
    await db.update(user)
      .set({
        name,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(user.id, decoded.userId));

    // If faculty, update additional details
    if (decoded.role === 'faculty' && (phone !== undefined || address !== undefined)) {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };
      
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;

      await db.update(faculty)
        .set(updateData)
        .where(eq(faculty.userId, decoded.userId));
    }

    // Update localStorage user data
    const updatedUser = await db.select().from(user).where(eq(user.id, decoded.userId));

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        role: updatedUser[0].role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
