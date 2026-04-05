export interface TimeMention {
  originalText: string;
  totalSeconds: number;
}

export type TimeMentionSegment =
  | { type: "text"; value: string }
  | { type: "timer"; value: string; totalSeconds: number };

const TIME_UNIT_MAP: Record<string, number> = {
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
};

// Matches patterns like "5 minutes", "6-8 mins", "1 hour 30 minutes", "about 10 min"
// Requires a digit before the unit to avoid matching things like "minute steak"
const TIME_PATTERN =
  /(?:(?:about|approximately|approx|around|roughly|for|another)\s+)?(\d+)(?:\s*[-–]\s*(\d+))?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|h|m|s)\b/gi;

function parseUnitToSeconds(value: number, unit: string): number {
  const normalized = unit.toLowerCase().replace(/\.$/, "");
  return value * (TIME_UNIT_MAP[normalized] ?? 0);
}

export function parseTimeMentions(text: string): TimeMentionSegment[] {
  const segments: TimeMentionSegment[] = [];
  let lastIndex = 0;

  // First pass: collect all individual matches
  const rawMatches: Array<{
    start: number;
    end: number;
    text: string;
    seconds: number;
  }> = [];

  let match: RegExpExecArray | null;
  const regex = new RegExp(TIME_PATTERN.source, TIME_PATTERN.flags);

  while ((match = regex.exec(text)) !== null) {
    const num1 = parseInt(match[1], 10);
    const num2 = match[2] ? parseInt(match[2], 10) : null;
    const unit = match[3];

    // Use the larger number for ranges
    const value = num2 !== null ? Math.max(num1, num2) : num1;
    const seconds = parseUnitToSeconds(value, unit);

    if (seconds > 0) {
      rawMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        seconds,
      });
    }
  }

  // Second pass: merge adjacent/compound matches (e.g., "1 hour 30 minutes")
  const mergedMatches: Array<{
    start: number;
    end: number;
    text: string;
    seconds: number;
  }> = [];

  for (let i = 0; i < rawMatches.length; i++) {
    const current = rawMatches[i];

    // Check if next match is adjacent (only whitespace/and between them)
    if (i + 1 < rawMatches.length) {
      const next = rawMatches[i + 1];
      const between = text.slice(current.end, next.start);

      if (/^\s*(?:and\s+)?$/.test(between)) {
        // Merge into compound time
        mergedMatches.push({
          start: current.start,
          end: next.end,
          text: text.slice(current.start, next.end),
          seconds: current.seconds + next.seconds,
        });
        i++; // skip next since we merged it
        continue;
      }
    }

    mergedMatches.push(current);
  }

  // Build segments
  for (const m of mergedMatches) {
    if (m.start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, m.start) });
    }
    segments.push({
      type: "timer",
      value: m.text,
      totalSeconds: m.seconds,
    });
    lastIndex = m.end;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  // If no timers found, return single text segment
  if (segments.length === 0) {
    return [{ type: "text", value: text }];
  }

  return segments;
}
