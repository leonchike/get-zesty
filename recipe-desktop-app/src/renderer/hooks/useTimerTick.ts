import { useEffect, useRef } from 'react'
import { useCookingTimerStore } from '@/stores/cookingTimerStore'

function playCompletionChime(): void {
  try {
    const ctx = new AudioContext()

    // First tone: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 523.25
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)

    // Second tone: E5 (659.25 Hz), overlapping
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = 659.25
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.5)

    // Cleanup
    setTimeout(() => ctx.close(), 1000)
  } catch {
    // Silently fail if audio not available
  }
}

export function useTimerTick(): void {
  const tick = useCookingTimerStore((s) => s.tick)
  const getTimer = useCookingTimerStore((s) => s.getTimer)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const completedIds = tick()
      for (const id of completedIds) {
        const timer = getTimer(id)
        playCompletionChime()
        new Notification('Timer Done!', {
          body: timer ? `${timer.label} — ${timer.recipeName}` : 'Your timer has finished.'
        })
      }
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [tick, getTimer])

  // Drift correction on window focus
  useEffect(() => {
    const handler = (): void => {
      if (document.visibilityState !== 'visible') return
      const state = useCookingTimerStore.getState()
      const now = Date.now()

      for (const timer of Object.values(state.timers)) {
        if (timer.status !== 'running') continue
        const elapsed = Math.floor((now - timer.lastTickAt) / 1000)
        if (elapsed > 1) {
          const remaining = timer.remainingSeconds - elapsed
          if (remaining <= 0) {
            useCookingTimerStore.setState((s) => ({
              timers: {
                ...s.timers,
                [timer.id]: { ...timer, remainingSeconds: 0, status: 'completed', lastTickAt: now }
              }
            }))
            playCompletionChime()
            new Notification('Timer Done!', {
              body: `${timer.label} — ${timer.recipeName}`
            })
          } else {
            useCookingTimerStore.setState((s) => ({
              timers: {
                ...s.timers,
                [timer.id]: { ...timer, remainingSeconds: remaining, lastTickAt: now }
              }
            }))
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])
}

// Provider component to mount the tick globally
export function TimerTickProvider(): null {
  useTimerTick()
  return null
}
