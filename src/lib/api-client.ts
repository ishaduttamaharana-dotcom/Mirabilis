/**
 * Thin fetch wrapper around the FastAPI backend.
 *
 * - Base URL comes from VITE_API_BASE_URL (defaults to the local dev API).
 * - The refresh token lives in an httpOnly cookie set by the backend — this
 *   client never touches it directly. The short-lived access token is kept
 *   in memory only (see auth-store.ts), never localStorage, so a reload
 *   always re-derives it from a `/auth/refresh` call using the cookie.
 * - Every backend response is the `{ data }` / `{ data, meta }` /
 *   `{ error }` envelope described in techspec.md — this unwraps it and
 *   throws ApiClientError on the error shape so callers can just `await`.
 */

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env["VITE_API_BASE_URL"];
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    // If VITE_API_BASE_URL points to localhost/127.0.0.1 in production,
    // fallback to relative /api/v1 so production deployment uses same-origin routes.
    if (
      import.meta.env.PROD &&
      (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))
    ) {
      return "/api/v1";
    }
    return envUrl;
  }
  // In development, default to http://localhost:8000/api/v1; in production, use relative /api/v1
  return import.meta.env.DEV ? "http://localhost:8000/api/v1" : "/api/v1";
}

const API_BASE_URL = resolveApiBaseUrl();

export class ApiClientError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  details?: Record<string, any>;
  retryAfter?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    details?: Record<string, any>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    if (fields !== undefined) this.fields = fields;
    if (details !== undefined) {
      this.details = details;
      if (typeof details["retryAfter"] === "number") {
        this.retryAfter = details["retryAfter"];
      }
    }
  }
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function tryRefresh(): Promise<boolean> {
  // Coalesce concurrent 401s into a single refresh call.
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAccessToken(null);
        return false;
      }
      const body = await res.json();
      const token = body?.data?.accessToken;
      if (typeof token === "string" && token.trim() !== "") {
        setAccessToken(token);
        return true;
      }
      setAccessToken(null);
      return false;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  isFormData?: boolean;
  skipAuthRetry?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData, skipAuthRetry } = options;

  const isAuthRoute = path.startsWith("/auth/");
  const isPublicRoute = path.startsWith("/public/");

  // Auto-refresh access token if null in memory before calling protected endpoints
  if (!accessToken && !isAuthRoute && !isPublicRoute && !skipAuthRetry) {
    await tryRefresh();
  }

  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";

  if (path.includes("upload")) {
    console.log("[MEDIA UPLOAD DEBUG]", {
      method,
      endpoint: `${API_BASE_URL}${path}`,
      accessTokenPresent: Boolean(accessToken),
    });
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    ...(body !== undefined ? { body: isFormData ? (body as FormData) : JSON.stringify(body) } : {}),
  });

  if (res.status === 401 && !skipAuthRetry && !isAuthRoute) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, skipAuthRetry: true });
    }
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const err = payload?.error ?? {};
    const message =
      err.message ||
      payload?.detail ||
      (res.status === 401 ? "Session expired. Please log in again." : "Something went wrong");

    const errorDetails = {
      method,
      endpoint: `${API_BASE_URL}${path}`,
      status: res.status,
      response: payload,
    };
    console.error(`[API ERROR] ${method} ${path} (${res.status}):`, errorDetails);

    throw new ApiClientError(
      res.status,
      err.code ?? (res.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR"),
      message,
      err.fields,
      err.details || errorDetails,
    );
  }

  return (payload?.data ?? payload) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: "GET", ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
  postForm: <T>(path: string, form: FormData, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body: form, isFormData: true, ...options }),
};

export function paginatedQuery<T>(
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return api.get<Paginated<T>>(`${path}${query ? `?${query}` : ""}`);
}

export function getMediaUrl(url?: string): string {
  if (!url) return "/placeholder.svg";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  if (
    url.startsWith("/placeholder") ||
    url.startsWith("placeholder") ||
    url.startsWith("/src/") ||
    url.startsWith("/assets/")
  ) {
    return url.startsWith("/") ? url : `/${url}`;
  }
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}
