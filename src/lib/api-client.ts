export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string = "UNKNOWN",
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: string
  code?: string
  details?: Record<string, unknown>
}

const RETRY_STATUSES = new Set([0, 408, 429, 500, 502, 503, 504])
const MAX_RETRIES = 2

async function parseResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json()
  if (!json.success) {
    throw new ApiError(
      json.error || "Unknown error",
      res.status,
      json.code || "UNKNOWN",
      json.details
    )
  }
  return json.data as T
}

function shouldRetry(status: number): boolean {
  return RETRY_STATUSES.has(status)
}

export const api = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          ...options,
        })
        if (!res.ok && shouldRetry(res.status) && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
          continue
        }
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new ApiError(
            json.error || `Request failed (${res.status})`,
            res.status,
            json.code
          )
        }
        return parseResponse<T>(res)
      } catch (err) {
        if (err instanceof ApiError) throw err
        lastError = err as Error
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }
    throw lastError || new Error("Request failed")
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new ApiError(
        json.error || `Request failed (${res.status})`,
        res.status,
        json.code
      )
    }
    return parseResponse<T>(res)
  },

  async put<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new ApiError(
        json.error || `Request failed (${res.status})`,
        res.status,
        json.code
      )
    }
    return parseResponse<T>(res)
  },

  async delete<T>(url: string): Promise<T> {
    const res = await fetch(url, { method: "DELETE" })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new ApiError(
        json.error || `Request failed (${res.status})`,
        res.status,
        json.code
      )
    }
    return parseResponse<T>(res)
  },
}
