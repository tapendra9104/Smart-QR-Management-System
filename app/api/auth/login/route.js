import { NextResponse } from "next/server";
import { getBackendBaseUrl, parseApiResponse } from "@/lib/api/http";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
export async function POST(request) {
    const body = await request.text();
    const backendResponse = await fetch(`${getBackendBaseUrl()}/api/v1/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
    if (!backendResponse.ok) {
        const response = new NextResponse(await backendResponse.text(), {
            status: backendResponse.status,
            headers: {
                "Content-Type": backendResponse.headers.get("content-type") || "application/json",
            },
        });
        clearAuthCookies(response);
        return response;
    }
    const payload = await parseApiResponse(backendResponse);
    const response = NextResponse.json({ user: payload.user });
    setAuthCookies(response, payload.access_token, payload.refresh_token);
    return response;
}
