
import { NextRequest } from "next/server";

// In-memory store for generated admin tokens
const validAdminTokens = new Set<string>();

export function addAdminToken(token: string) {
    validAdminTokens.add(token);
    // 8-hour expiry
    setTimeout(() => validAdminTokens.delete(token), 8 * 3600 * 1000); 
}

export function isValidAdminToken(req: NextRequest): boolean {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    const token = authHeader.split(' ')[1];
    return validAdminTokens.has(token);
}
