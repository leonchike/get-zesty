import { useEffect, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SearchModal } from './SearchModal'

export function Toolbar(): JSX.Element {
  const { user } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  // Cmd+F opens search modal
  const openSearch = useCallback(() => setSearchOpen(true), [])

  useEffect(() => {
    const unsub = window.api.onFocusSearch(openSearch)
    return unsub
  }, [openSearch])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'k')) {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSearch])

  return (
    <header className="sticky top-0 z-30 glass border-b border-glass-border">
      {/* Accent gradient line */}
      <div className="h-0.5 accent-gradient" />

      <div className="flex items-center gap-4 px-6 py-3">
        {/* Search trigger button */}
        <button
          onClick={openSearch}
          className="flex-1 max-w-md flex items-center gap-3 px-4 py-2 rounded-lg border border-border bg-input/30 hover:border-primary/30 transition-all text-sm text-muted-foreground group"
        >
          <Search size={15} className="opacity-50 group-hover:opacity-70 flex-shrink-0" />
          <span className="flex-1 text-left">Search recipes & cookbooks...</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>F
          </kbd>
        </button>

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

        {/* Search modal */}
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </header>
  )
}
