import { useEffect, useRef } from 'react'
import { Play, Pause, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCookingTimerStore } from '@/stores/cookingTimerStore'
import { formatTimerDisplay } from '@/lib/parseTimeMentions'

interface TimerPillProps {
  timerId: string
  recipeId: string
  recipeName: string
  stepIndex: number
  label: string
  totalSeconds: number
  variant?: 'light' | 'dark'
}

export function TimerPill({
  timerId,
  recipeId,
  recipeName,
  stepIndex,
  label,
  totalSeconds,
  variant = 'dark'
}: TimerPillProps): JSX.Element {
  const timer = useCookingTimerStore((s) => s.timers[timerId])
  const startTimer = useCookingTimerStore((s) => s.startTimer)
  const pauseTimer = useCookingTimerStore((s) => s.pauseTimer)
  const resetTimer = useCookingTimerStore((s) => s.resetTimer)
  const autoResetRef = useRef<ReturnType<typeof setTimeout>>()

  const status = timer?.status ?? 'idle'
  const displaySeconds = status === 'idle' ? totalSeconds : (timer?.remainingSeconds ?? totalSeconds)

  // Auto-reset completed timers after 3s
  useEffect(() => {
    if (status === 'completed') {
      autoResetRef.current = setTimeout(() => {
        resetTimer(timerId)
      }, 3000)
      return () => clearTimeout(autoResetRef.current)
    }
  }, [status, timerId, resetTimer])

  const handleClick = (): void => {
    if (status === 'running') {
      pauseTimer(timerId)
    } else {
      startTimer({ id: timerId, recipeId, recipeName, stepIndex, label, totalSeconds })
    }
  }

  const Icon = status === 'running' ? Pause : status === 'completed' ? Check : Play

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      animate={
        status === 'running'
          ? { scale: [1, 1.03, 1] }
          : { scale: 1 }
      }
      transition={
        status === 'running'
          ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.15 }
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium cursor-pointer transition-colors align-middle',
        variant === 'light' ? 'px-2.5 py-0.5 text-xs ml-1' : 'px-3 py-1 text-sm ml-1.5',
        status === 'idle' && 'hover:brightness-110',
        status === 'running' && 'bg-primary text-white',
        status === 'paused' && (variant === 'light' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-amber-500/25 text-amber-300'),
        status === 'completed' && (variant === 'light' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-green-500/25 text-green-300'),
        status === 'idle' && (variant === 'light' ? 'bg-foreground/10 text-foreground' : 'bg-[#EDE8E2]/15 text-[#EDE8E2]')
      )}
    >
      <Icon size={variant === 'light' ? 10 : 12} strokeWidth={2.5} />
      <span className="tabular-nums">{formatTimerDisplay(displaySeconds)}</span>
    </motion.button>
  )
}
