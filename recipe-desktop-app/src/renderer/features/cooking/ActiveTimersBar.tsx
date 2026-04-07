import { useMemo } from 'react'
import { Play, Pause, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCookingTimerStore } from '@/stores/cookingTimerStore'
import { formatTimerDisplay } from '@/lib/parseTimeMentions'

const TEXT = '#EDE8E2'

export function ActiveTimersBar(): JSX.Element | null {
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
    <div className="flex-shrink-0 px-6 pb-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin py-1">
        <AnimatePresence>
          {timers.map((timer) => (
            <motion.div
              key={timer.id}
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 flex-shrink-0',
                timer.status === 'running' && 'bg-primary/20',
                timer.status === 'paused' && 'bg-amber-500/15',
                timer.status === 'completed' && 'bg-green-500/15'
              )}
            >
              {/* Play/Pause toggle */}
              <button
                onClick={() => {
                  if (timer.status === 'running') {
                    pauseTimer(timer.id)
                  } else {
                    startTimer(timer)
                  }
                }}
                className="p-1 rounded-full transition-colors hover:bg-white/10"
                style={{ color: `${TEXT}CC` }}
              >
                {timer.status === 'running' ? <Pause size={12} /> : <Play size={12} />}
              </button>

              {/* Timer info */}
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[10px] truncate max-w-[100px]"
                  style={{ color: `${TEXT}60` }}
                >
                  {timer.label}
                </span>
                <span
                  className={cn(
                    'text-sm font-mono font-bold tabular-nums',
                    timer.status === 'running' && 'text-primary',
                    timer.status === 'paused' && 'text-amber-400',
                    timer.status === 'completed' && 'text-green-400'
                  )}
                >
                  {timer.status === 'completed'
                    ? 'Done!'
                    : formatTimerDisplay(timer.remainingSeconds)}
                </span>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => removeTimer(timer.id)}
                className="p-1 rounded-full transition-colors hover:bg-white/10"
                style={{ color: `${TEXT}40` }}
              >
                <X size={10} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
