import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoaderProps {
  className?: string
  size?: number
}

export function Loader({ className, size = 24 }: LoaderProps): JSX.Element {
  return <Loader2 className={cn('animate-spin text-primary', className)} size={size} />
}

export function PageLoader(): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader size={32} />
    </div>
  )
}
