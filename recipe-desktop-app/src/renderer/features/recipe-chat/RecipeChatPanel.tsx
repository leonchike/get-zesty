import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { Recipe, ChatMessage } from '@/types'

interface RecipeChatPanelProps {
  recipe: Recipe
  onClose: () => void
}

export function RecipeChatPanel({ recipe, onClose }: RecipeChatPanelProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (): Promise<void> => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const { data } = await api.post(ENDPOINTS.RECIPE_CHAT, {
        data: {
          message: text,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          recipeIngredients: recipe.ingredients,
          recipeInstructions: recipe.instructions,
          history: messages
        }
      })

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || data.message || 'Sorry, I could not generate a response.'
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-80 border-l border-border flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-heading font-semibold text-sm">Recipe Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X size={14} />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>Ask questions about this recipe.</p>
            <p className="mt-2 text-xs">
              Try: &quot;Can I substitute butter for oil?&quot;
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'text-sm rounded-lg px-3 py-2 max-w-[90%]',
              msg.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader size={14} />
            <span className="text-xs">Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about this recipe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            className="text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="flex-shrink-0"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
