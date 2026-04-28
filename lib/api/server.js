import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/session";
import { ApiClientError, getBackendBaseUrl, parseApiResponse } from "@/lib/api/http";

/**
 * Check if an error is a network/connection error (backend unreachable).
 */
function isNetworkError(error) {
    if (error?.code === "ECONNREFUSED" || error?.cause?.code === "ECONNREFUSED") {
        return true;
    }
    if (error instanceof TypeError && error.message === "fetch failed") {
        return true;
    }
    if (error?.name === "AbortError") {
        return true;
    }
    // AggregateError wrapping connection errors
    if (error instanceof AggregateError || error?.cause instanceof AggregateError) {
        return true;
    }
    return false;
}

async function refreshAccessToken(refreshToken) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const response = await fetch(`${getBackendBaseUrl()}/api/v1/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
            cache: "no-store",
            signal: controller.signal,
        });
        if (!response.ok) {
            return null;
        }
        return parseApiResponse(response);
    } catch (error) {
        // If the backend is unreachable, treat as failed refresh
        if (isNetworkError(error)) {
            return null;
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

export async function serverApi(path, init = {}) {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!accessToken && refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        accessToken = refreshed?.access_token;
    }

    if (!accessToken) {
        redirect("/auth/login");
    }

    const performRequest = async (token) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
            const headers = new Headers(init.headers);
            headers.set("Authorization", `Bearer ${token}`);
            return await fetch(`${getBackendBaseUrl()}${path}`, {
                ...init,
                headers,
                cache: "no-store",
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }
    };

    let response;
    try {
        response = await performRequest(accessToken);
    } catch (error) {
        // Backend unreachable — redirect to login
        if (isNetworkError(error)) {
            redirect("/auth/login");
        }
        throw error;
    }

    if (response.status === 401 && refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed?.access_token) {
            try {
                response = await performRequest(refreshed.access_token);
            } catch (error) {
                if (isNetworkError(error)) {
                    redirect("/auth/login");
                }
                throw error;
            }
        }
    }

    if (response.status === 401) {
        redirect("/auth/login");
    }
    return parseApiResponse(response);
}
export async function getCurrentUser() {
    return serverApi("/api/v1/auth/me");
}
export async function requireUser() {
    try {
        return await getCurrentUser();
    }
    catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
            redirect("/auth/login");
        }
        // Network errors (backend down) — redirect to login
        if (isNetworkError(error)) {
            redirect("/auth/login");
        }
        throw error;
    }
}

