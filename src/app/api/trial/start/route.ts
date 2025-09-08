
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const TABLE_TRIALS = 'nyx_trials';

export async function POST(req: NextRequest) {
    try {
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

    } catch (e: any) {
        console.error(`API Error in /api/trial/start:`, e.message);
        return NextResponse.json({ status: 'error', message: e?.message || 'Server error' }, { status: 500 });
    }
}
