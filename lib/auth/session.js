export const ACCESS_TOKEN_COOKIE = "seq_access_token";
export const REFRESH_TOKEN_COOKIE = "seq_refresh_token";
const isProduction = process.env.NODE_ENV === "production";
export function cookieOptions(maxAgeSeconds) {
    return {
        httpOnly: true,
        sameSite: "strict",
        secure: isProduction,
        path: "/",
        maxAge: maxAgeSeconds,
    };
}
export function setAuthCookies(response, accessToken, refreshToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(60 * 60 * 24));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(60 * 60 * 24 * 7));
}
export function clearAuthCookies(response) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", cookieOptions(0));
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", cookieOptions(0));
}
