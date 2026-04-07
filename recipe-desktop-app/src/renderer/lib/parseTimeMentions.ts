export interface TimeMentionSegment {
  type: 'text' | 'timer'
  value: string
  totalSeconds: number // 0 for text segments
}

const TIME_PATTERN =
  /(?:(?:about|approximately|approx|around|roughly|for|another)\s+)?(\d+)(?:\s*[-–]\s*(\d+))?\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)\b/gi

const UNIT_TO_SECONDS: Record<string, number> = {
  s: 1, sec: 1, secs: 1, second: 1, seconds: 1,
  m: 60, min: 60, mins: 60, minute: 60, minutes: 60,
  h: 3600, hr: 3600, hrs: 3600, hour: 3600, hours: 3600
}

function unitToSeconds(unit: string): number {
  return UNIT_TO_SECONDS[unit.toLowerCase()] ?? 60
}

interface RawMatch {
  start: number
  end: number
  text: string
  totalSeconds: number
}

export function parseTimeMentions(text: string): TimeMentionSegment[] {
  // Pass 1: collect all matches
  const matches: RawMatch[] = []
  let match: RegExpExecArray | null

  // Reset regex state
  TIME_PATTERN.lastIndex = 0
  while ((match = TIME_PATTERN.exec(text)) !== null) {
    const num1 = parseInt(match[1], 10)
    const num2 = match[2] ? parseInt(match[2], 10) : null
    const unit = match[3]
    // For ranges like "6-8 minutes", use the max
    const value = num2 !== null ? Math.max(num1, num2) : num1
    const seconds = value * unitToSeconds(unit)

    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      totalSeconds: seconds
    })
  }

  if (matches.length === 0) {
    return [{ type: 'text', value: text, totalSeconds: 0 }]
  }

  // Pass 2: merge adjacent matches (e.g. "1 hour 30 minutes" → single timer)
  const merged: RawMatch[] = []
  for (const m of matches) {
    const prev = merged[merged.length - 1]
    if (prev) {
      const gap = text.slice(prev.end, m.start).trim()
      if (gap === '' || gap === 'and' || gap === ',') {
        // Merge into previous
        prev.end = m.end
        prev.text = text.slice(prev.start, m.end)
        prev.totalSeconds += m.totalSeconds
        continue
      }
    }
    merged.push({ ...m })
  }

  // Pass 3: build segments
  const segments: TimeMentionSegment[] = []
  let cursor = 0

  for (const m of merged) {
    if (m.start > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, m.start), totalSeconds: 0 })
    }
    segments.push({ type: 'timer', value: m.text, totalSeconds: m.totalSeconds })
    cursor = m.end
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor), totalSeconds: 0 })
  }

  return segments
}

export function formatTimerDisplay(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00'
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }
  return `${m}:${sec.toString().padStart(2, '0')}`
}
