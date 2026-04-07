import Fraction from 'fraction.js'

const COMMON_FRACTIONS: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞'
}

function simplifyFraction(fraction: Fraction): string {
  const simplified = fraction.simplify()
  const key = `${simplified.n}/${simplified.d}`
  return COMMON_FRACTIONS[key] || key
}

/**
 * Convert a decimal to a human-readable fraction string.
 * Examples: 0.5 → "½", 1.75 → "1 ¾", 3 → "3"
 */
export function decimalToFraction(decimal: number | undefined | null): string {
  if (decimal === undefined || decimal === null) return ''
  if (decimal === 0) return '0'

  const fraction = new Fraction(decimal)
  const wholePart = Math.floor(fraction.valueOf())
  const fractionalPart = fraction.mod(1)

  if (fractionalPart.valueOf() === 0) {
    return wholePart.toString()
  } else if (wholePart === 0) {
    return simplifyFraction(fractionalPart)
  } else {
    return `${wholePart} ${simplifyFraction(fractionalPart)}`
  }
}

/**
 * Format a scaled ingredient for display.
 * quantity is multiplied by scale, then rendered as a fraction.
 */
export function formatScaledQuantity(
  quantity: number | null | undefined,
  scale: number
): string {
  if (quantity == null || quantity === 0) return ''
  return decimalToFraction(quantity * scale)
}
