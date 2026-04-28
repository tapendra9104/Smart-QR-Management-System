import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendBaseUrl, parseApiResponse } from "@/lib/api/http";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";

export async function PUT(request) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.text();
    const backendResponse = await fetch(`${getBackendBaseUrl()}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
    return NextResponse.json(payload);
}
