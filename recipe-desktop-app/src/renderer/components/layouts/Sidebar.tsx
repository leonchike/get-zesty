import { NavLink, useLocation } from 'react-router-dom'
import {
  ChefHat,
  Plus,
  BookOpen,
  ShoppingCart,
  Pin,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { usePinnedRecipes } from '@/hooks/usePinnedRecipes'
import { formatImageUrl, truncate } from '@/lib/utils'
import { SidebarTimers } from '@/features/cooking/SidebarTimers'

const NAV_ITEMS = [
  { label: 'All Recipes', icon: ChefHat, path: ROUTES.HOME },
  { label: 'New Recipe', icon: Plus, path: ROUTES.RECIPES_CREATE },
  { label: 'Cookbooks', icon: BookOpen, path: ROUTES.COOKBOOKS },
  { label: 'Groceries', icon: ShoppingCart, path: ROUTES.GROCERIES }
]

export function Sidebar(): JSX.Element {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { data: pinnedRecipes } = usePinnedRecipes()

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-56 flex-col glass border-r border-glass-border">
      {/* Drag region for traffic lights */}
      <div className="drag-region flex flex-col pt-[38px] px-4 pb-3">
        <span className="no-drag font-logo text-lg font-semibold text-primary tracking-wide">
          Zesty
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'no-drag flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-muted/60'
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Pinned recipes */}
      {isAuthenticated && pinnedRecipes && pinnedRecipes.length > 0 && (
        <div className="px-3 py-2 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Pin size={12} />
            Pinned
          </div>
          <div className="space-y-0.5 mt-1">
            {pinnedRecipes.slice(0, 5).map((recipe) => (
              <NavLink
                key={recipe.id}
                to={ROUTES.RECIPE(recipe.id)}
                className={({ isActive }) =>
                  cn(
                    'no-drag flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground hover:bg-muted/60'
                  )
                }
              >
                {recipe.imageUrl ? (
                  <img
                    src={formatImageUrl(recipe.imageUrl, 'thumbnail') || ''}
                    alt=""
                    className="h-5 w-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-5 w-5 rounded bg-muted flex-shrink-0" />
                )}
                <span className="truncate">{truncate(recipe.title, 22)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Active timers */}
      <SidebarTimers />

      {/* Settings */}
      {isAuthenticated && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <NavLink
            to={ROUTES.SETTINGS}
            className={({ isActive }) =>
              cn(
                'no-drag flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-muted/60'
              )
            }
          >
            <Settings size={18} strokeWidth={1.5} />
            Settings
          </NavLink>
        </div>
      )}
    </aside>
  )
}
