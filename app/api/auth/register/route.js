import { NextResponse } from "next/server";
import { getBackendBaseUrl, parseApiResponse } from "@/lib/api/http";
import { setAuthCookies } from "@/lib/auth/session";
export async function POST(request) {
    const body = await request.text();
    const backendResponse = await fetch(`${getBackendBaseUrl()}/api/v1/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
    if (!backendResponse.ok) {
        return new NextResponse(await backendResponse.text(), {
            status: backendResponse.status,
            headers: {
                "Content-Type": backendResponse.headers.get("content-type") || "application/json",
            },
        });
    }
    const payload = await parseApiResponse(backendResponse);
    const response = NextResponse.json({ user: payload.user });
    setAuthCookies(response, payload.access_token, payload.refresh_token);
    return response;
}
