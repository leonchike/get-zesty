import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  List,
  Timer,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRecipe } from '@/hooks/useRecipes'
import { useCookingStore } from '@/stores/cookingStore'
import { PageLoader } from '@/components/ui/loader'

export function CookingPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: recipe, isLoading } = useRecipe(id)
  const {
    isActive,
    currentStep,
    totalSteps,
    showIngredients,
    nextStep,
    prevStep,
    setStep,
    toggleIngredients,
    stopCooking,
    startCooking
  } = useCookingStore()

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // Power save blocker
  useEffect(() => {
    window.api.power.preventSleep()
    return () => {
      window.api.power.allowSleep()
    }
  }, [])

  // Timer tick
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            setTimerRunning(false)
            // Simple notification
            new Notification('Timer Done!', { body: 'Your cooking timer has finished.' })
            return 0
          }
          return s - 1
        })
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning, timerSeconds])

  const instructions = useMemo(() => {
    if (!recipe) return []
    if (recipe.parsedInstructions) {
      return recipe.parsedInstructions.map((i) => i.text)
    }
    if (recipe.instructions) {
      return recipe.instructions
        .split('\n')
        .map((l) => l.trim().replace(/^\d+[\.\)]\s*/, ''))
        .filter(Boolean)
    }
    return []
  }, [recipe])

  const ingredients = useMemo(() => {
    if (!recipe) return []
    if (recipe.parsedIngredients) {
      return recipe.parsedIngredients.map((i) => i.originalText || `${i.quantity || ''} ${i.unit || ''} ${i.ingredient}`.trim())
    }
    if (recipe.ingredients) {
      return recipe.ingredients.split('\n').map((l) => l.trim()).filter(Boolean)
    }
    return []
  }, [recipe])

  // Auto-start if not active
  useEffect(() => {
    if (recipe && !isActive && instructions.length > 0) {
      startCooking(recipe.id, instructions.length)
    }
  }, [recipe, isActive, instructions.length, startCooking])

  const handleExit = (): void => {
    stopCooking()
    navigate(`/recipes/${id}`)
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextStep()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prevStep()
      } else if (e.key === 'Escape') {
        handleExit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nextStep, prevStep])

  if (isLoading) return <PageLoader />
  if (!recipe || instructions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No instructions available.</p>
      </div>
    )
  }

  const formatTimer = (secs: number): string => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-full bg-[hsl(var(--cooking-bg))] text-white overflow-hidden">
      {/* Ingredients sidebar */}
      <AnimatePresence>
        {showIngredients && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/10 overflow-y-auto scrollbar-thin flex-shrink-0"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
                Ingredients
              </h3>
              <ul className="space-y-2">
                {ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-white/40 flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main cooking area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </Button>
            <h2 className="font-heading text-lg font-semibold text-white/90 truncate max-w-xs">
              {recipe.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleIngredients}
              className={cn(
                'text-white/60 hover:text-white hover:bg-white/10 gap-2',
                showIngredients && 'bg-white/10 text-white'
              )}
            >
              <List size={16} />
              Ingredients
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTimer(!showTimer)}
              className={cn(
                'text-white/60 hover:text-white hover:bg-white/10 gap-2',
                showTimer && 'bg-white/10 text-white'
              )}
            >
              <Timer size={16} />
              Timer
            </Button>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl text-center"
            >
              <span className="text-5xl font-heading font-bold text-primary mb-6 block">
                {currentStep + 1}
              </span>
              <p className="text-xl leading-relaxed text-white/90">
                {instructions[currentStep]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Timer panel */}
        {showTimer && (
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2">
              <input
                type="number"
                min={0}
                placeholder="min"
                className="w-16 bg-transparent text-center text-white text-lg focus:outline-none"
                onChange={(e) => setTimerSeconds(Number(e.target.value) * 60)}
                disabled={timerRunning}
              />
              <span className="text-2xl font-mono text-white/80">{formatTimer(timerSeconds)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTimerRunning(!timerRunning)}
                className="text-white/60 hover:text-white hover:bg-white/10"
                disabled={timerSeconds === 0 && !timerRunning}
              >
                {timerRunning ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setTimerRunning(false)
                  setTimerSeconds(0)
                }}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <RotateCcw size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-6">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
          >
            <ChevronLeft size={18} />
            Previous
          </Button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {instructions.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={currentStep === totalSteps - 1 ? handleExit : nextStep}
            className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
          >
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
