
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { isValidAdminToken } from '@/lib/adminAuth';

const TABLE_USERS = 'nyx';

// Get all users
export async function GET(req: NextRequest) {
    if (!isValidAdminToken(req)) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
    }
    try {
        const sb = await getSupabase();
        const { data, error } = await sb.from(TABLE_USERS).select('users, pass, expires_at').order('users');
        if (error) throw error;

        const users = data.map((user: { users: string, pass: string, expires_at: string | null }) => ({
            users: user.users,
            pass: user.pass,
            expires_at: user.expires_at ? user.expires_at : 'N/A'
        }));

        return NextResponse.json({ status: 'success', users });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// Create a new user
export async function POST(req: NextRequest) {
    if (!isValidAdminToken(req)) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { username, password, expiresAt } = body;

        if (!username || !password || !expiresAt) {
            return NextResponse.json({ status: 'error', message: 'Username, password, and expiry are required' }, { status: 400 });
        }

        const sb = await getSupabase();

        const expiryDate = new Date(expiresAt).toISOString().split('T')[0];

        const { error } = await sb.from(TABLE_USERS).insert({ 
            users: username, 
            pass: password, 
            expires_at: expiryDate 
        });
        
        if (error) {
            if (error.code === '23505') { // Postgres unique violation error code
                 return NextResponse.json({ status: 'error', message: `User '${username}' already exists.` }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ status: 'success' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// Update a user's expiry
export async function PUT(req: NextRequest) {
    if (!isValidAdminToken(req)) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
    }
    try {
        const { username, extension } = await req.json();
        if (!username || !extension) {
            return NextResponse.json({ status: 'error', message: 'Username and extension details are required' }, { status: 400 });
        }
        
        const sb = await getSupabase();

        const { data: userData, error: userError } = await sb.from(TABLE_USERS)
            .select('expires_at')
            .eq('users', username)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const currentExpiry = userData.expires_at ? new Date(userData.expires_at) : now;
        // If subscription is already expired, extend from now. Otherwise, extend from current expiry date.
        const baseDate = currentExpiry < now ? now : currentExpiry;

        switch (extension.type) {
            case "days":
                baseDate.setDate(baseDate.getDate() + extension.value);
                break;
            case "weeks":
                baseDate.setDate(baseDate.getDate() + extension.value * 7);
                break;
            case "months":
                baseDate.setMonth(baseDate.getMonth() + extension.value);
                break;
        }

        const newExpiryDate = baseDate.toISOString().split('T')[0];

        const { error: updateError } = await sb.from(TABLE_USERS)
            .update({ expires_at: newExpiryDate })
            .eq('users', username);

        if (updateError) throw updateError;

        return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}


// Delete a user
export async function DELETE(req: NextRequest) {
    if (!isValidAdminToken(req)) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { username } = body;
        
        if (!username) {
            return NextResponse.json({ status: 'error', message: 'Username required' }, { status: 400 });
        }

        const sb = await getSupabase();
        
        const { error } = await sb.from(TABLE_USERS).delete().eq('users', username);
        
        if (error) {
            throw error;
        }
        
        return NextResponse.json({ status: 'success' }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message || 'An unknown server error occurred.' }, { status: 500 });
    }
}
