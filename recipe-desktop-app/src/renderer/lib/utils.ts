import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const CLOUDFLARE_ACCOUNT_HASH = 'KLeiOGghMN_0FaV0y3kRVA'

export function isCloudflareImageId(url: string | null | undefined): boolean {
  if (!url) return false
  return !url.startsWith('http') && !url.startsWith('/')
}

export function formatImageUrl(
  imageUrl: string | null | undefined,
  variant: string = 'largeartwork'
): string | null {
  if (!imageUrl) return null
  if (isCloudflareImageId(imageUrl)) {
    return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageUrl}/${variant}`
  }
  return imageUrl
}

export function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
