"use client";
import { ApiClientError, parseApiResponse } from "@/lib/api/http";
export async function clientApi(path, init = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
        headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`/api/proxy${path}`, {
        ...init,
        headers,
        credentials: "same-origin",
    });
    return parseApiResponse(response);
}
export async function clientApiJson(path, method, body) {
    return clientApi(path, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}
export { ApiClientError };
