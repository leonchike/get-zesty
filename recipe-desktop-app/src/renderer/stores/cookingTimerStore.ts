import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CookingTimer {
  id: string
  recipeId: string
  recipeName: string
  stepIndex: number
  label: string
  totalSeconds: number
  remainingSeconds: number
  status: 'idle' | 'running' | 'paused' | 'completed'
  createdAt: number
  lastTickAt: number
}

interface CookingTimerState {
  timers: Record<string, CookingTimer>

  startTimer: (timer: Omit<CookingTimer, 'status' | 'remainingSeconds' | 'createdAt' | 'lastTickAt'>) => void
  pauseTimer: (id: string) => void
  resetTimer: (id: string) => void
  removeTimer: (id: string) => void
  tick: () => string[] // returns IDs of newly completed timers
  getTimer: (id: string) => CookingTimer | undefined
  getActiveTimers: () => CookingTimer[]
}

const DAY_MS = 24 * 60 * 60 * 1000

export const useCookingTimerStore = create<CookingTimerState>()(
  persist(
    (set, get) => ({
      timers: {},

      startTimer: (input) => {
        set((state) => {
          const existing = state.timers[input.id]
          const now = Date.now()

          if (existing) {
            // Resume from paused/idle/completed
            if (existing.status === 'running') return state
            return {
              timers: {
                ...state.timers,
                [input.id]: {
                  ...existing,
                  status: 'running' as const,
                  remainingSeconds:
                    existing.status === 'completed' ? existing.totalSeconds : existing.remainingSeconds,
                  lastTickAt: now
                }
              }
            }
          }

          // New timer
          return {
            timers: {
              ...state.timers,
              [input.id]: {
                ...input,
                status: 'running' as const,
                remainingSeconds: input.totalSeconds,
                createdAt: now,
                lastTickAt: now
              }
            }
          }
        })
      },

      pauseTimer: (id) => {
        set((state) => {
          const timer = state.timers[id]
          if (!timer || timer.status !== 'running') return state
          return {
            timers: {
              ...state.timers,
              [id]: { ...timer, status: 'paused' as const }
            }
          }
        })
      },

      resetTimer: (id) => {
        set((state) => {
          const timer = state.timers[id]
          if (!timer) return state
          return {
            timers: {
              ...state.timers,
              [id]: {
                ...timer,
                status: 'idle' as const,
                remainingSeconds: timer.totalSeconds,
                lastTickAt: Date.now()
              }
            }
          }
        })
      },

      removeTimer: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.timers
          return { timers: rest }
        })
      },

      tick: () => {
        const completedIds: string[] = []
        set((state) => {
          const now = Date.now()
          const updated = { ...state.timers }
          let changed = false

          for (const [id, timer] of Object.entries(updated)) {
            if (timer.status !== 'running') continue
            changed = true
            const remaining = timer.remainingSeconds - 1
            if (remaining <= 0) {
              updated[id] = { ...timer, remainingSeconds: 0, status: 'completed', lastTickAt: now }
              completedIds.push(id)
            } else {
              updated[id] = { ...timer, remainingSeconds: remaining, lastTickAt: now }
            }
          }

          return changed ? { timers: updated } : state
        })
        return completedIds
      },

      getTimer: (id) => get().timers[id],

      getActiveTimers: () =>
        Object.values(get().timers).filter(
          (t) => t.status === 'running' || t.status === 'paused' || t.status === 'completed'
        )
    }),
    {
      name: 'cooking-timers-v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const now = Date.now()
        const updated: Record<string, CookingTimer> = {}

        for (const [id, timer] of Object.entries(state.timers)) {
          // Prune completed timers older than 24h
          if (timer.status === 'completed' && now - timer.createdAt > DAY_MS) {
            continue
          }

          // Drift-correct running timers
          if (timer.status === 'running' && timer.lastTickAt) {
            const elapsed = Math.floor((now - timer.lastTickAt) / 1000)
            const remaining = timer.remainingSeconds - elapsed
            if (remaining <= 0) {
              updated[id] = { ...timer, remainingSeconds: 0, status: 'completed', lastTickAt: now }
            } else {
              updated[id] = { ...timer, remainingSeconds: remaining, lastTickAt: now }
            }
          } else {
            updated[id] = timer
          }
        }

        state.timers = updated
      }
    }
  )
)
