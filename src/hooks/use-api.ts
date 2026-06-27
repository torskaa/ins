"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api, ApiError } from "@/lib/api-client"

interface UseApiOptions {
  enabled?: boolean
  onError?: (err: ApiError) => void
}

interface UseApiResult<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(
  url: string | null,
  options?: UseApiOptions
): UseApiResult<T> {
  const { enabled = true, onError } = options || {}
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(() => {
    if (!url || !enabled) {
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    api.get<T>(url, { signal: controller.signal })
      .then((result) => {
        if (mountedRef.current) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        if (mountedRef.current) {
          const message = err instanceof ApiError ? err.message : "Failed to load data"
          setError(message)
          setLoading(false)
          if (err instanceof ApiError) onError?.(err)
        }
      })
  }, [url, enabled, onError])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
