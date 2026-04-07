import { parseTimeMentions } from '@/lib/parseTimeMentions'
import { TimerPill } from './TimerPill'

interface ParsedInstructionTextProps {
  text: string
  recipeId: string
  recipeName: string
  stepIndex: number
  variant?: 'light' | 'dark'
}

export function ParsedInstructionText({
  text,
  recipeId,
  recipeName,
  stepIndex,
  variant = 'dark'
}: ParsedInstructionTextProps): JSX.Element {
  const segments = parseTimeMentions(text)

  let matchIndex = 0

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>
        }

        const timerId = `${recipeId}-${stepIndex}-${matchIndex}`
        matchIndex++

        return (
          <span key={i}>
            <span>{seg.value}</span>
            <TimerPill
              timerId={timerId}
              recipeId={recipeId}
              recipeName={recipeName}
              stepIndex={stepIndex}
              label={seg.value}
              totalSeconds={seg.totalSeconds}
              variant={variant}
            />
          </span>
        )
      })}
    </span>
  )
}
