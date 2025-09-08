
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { addAdminToken, isValidAdminToken } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminUser || !adminPass) {
      console.error("Admin credentials not set in .env file");
      return NextResponse.json({ status: 'error', message: 'Admin credentials are not configured on the server.' }, { status: 500 });
    }

    if (username === adminUser && password === adminPass) {
      const token = crypto.randomBytes(32).toString('hex');
      addAdminToken(token);
      return NextResponse.json({ status: 'success', token });
    }
    
    return NextResponse.json({ status: 'error', message: 'Invalid admin credentials' }, { status: 401 });

  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e?.message || 'Server error' }, { status: 500 });
  }
}
