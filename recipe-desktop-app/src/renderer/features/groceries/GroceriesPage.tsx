import { useState, useMemo } from 'react'
import { Plus, Check, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useGroceryList,
  useAddGroceryItem,
  useUpdateGroceryItem,
  useDeleteGroceryItem,
  useGroceryPolling
} from '@/hooks/useGroceries'
import type { GroceryItem } from '@/types'

export function GroceriesPage(): JSX.Element {
  const { data: items, isLoading } = useGroceryList()
  const addItem = useAddGroceryItem()
  const updateItem = useUpdateGroceryItem()
  const deleteItem = useDeleteGroceryItem()
  const [inputValue, setInputValue] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

  // Enable polling for real-time updates
  useGroceryPolling(true)

  const { activeItems, completedItems, sections } = useMemo(() => {
    if (!items) return { activeItems: [], completedItems: [], sections: new Map<string, GroceryItem[]>() }

    const active = items.filter((i) => i.status === 'ACTIVE')
    const completed = items.filter((i) => i.status === 'COMPLETED')

    // Group active items by section
    const sectionMap = new Map<string, GroceryItem[]>()
    active.forEach((item) => {
      const sectionName = item.section?.name || 'Other'
      const existing = sectionMap.get(sectionName) || []
      existing.push(item)
      sectionMap.set(sectionName, existing)
    })

    return { activeItems: active, completedItems: completed, sections: sectionMap }
  }, [items])

  const handleAdd = async (): Promise<void> => {
    const name = inputValue.trim()
    if (!name) return
    try {
      await addItem.mutateAsync({ name })
      setInputValue('')
    } catch {
      toast.error('Failed to add item')
    }
  }

  const handleToggleComplete = async (item: GroceryItem): Promise<void> => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        status: item.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE'
      })
    } catch {
      toast.error('Failed to update item')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteItem.mutateAsync(id)
    } catch {
      toast.error('Failed to delete item')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold">Grocery List</h1>

      {/* Add input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add an item..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
        />
        <Button onClick={handleAdd} disabled={addItem.isPending || !inputValue.trim()} size="icon">
          <Plus size={18} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : activeItems.length === 0 && completedItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Your grocery list is empty.</p>
          <p className="text-sm mt-1">Add items above or add ingredients from a recipe.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active items grouped by section */}
          {Array.from(sections.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([sectionName, sectionItems]) => (
              <div key={sectionName}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {sectionName}
                </h3>
                <div className="space-y-1">
                  <AnimatePresence>
                    {sectionItems.map((item) => (
                      <GroceryItemRow
                        key={item.id}
                        item={item}
                        onToggle={() => handleToggleComplete(item)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}

          {/* Completed items */}
          {completedItems.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                <Check size={14} />
                {completedItems.length} completed
              </button>
              {showCompleted && (
                <div className="space-y-1 mt-2">
                  <AnimatePresence>
                    {completedItems.map((item) => (
                      <GroceryItemRow
                        key={item.id}
                        item={item}
                        onToggle={() => handleToggleComplete(item)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GroceryItemRow({
  item,
  onToggle,
  onDelete
}: {
  item: GroceryItem
  onToggle: () => void
  onDelete: () => void
}): JSX.Element {
  const isCompleted = item.status === 'COMPLETED'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
        isCompleted ? 'opacity-50' : 'glass-elevated hover:shadow-warm'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isCompleted
            ? 'border-success bg-success text-white'
            : 'border-border hover:border-primary'
        )}
      >
        {isCompleted && <Check size={10} strokeWidth={3} />}
      </button>

      <span
        className={cn(
          'flex-1 text-sm',
          isCompleted && 'line-through text-muted-foreground'
        )}
      >
        {item.quantity && item.quantityUnit
          ? `${item.quantity} ${item.quantityUnit} `
          : item.quantity
            ? `${item.quantity} `
            : ''}
        {item.name}
      </span>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  )
}
