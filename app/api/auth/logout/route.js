import { NextResponse } from "next/server";
import { clearAuthCookies, REFRESH_TOKEN_COOKIE } from "@/lib/auth/session";
import { getBackendBaseUrl } from "@/lib/api/http";
export async function POST(request) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
        await fetch(`${getBackendBaseUrl()}/api/v1/auth/logout`, {
            method: "POST",
            headers: {
                "X-Refresh-Token": refreshToken,
            },
        });
    }
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
}
