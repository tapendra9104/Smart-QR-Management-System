import { getBackendBaseUrl } from "@/lib/api/http";

export async function POST(request) {
    const body = await request.json();
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return Response.json(data, { status: response.status });
}
