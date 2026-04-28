import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { getBackendBaseUrl, parseApiResponse } from "@/lib/api/http";

function normalizeForwardedFor(headerValue) {
    if (!headerValue) {
        return "";
    }

    const candidate = headerValue.split(",")[0].trim();
    if (!candidate) {
        return "";
    }

    const bracketedMatch = candidate.match(/^\[([^\]]+)\](?::\d+)?$/);
    if (bracketedMatch && isIP(bracketedMatch[1])) {
        return bracketedMatch[1];
    }

    const ipv6LoopbackWithPort = candidate.match(/^(::1):\d+$/);
    if (ipv6LoopbackWithPort) {
        return ipv6LoopbackWithPort[1];
    }

    const lastColonIndex = candidate.lastIndexOf(":");
    if (lastColonIndex > -1) {
        const possibleIp = candidate.slice(0, lastColonIndex);
        const possiblePort = candidate.slice(lastColonIndex + 1);
        if (/^\d+$/.test(possiblePort) && isIP(possibleIp)) {
            return possibleIp;
        }
    }

    if (isIP(candidate)) {
        return candidate;
    }

    return "";
}

async function resolveRedirect(request, { params }) {
    const { code } = await params;
    const headers = new Headers({
        "User-Agent": request.headers.get("user-agent") || "",
        "Referer": request.headers.get("referer") || "",
        "X-Vercel-IP-Country": request.headers.get("x-vercel-ip-country") || "",
        "X-Vercel-IP-City": request.headers.get("x-vercel-ip-city") || "",
        "X-Original-Method": request.method,
        "Purpose": request.headers.get("purpose") || request.headers.get("x-purpose") || "",
        "Sec-Purpose": request.headers.get("sec-purpose") || "",
        "X-Moz": request.headers.get("x-moz") || "",
        "Next-Router-Prefetch": request.headers.get("next-router-prefetch") || "",
        "X-Nextjs-Prefetch": request.headers.get("x-nextjs-prefetch") || "",
    });
    const forwardedFor = normalizeForwardedFor(request.headers.get("x-forwarded-for"));
    if (forwardedFor) {
        headers.set("X-Forwarded-For", forwardedFor);
    }

    try {
        const response = await fetch(`${getBackendBaseUrl()}/api/v1/public/qr/${code}/resolve${request.nextUrl.search}`, {
            headers,
            cache: "no-store",
        });
        if (!response.ok) {
            return new NextResponse(resolveErrorMessage(response.status), {
                status: response.status,
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Cache-Control": "no-store",
                },
            });
        }
        const payload = await parseApiResponse(response);
        return NextResponse.redirect(payload.redirect_url);
    } catch {
        return new NextResponse("QR service is temporarily unavailable", {
            status: 502,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-store",
            },
        });
    }
}

function resolveErrorMessage(status) {
    if (status === 400) {
        return "QR code link is invalid";
    }
    if (status === 404) {
        return "QR code not found";
    }
    if (status === 410) {
        return "QR code is no longer available";
    }
    return "Unable to resolve QR code";
}

export async function GET(request, context) {
    return resolveRedirect(request, context);
}

export async function HEAD(request, context) {
    return resolveRedirect(request, context);
}
