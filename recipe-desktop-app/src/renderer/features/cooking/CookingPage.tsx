import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  X,
  List,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { useCookingStore } from '@/stores/cookingStore'
import { useRecipeDisplayStore } from '@/stores/recipeDisplayStore'
import { formatScaledQuantity } from '@/lib/fractions'
import { PageLoader } from '@/components/ui/loader'
import { useTimerTick } from '@/hooks/useTimerTick'
import { ParsedInstructionText } from './ParsedInstructionText'
import { ActiveTimersBar } from './ActiveTimersBar'
import type { ParsedIngredient } from '@/types'

// Warm off-white used throughout cooking mode
const TEXT = '#EDE8E2'

export function CookingPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
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

  const [showCelebration, setShowCelebration] = useState(false)
  const [slideDirection, setSlideDirection] = useState(1) // 1 = forward, -1 = backward

  // Enable inline timer ticking in cooking view
  useTimerTick()

  // Redirect if not authed
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  // Power save blocker
  useEffect(() => {
    window.api.power.preventSleep()
    return () => {
      window.api.power.allowSleep()
    }
  }, [])

  const instructions = useMemo(() => {
    if (!recipe?.instructions) return []
    return recipe.instructions
      .split('\n')
      .map((l) => l.trim().replace(/^\d+[\.\)]\s*/, ''))
      .filter(Boolean)
  }, [recipe])

  const scale = useRecipeDisplayStore((s) => s.getRecipeScale(recipe?.id ?? ''))

  // Build scaled ingredient display strings
  const { allIngredients, parsedIngredientNames } = useMemo(() => {
    if (!recipe) return { allIngredients: [] as string[], parsedIngredientNames: [] as string[] }

    // Try parsed ingredients for scaled display
    const parsed = safeParsedIngredients(recipe.parsedIngredients)
    if (parsed && parsed.length > 0) {
      const display = parsed.map((ing) => {
        const qty = formatScaledQuantity(ing.quantity, scale)
        return [qty, ing.unit, ing.ingredient].filter(Boolean).join(' ')
      })
      const names = parsed.map((ing) => ing.ingredient)
      return { allIngredients: display, parsedIngredientNames: names }
    }

    // Fall back to raw text (no scaling possible)
    if (recipe.ingredients) {
      const lines = recipe.ingredients.split('\n').map((l) => l.trim()).filter(Boolean)
      return { allIngredients: lines, parsedIngredientNames: lines }
    }
    return { allIngredients: [] as string[], parsedIngredientNames: [] as string[] }
  }, [recipe, scale])

  // Smart ingredient-to-step assignment
  const stepIngredients = useMemo(() => {
    if (allIngredients.length === 0 || instructions.length === 0) return []
    if (instructions.length === 1) return allIngredients

    const stepText = instructions[currentStep]?.toLowerCase() || ''
    return allIngredients.filter((_, i) => {
      const name = parsedIngredientNames[i] || ''
      const words = name
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length >= 3)
      return words.some((word) => stepText.includes(word))
    })
  }, [allIngredients, parsedIngredientNames, instructions, currentStep])

  // Auto-start if not active
  useEffect(() => {
    if (recipe && !isActive && instructions.length > 0) {
      startCooking(recipe.id, instructions.length)
    }
  }, [recipe, isActive, instructions.length, startCooking])

  const handleExit = useCallback((): void => {
    stopCooking()
    navigate(`/recipes/${id}`)
  }, [stopCooking, navigate, id])

  const handleNext = useCallback((): void => {
    if (currentStep === totalSteps - 1) {
      // Show celebration
      setShowCelebration(true)
      setTimeout(() => {
        handleExit()
      }, 2500)
    } else {
      setSlideDirection(1)
      nextStep()
    }
  }, [currentStep, totalSteps, nextStep, handleExit])

  const handlePrev = useCallback((): void => {
    setSlideDirection(-1)
    prevStep()
  }, [prevStep])

  const handleSetStep = useCallback(
    (step: number): void => {
      setSlideDirection(step > currentStep ? 1 : -1)
      setStep(step)
    },
    [currentStep, setStep]
  )

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'Escape') {
        handleExit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNext, handlePrev, handleExit])

  if (authLoading || isLoading) {
    return (
      <div className="h-screen bg-[hsl(var(--cooking-bg))] flex items-center justify-center">
        <PageLoader />
      </div>
    )
  }
  if (!recipe || instructions.length === 0) {
    return (
      <div className="h-screen bg-[hsl(var(--cooking-bg))] flex flex-col items-center justify-center" style={{ color: `${TEXT}99` }}>
        <p>No instructions available.</p>
        <Button variant="ghost" className="mt-4" style={{ color: `${TEXT}99` }} onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    )
  }

  const progress = ((currentStep + 1) / instructions.length) * 100

  // Celebration overlay
  if (showCelebration) {
    return (
      <div className="h-screen bg-[hsl(var(--cooking-bg))] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className="text-7xl block mb-6">🎉</span>
          <h1 className="font-heading text-4xl font-bold" style={{ color: TEXT }}>
            Well done!
          </h1>
          <p className="mt-3 text-lg" style={{ color: `${TEXT}80` }}>
            Enjoy your meal
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--cooking-bg))] overflow-hidden">
      {/* All ingredients sidebar */}
      <AnimatePresence>
        {showIngredients && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-y-auto scrollbar-thin"
            style={{ borderRight: `1px solid ${TEXT}15` }}
          >
            {/* Spacer for traffic lights */}
            <div className="h-[38px]" />
            <div className="p-5">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: `${TEXT}50` }}
              >
                All Ingredients
              </h3>
              <ul className="space-y-3">
                {allIngredients.map((ing, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2.5"
                    style={{ color: `${TEXT}CC` }}
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${TEXT}40` }}
                    />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Drag region for traffic lights */}
        <div className="drag-region h-[38px] flex-shrink-0" />

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              className="no-drag h-9 w-9"
              style={{ color: `${TEXT}99` }}
            >
              <X size={18} />
            </Button>
            <h2
              className="font-heading text-base font-semibold truncate max-w-md"
              style={{ color: `${TEXT}BB` }}
            >
              {recipe.title}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleIngredients}
              className={cn('no-drag gap-2 text-xs', showIngredients && 'bg-white/10')}
              style={{ color: `${TEXT}99` }}
            >
              <List size={14} />
              Ingredients
            </Button>
          </div>
        </div>

        {/* Active timers bar */}
        <ActiveTimersBar />

        {/* Step content — fills remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 relative overflow-hidden">
          {/* Decorative step number (background) */}
          <span
            className="absolute font-heading font-bold select-none pointer-events-none"
            style={{
              fontSize: '12rem',
              color: `${TEXT}05`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -60%)'
            }}
          >
            {currentStep + 1}
          </span>

          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={currentStep}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection * -80 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="max-w-2xl text-center relative z-10"
            >
              {/* Step label */}
              <p
                className="text-sm uppercase tracking-widest mb-6"
                style={{ color: `${TEXT}50` }}
              >
                Step {currentStep + 1} of {instructions.length}
              </p>

              {/* Instruction text — large and readable, with inline timer pills */}
              <p className="text-3xl lg:text-4xl leading-relaxed font-body min-h-[120px]">
                <ParsedInstructionText
                  text={instructions[currentStep]}
                  recipeId={recipe.id}
                  recipeName={recipe.title}
                  stepIndex={currentStep}
                />
              </p>

              {/* Ingredients for this step */}
              {stepIngredients.length > 0 && (
                <div
                  className="mt-8 pt-6"
                  style={{ borderTop: `1px solid ${TEXT}15` }}
                >
                  <p
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ color: `${TEXT}50` }}
                  >
                    Ingredients for this step
                  </p>
                  <p className="text-lg leading-relaxed" style={{ color: `${TEXT}DD` }}>
                    {stepIngredients.join(' · ')}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: progress bar + navigation */}
        <div className="flex-shrink-0">
          {/* Progress bar */}
          <div className="relative h-1.5 w-full">
            <div
              className="absolute inset-0 rounded-none transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))'
              }}
            />
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-none blur-sm opacity-50 transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))'
              }}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between px-6 py-5">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 min-w-[48px] min-h-[48px] px-4 rounded-xl transition-colors disabled:opacity-30"
              style={{
                color: `${TEXT}CC`,
                backgroundColor: `${TEXT}10`,
                border: `1px solid ${TEXT}20`
              }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            {/* Step indicator */}
            <span className="text-xs" style={{ color: `${TEXT}50` }}>
              {currentStep + 1} / {instructions.length}
            </span>

            {currentStep === totalSteps - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 min-w-[48px] min-h-[48px] px-5 rounded-xl font-semibold transition-colors bg-success hover:bg-success/90 text-white"
              >
                <CheckCircle2 size={16} />
                Done Cooking!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 min-w-[48px] min-h-[48px] px-4 rounded-xl transition-colors"
                style={{
                  color: `${TEXT}CC`,
                  backgroundColor: `${TEXT}10`,
                  border: `1px solid ${TEXT}20`
                }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Safely coerce parsedIngredients JSON field to a typed array
function safeParsedIngredients(value: unknown): ParsedIngredient[] | null {
  if (!value) return null
  let arr: unknown[] | null = null
  if (Array.isArray(value)) arr = value
  else if (typeof value === 'string') {
    try {
      const p = JSON.parse(value)
      if (Array.isArray(p)) arr = p
    } catch {
      return null
    }
  }
  if (!arr || arr.length === 0) return null
  if (typeof arr[0] === 'object' && arr[0] !== null && 'ingredient' in arr[0]) {
    return arr as ParsedIngredient[]
  }
  return null
}
