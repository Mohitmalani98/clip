
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { isValidAdminToken } from '@/lib/adminAuth';

const TABLE_TRIALS = 'nyx_trials';

export async function GET(req: NextRequest) {
    if (!isValidAdminToken(req)) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
    }
    try {
        const sb = await getSupabase();
        const { data, error } = await sb.from(TABLE_TRIALS).select('*').order('expires_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ status: 'success', trials: data });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
