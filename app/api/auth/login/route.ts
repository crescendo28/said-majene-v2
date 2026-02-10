import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    // Use environment variable for password, fallback to a default for dev if missing
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === ADMIN_PASSWORD) {
      // Create response
      const response = NextResponse.json({ success: true }, { status: 200 });

      // Set cookie
      response.cookies.set('admin_session', 'true', {
        httpOnly: true, // Not accessible via client-side JS
        secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}