import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/http";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
const protectedPrefixes = ["/dashboard"];
const authPages = new Set(["/auth/login", "/auth/sign-up"]);

function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    return atob(padded);
}

function hasUsableAccessToken(accessToken) {
    if (!accessToken) {
        return false;
    }

    const segments = accessToken.split(".");
    if (segments.length < 2) {
        return false;
    }

    try {
        const payload = JSON.parse(decodeBase64Url(segments[1]));
        if (typeof payload.exp !== "number") {
            return false;
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        return payload.exp > nowSeconds + 30;
    } catch {
        return false;
    }
}

async function tryRefresh(request, response) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
        return false;
    }
    const refreshResponse = await fetch(`${getBackendBaseUrl()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!refreshResponse.ok) {
        return false;
    }
    const payload = (await refreshResponse.json());
    setAuthCookies(response, payload.access_token, payload.refresh_token);
    return true;
}
export async function proxy(request) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const response = NextResponse.next();
    let hasAccess = hasUsableAccessToken(accessToken);
    if (!hasAccess) {
        hasAccess = await tryRefresh(request, response);
    }
    if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) && !hasAccess) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/auth/login";
        const redirectResponse = NextResponse.redirect(loginUrl);
        clearAuthCookies(redirectResponse);
        return redirectResponse;
    }
    if (authPages.has(pathname) && hasAccess) {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = "/dashboard";
        return NextResponse.redirect(dashboardUrl);
    }
    return response;
}
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
