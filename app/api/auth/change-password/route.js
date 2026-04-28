import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendBaseUrl } from "@/lib/api/http";
import { ACCESS_TOKEN_COOKIE, clearAuthCookies } from "@/lib/auth/session";

export async function PUT(request) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.text();
    const backendResponse = await fetch(`${getBackendBaseUrl()}/api/v1/auth/change-password`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body,
    });

    if (!backendResponse.ok) {
        const contentType = backendResponse.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
            ? await backendResponse.json()
            : await backendResponse.text();

        const message =
            typeof payload === "object" && payload?.message
                ? payload.message
                : typeof payload === "string"
                    ? payload
                    : "Failed to change password";

        return NextResponse.json({ message }, { status: backendResponse.status });
    }

    // Clear auth cookies since all sessions are revoked after password change
    const response = NextResponse.json({ message: "Password changed successfully. Please log in again." });
    clearAuthCookies(response);
    return response;
}
