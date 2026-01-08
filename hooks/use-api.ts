"use client"

import { useState, useCallback } from "react"

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

export function useApi<T>(options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const request = useCallback(
    async (apiCall: Promise<{ data?: T; error?: string }>) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await apiCall
        if (result.error) {
          setError(result.error)
          options.onError?.(result.error)
          return null
        }

        setData(result.data || null)
        options.onSuccess?.(result.data!)
        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred"
        setError(errorMessage)
        options.onError?.(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [options],
  )

  return { data, error, isLoading, request }
}
