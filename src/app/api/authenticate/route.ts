
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const TABLE_USERS = 'nyx';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const params = new URLSearchParams(body);
        const username = params.get('username')?.trim();
        const password = params.get('password')?.trim();

        if (!username || !password) {
             return NextResponse.json({ status: 'error', code: 'INVALID_CREDENTIALS', message: 'Username and password are required' }, { status: 400 });
        }

        const sb = await getSupabase();
        const { data, error } = await sb.from(TABLE_USERS).select('*').eq('users', username).limit(1).maybeSingle();
        
        if (error) {
            console.error('Supabase query error:', error.message);
            throw error;
        }

        if (!data || data.pass !== password) {
            return NextResponse.json({ status: 'error', code: 'INVALID_CREDENTIALS', message: 'Invalid credentials or expired subscription' }, { status: 401 });
        }

        if (!data.expires_at) {
             return NextResponse.json({ status: 'error', code: 'EXPIRED', message: 'Invalid credentials or expired subscription' }, { status: 401 });
        }
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json({ status: 'error', code: 'EXPIRED', message: 'Invalid credentials or expired subscription' }, { status: 401 });
        }

        return NextResponse.json({ status: 'success', username: data.users, expires_at: data.expires_at });

    } catch (e: any) {
        console.error(`API Error in /api/authenticate:`, e.message);
        return NextResponse.json({ status: 'error', message: e?.message || 'Server error' }, { status: 500 });
    }
}
