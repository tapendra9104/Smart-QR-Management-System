import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/http";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
async function refreshTokens(refreshToken) {
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
        return null;
    }
    return response.json();
}
async function proxyRequest(request, path) {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    const targetUrl = `${getBackendBaseUrl()}/api/v1/${path.join("/")}${request.nextUrl.search}`;
    const requestBody = request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text();
    const performRequest = async (token) => {
        const headers = new Headers();
        headers.set("Accept", "application/json");
        const contentType = request.headers.get("content-type");
        if (contentType) {
            headers.set("Content-Type", contentType);
        }
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return fetch(targetUrl, {
            method: request.method,
            headers,
            body: requestBody,
            cache: "no-store",
        });
    };

    try {
        let response = await performRequest(accessToken);
        if (response.status === 401 && refreshToken) {
            const refreshed = await refreshTokens(refreshToken);
            if (refreshed) {
                accessToken = refreshed.access_token;
                response = await performRequest(accessToken);
                const proxied = await buildResponse(response);
                setAuthCookies(proxied, refreshed.access_token, refreshed.refresh_token);
                return proxied;
            }
        }
        const proxied = await buildResponse(response);
        if (response.status === 401) {
            clearAuthCookies(proxied);
        }
        return proxied;
    } catch {
        return NextResponse.json({
            message: "Backend service is unavailable. Please try again in a moment.",
        }, {
            status: 502,
        });
    }
}
async function buildResponse(response) {
    if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    const payload = await response.arrayBuffer();
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");
    const cacheControl = response.headers.get("cache-control");

    if (contentType) {
        headers.set("Content-Type", contentType);
    }
    if (contentDisposition) {
        headers.set("Content-Disposition", contentDisposition);
    }
    if (cacheControl) {
        headers.set("Cache-Control", cacheControl);
    }

    return new NextResponse(payload, {
        status: response.status,
        headers,
    });
}
export async function GET(request, context) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}
export async function POST(request, context) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}
export async function PUT(request, context) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}
export async function DELETE(request, context) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}
export async function PATCH(request, context) {
    const { path } = await context.params;
    return proxyRequest(request, path);
}
