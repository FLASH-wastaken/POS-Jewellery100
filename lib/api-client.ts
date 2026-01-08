/**
 * Client-side API helper for authenticated requests
 */

interface ApiRequestOptions extends RequestInit {
  isFormData?: boolean
}

async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<{ data?: T; error?: string }> {
  try {
    const url = `${endpoint.startsWith("/") ? "" : "/api/"}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": options.isFormData ? "multipart/form-data" : "application/json",
        ...options.headers,
      },
    })

    // Handle token refresh on 401
    if (response.status === 401) {
      const refreshResponse = await fetch("/api/auth/refresh", { method: "POST" })
      if (refreshResponse.ok) {
        // Retry original request
        return apiRequest(endpoint, options)
      }
      // Redirect to login if refresh fails
      window.location.href = "/auth/login"
      return { error: "Session expired" }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || "Request failed" }
    }

    const data = await response.json()
    return { data: data as T }
  } catch (error) {
    console.error("[v0] API request error:", error)
    return { error: error instanceof Error ? error.message : "An error occurred" }
  }
}

export async function apiGet<T>(endpoint: string) {
  return apiRequest<T>(endpoint, { method: "GET" })
}

export async function apiPost<T>(endpoint: string, body?: unknown) {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiPut<T>(endpoint: string, body?: unknown) {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiDelete<T>(endpoint: string) {
  return apiRequest<T>(endpoint, { method: "DELETE" })
}

export async function apiPostFormData<T>(endpoint: string, formData: FormData) {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: formData,
    isFormData: true,
    headers: {}, // Let browser set Content-Type with boundary
  })
}
