import { useEffect, useRef, useState } from 'react'

interface UseIdleTimerProps {
  timeout: number // timeout in milliseconds
  onIdle: () => void // callback when user becomes idle
  onActive?: () => void // optional callback when user becomes active
  warningTime?: number // time before timeout to show warning (in milliseconds)
  onWarning?: () => void // callback when warning should be shown
}

/**
 * Custom hook to track user idle time and trigger callbacks
 * Monitors mouse movements, clicks, keyboard input, touch events, and scrolling
 */
export const useIdleTimer = ({
  timeout,
  onIdle,
  onActive,
  warningTime,
  onWarning
}: UseIdleTimerProps) => {
  const [isIdle, setIsIdle] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const timeoutId = useRef<number | null>(null)
  const warningTimeoutId = useRef<number | null>(null)
  const lastActivityTime = useRef<number>(Date.now())

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutId.current) {
      clearTimeout(timeoutId.current)
    }
    if (warningTimeoutId.current) {
      clearTimeout(warningTimeoutId.current)
    }

    // Update last activity time
    lastActivityTime.current = Date.now()

    // Reset states
    if (isIdle) {
      setIsIdle(false)
      onActive?.()
    }
    if (showWarning) {
      setShowWarning(false)
    }

    // Set warning timer if warningTime is provided
    if (warningTime && onWarning) {
      warningTimeoutId.current = setTimeout(() => {
        setShowWarning(true)
        onWarning()
      }, timeout - warningTime)
    }

    // Set idle timeout
    timeoutId.current = setTimeout(() => {
      setIsIdle(true)
      onIdle()
    }, timeout)
  }

  useEffect(() => {
    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ]

    // Throttle function to prevent too many resets
    let throttleTimeout: number | null = null
    const throttledResetTimer = () => {
      if (!throttleTimeout) {
        resetTimer()
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null
        }, 1000) // Throttle to once per second
      }
    }

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledResetTimer, { passive: true })
    })

    // Start initial timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledResetTimer)
      })
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      if (warningTimeoutId.current) {
        clearTimeout(warningTimeoutId.current)
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [timeout, warningTime]) // Re-run if timeout or warningTime changes

  return {
    isIdle,
    showWarning,
    resetTimer,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityTime.current
      return Math.max(0, timeout - elapsed)
    }
  }
}
