export function getBackendBaseUrl() {
    return (process.env.BACKEND_API_URL || "http://localhost:8081").replace(/\/+$/, "");
}
export class ApiClientError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
    }
}
export async function parseApiResponse(response) {
    if (response.status === 204) {
        return undefined;
    }
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    if (!response.ok) {
        const message = typeof payload === "object" && payload && "message" in payload
            ? String(payload.message)
            : typeof payload === "string"
                ? payload
                : "Request failed";
        throw new ApiClientError(message, response.status);
    }
    return payload;
}
