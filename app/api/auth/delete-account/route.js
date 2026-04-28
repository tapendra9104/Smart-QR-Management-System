import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/http";
import { ACCESS_TOKEN_COOKIE, clearAuthCookies } from "@/lib/auth/session";

export async function DELETE(request) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/auth/account`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });

    if (response.ok) {
        const res = new NextResponse(null, { status: 204 });
        clearAuthCookies(res);
        return res;
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
}
