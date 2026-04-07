import { useMemo } from 'react'
import { Play, Pause, X, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCookingTimerStore } from '@/stores/cookingTimerStore'
import { formatTimerDisplay } from '@/lib/parseTimeMentions'

export function SidebarTimers(): JSX.Element | null {
  const timersMap = useCookingTimerStore((s) => s.timers)
  const startTimer = useCookingTimerStore((s) => s.startTimer)
  const pauseTimer = useCookingTimerStore((s) => s.pauseTimer)
  const removeTimer = useCookingTimerStore((s) => s.removeTimer)

  const timers = useMemo(
    () => Object.values(timersMap).filter((t) => t.status === 'running' || t.status === 'paused' || t.status === 'completed'),
    [timersMap]
  )

  if (timers.length === 0) return null

  return (
    <div className="px-3 py-2 border-t border-sidebar-border">
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Timer size={12} />
        Timers
      </div>
      <div className="space-y-1 mt-1">
        <AnimatePresence>
          {timers.map((timer) => (
            <motion.div
              key={timer.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, x: -20 }}
              className="group no-drag flex items-center gap-2 rounded-lg px-3 py-1.5"
            >
              {/* Play/Pause */}
              <button
                onClick={() => {
                  if (timer.status === 'running') {
                    pauseTimer(timer.id)
                  } else {
                    startTimer(timer)
                  }
                }}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 transition-colors',
                  timer.status === 'running' && 'bg-primary/20 text-primary',
                  timer.status === 'paused' && 'bg-amber-500/20 text-amber-500',
                  timer.status === 'completed' && 'bg-green-500/20 text-green-500'
                )}
              >
                {timer.status === 'running' ? <Pause size={10} /> : <Play size={10} />}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate text-sidebar-foreground">{timer.recipeName}</p>
                <p
                  className={cn(
                    'text-xs font-mono font-bold tabular-nums',
                    timer.status === 'running' && 'text-primary',
                    timer.status === 'paused' && 'text-amber-500',
                    timer.status === 'completed' && 'text-green-500'
                  )}
                >
                  {timer.status === 'completed'
                    ? 'Done!'
                    : formatTimerDisplay(timer.remainingSeconds)}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => removeTimer(timer.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
