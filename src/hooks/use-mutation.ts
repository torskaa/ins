"use client"

import { useState, useCallback, useRef } from "react"
import { api, ApiError } from "@/lib/api-client"

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (err: ApiError) => void
}

interface UseMutationResult<T, R> {
  mutate: (body?: T) => Promise<R | undefined>
  loading: boolean
  error: string | null
  reset: () => void
}

export function useMutation<T, R = void>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  options?: UseMutationOptions<R>
): UseMutationResult<T, R> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const mutate = useCallback(async (body?: T): Promise<R | undefined> => {
    setLoading(true)
    setError(null)

    try {
      let result: R
      switch (method) {
        case "POST":
          result = await api.post<R>(url, body)
          break
        case "PUT":
          result = await api.put<R>(url, body)
          break
        case "DELETE":
          result = await api.delete<R>(url)
          break
      }
      if (mountedRef.current) {
        setLoading(false)
        options?.onSuccess?.(result!)
      }
      return result!
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof ApiError ? err.message : "Operation failed"
        setError(message)
        setLoading(false)
        if (err instanceof ApiError) options?.onError?.(err)
      }
      return undefined
    }
  }, [url, method, options?.onSuccess, options?.onError])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return { mutate, loading, error, reset }
}
