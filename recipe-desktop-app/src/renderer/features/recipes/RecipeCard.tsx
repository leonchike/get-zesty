import { Link } from 'react-router-dom'
import { Heart, Pin, Clock, ChefHat } from 'lucide-react'
import { cn, formatImageUrl, formatTime } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type { Recipe } from '@/types'
import { motion } from 'framer-motion'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps): JSX.Element {
  const imageUrl = formatImageUrl(recipe.imageUrl)
  const time = recipe.totalTime || recipe.cookTime || recipe.prepTime

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={ROUTES.RECIPE(recipe.id)}
        className="group block rounded-xl overflow-hidden glass-elevated shadow-warm hover:shadow-warm-md transition-all duration-200"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <ChefHat size={40} className="text-muted-foreground/30" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            {recipe.FavoriteRecipe && recipe.FavoriteRecipe.length > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
                <Heart size={14} className="fill-primary text-primary" />
              </span>
            )}
            {recipe.PinnedRecipe && recipe.PinnedRecipe.length > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
                <Pin size={14} className="text-accent" />
              </span>
            )}
          </div>

          {/* Source badge */}
          {recipe.source !== 'USER' && (
            <span
              className={cn(
                'absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm',
                recipe.source === 'GEN_AI'
                  ? 'bg-accent/80 text-white'
                  : 'bg-primary/80 text-white'
              )}
            >
              {recipe.source === 'GEN_AI' ? 'AI' : 'Web'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <h3 className="font-heading text-base font-semibold text-foreground line-clamp-2 leading-snug h-[2.75rem]">
            {recipe.title}
          </h3>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            {time && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <Clock size={12} />
                {formatTime(time)}
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0',
                  recipe.difficulty === 'EASY' && 'bg-success/10 text-success',
                  recipe.difficulty === 'MEDIUM' && 'bg-accent/10 text-accent',
                  recipe.difficulty === 'HARD' && 'bg-destructive/10 text-destructive'
                )}
              >
                {recipe.difficulty}
              </span>
            )}
            {recipe.cuisineType && (
              <span className="truncate">{recipe.cuisineType}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
