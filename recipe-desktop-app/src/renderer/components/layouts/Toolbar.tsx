import { useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilterStore } from '@/stores/filterStore'
import { useAuth } from '@/hooks/useAuth'

export function Toolbar(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const { search, setSearch } = useFilterStore()
  const { user } = useAuth()

  // Listen for Cmd+F from main process
  const focusSearch = useCallback(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const unsub = window.api.onFocusSearch(focusSearch)
    return unsub
  }, [focusSearch])

  // Also handle Cmd+F locally
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        focusSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusSearch])

  return (
    <header className="sticky top-0 z-30 glass border-b border-glass-border">
      {/* Accent gradient line */}
      <div className="h-0.5 accent-gradient" />

      <div className="flex items-center gap-4 px-6 py-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full rounded-lg border border-border bg-input/50 py-2 pl-9 pr-9 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              'transition-all'
            )}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden lg:block">
              {user.name || user.email}
            </span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
