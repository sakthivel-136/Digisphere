/**
 * lib/useVisibilityPolling.ts
 *
 * A polling hook that:
 *  - Calls `callback` every `intervalMs` milliseconds
 *  - Automatically PAUSES when the browser tab is hidden (user switches tabs / minimises)
 *  - Immediately fires one refresh when the tab becomes visible again
 *  - Completely stops when `enabled` is false (e.g. user not authenticated yet)
 *
 * Usage:
 *   useVisibilityPolling(myFetchFn, 30_000, authorized && !!selectedFactory)
 */

import { useEffect, useRef } from 'react'

export function useVisibilityPolling(
  callback: () => void,
  intervalMs: number,
  enabled: boolean
) {
  // Always use the latest version of callback without restarting the interval
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (timer) return // already running
      timer = setInterval(() => cbRef.current(), intervalMs)
    }

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cbRef.current() // fire immediately when user returns
        start()
      } else {
        stop() // pause while hidden — zero requests
      }
    }

    // Start if tab is already visible
    if (document.visibilityState === 'visible') start()

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [intervalMs, enabled])
}
