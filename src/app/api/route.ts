
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const TABLE_USERS = 'nyx';
const TABLE_TRIALS = 'nyx_trials';

// Fallback handler for non-admin routes
export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const path = url.pathname.replace('/api', '');

    try {
        if (path === '/authenticate') {
            let username, password;
            const contentType = req.headers.get('content-type');

            if (contentType?.includes('application/x-www-form-urlencoded')) {
                const body = await req.text();
                const params = new URLSearchParams(body);
                username = params.get('username');
                password = params.get('password');
            } else { // Default to JSON
                const body = await req.json();
                username = body.username;
                password = body.password;
            }

            if (!username || !password) {
                 return NextResponse.json({ status: 'error', code: 'INVALID_CREDENTIALS', message: 'Username and password are required' }, { status: 400 });
            }

            const sb = await getSupabase();
            const { data, error } = await sb.from(TABLE_USERS).select('*').eq('users', username).limit(1).maybeSingle();
            
            if (error) throw error;

            if (!data || data.pass !== password) {
                return NextResponse.json({ status: 'error', code: 'INVALID_CREDENTIALS', message: 'Invalid credentials or expired subscription' }, { status: 401 });
            }

            const expiresAt = new Date(data.expires_at);
            if (!data.expires_at || expiresAt < new Date()) {
                return NextResponse.json({ status: 'error', code: 'EXPIRED', message: 'Invalid credentials or expired subscription' }, { status: 401 });
            }

            return NextResponse.json({ status: 'success', username: data.users, expires_at: data.expires_at });
        }

        if (path === '/trial/start') {
            const { hwid } = await req.json();
            if (!hwid) return NextResponse.json({ status: 'error', code: 'TRIAL_UNAVAILABLE', message: 'Missing hwid' }, { status: 400 });
            
            const sb = await getSupabase();
            const { data, error } = await sb.from(TABLE_TRIALS).select('hwid').eq('hwid', hwid).limit(1).maybeSingle();
            
            if (error) throw error;
            if (data) return NextResponse.json({ status: 'error', code: 'TRIAL_UNAVAILABLE', message: 'Trial not available for this device' }, { status: 429 });

            const trialSeconds = 300;
            const expiresAt = Date.now() + trialSeconds * 1000;
            const expiresAtISO = new Date(expiresAt).toISOString();

            const { error: insError } = await sb.from(TABLE_TRIALS).insert({ hwid, expires_at: expiresAtISO });
            
            if (insError) throw insError;
            
            return NextResponse.json({ status: 'success', trial_seconds: trialSeconds, expires_at: expiresAtISO });
        }

        return NextResponse.json({ status: 'error', message: `Not Found: ${path}` }, { status: 404 });
    } catch (e: any) {
        return NextResponse.json({ status: 'error', message: e?.message || 'Server error' }, { status: 500 });
    }
}
