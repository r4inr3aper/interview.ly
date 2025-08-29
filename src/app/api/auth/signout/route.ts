import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the session cookie with proper options
    cookieStore.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error during sign out:', error);
    return NextResponse.json(
      { error: 'Failed to sign out', success: false },
      { status: 500 }
    );
  }
}