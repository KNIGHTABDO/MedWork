import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { chime } from '../audio/chime'

/* ticking clock — updates once per second */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

/* remaining seconds for the running timer, and phase transitions */
export function useTimerTick() {
  const phase = useStore((s) => s.phase)
  const endsAt = useStore((s) => s.endsAt)
  const pausedRemaining = useStore((s) => s.pausedRemaining)
  const [remaining, setRemaining] = useState(0)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    const compute = () => {
      if (pausedRemaining != null) return pausedRemaining
      if (!endsAt) return 0
      return Math.max(0, Math.round((endsAt - Date.now()) / 1000))
    }
    setRemaining(compute())
    if (phase === 'idle' || pausedRemaining != null) return

    const t = setInterval(() => {
      const r = compute()
      setRemaining(r)
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true
        const st = useStore.getState()
        if (st.phase === 'focus') {
          st.finishFocus()
          chime('done')
          st.startBreak()
          window.dispatchEvent(new CustomEvent('medwork:focus-done'))
        } else if (st.phase === 'break') {
          chime('break')
          st.stopTimer()
          window.dispatchEvent(new CustomEvent('medwork:break-done'))
        }
      }
    }, 250)
    return () => clearInterval(t)
  }, [phase, endsAt, pausedRemaining])

  return remaining
}

/* keep the iPad awake while a session runs */
export function useWakeLock() {
  const phase = useStore((s) => s.phase)
  useEffect(() => {
    if (phase === 'idle' || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let released = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (released) void lock.release()
      } catch {
        /* wake lock unavailable (low battery etc.) — fine */
      }
    }
    void acquire()
    const onVis = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release().catch(() => {})
    }
  }, [phase])
}
