# AI Recipe Chat Feature Implementation Plan

## Project Context

- **Framework**: Next.js 14 with App Router, TypeScript
- **State Management**: Zustand for UI state, React Query for server state
- **UI Components**: Radix UI with Tailwind CSS
- **Data Mutations**: Server Actions (preferred over API routes)
- **AI Integration**: OpenAI API
- **Current State**: Single prompt recipe generation
- **Goal**: Interactive chat for iterative recipe development

## Key Specifications

1. **Single Recipe Per Session**: Users can generate and iterate on ONE recipe per chat session
2. **AI Image Generation**: On save, trigger background process to generate and store recipe image
3. **Ephemeral Sessions**: Chat history is not persisted - closes without saving
4. **Adaptive AI**: Handles all modification requests (scaling, substitutions, dietary changes)
5. **Mobile UI**: Standard responsive design, no special mobile features

## Feature Organization Structure

Following the codebase's feature-based pattern:

```
src/features/recipe-chat/
├── components/
│   ├── chat-modal.tsx           # Main modal using Radix Dialog
│   ├── message-list.tsx         # Chat message display
│   ├── message-input.tsx        # Input with send button
│   ├── recipe-message.tsx       # Recipe display component
│   └── save-recipe-button.tsx   # Save functionality
├── hooks/
│   ├── useRecipeChat.ts         # Main chat logic hook
│   └── useRecipeChatQuery.ts    # React Query integration
├── stores/
│   └── recipe-chat-store.ts     # Zustand store for chat state
├── actions/
│   ├── recipe-chat-actions.ts   # Server actions
│   └── save-recipe-action.ts    # Save recipe server action
└── lib/
    ├── ai-orchestrator.ts       # AI logic
    └── recipe-formatter.ts      # Display formatting
```

## Core Requirements

### 1. Chat Modal Implementation (Using Radix Dialog)

Create modal component using established patterns:

```typescript
// src/features/recipe-chat/components/chat-modal.tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRecipeChatStore } from "../stores/recipe-chat-store";

export function RecipeChatModal() {
  const { isOpen, setIsOpen } = useRecipeChatStore();
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="h-[90vh] max-w-4xl flex flex-col p-0">
        {/* Header, Messages, Input */}
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Zustand Store for Chat State

```typescript
// src/features/recipe-chat/stores/recipe-chat-store.ts
import { create } from "zustand";
import { Recipe } from "@prisma/client";

type MessageType = "text" | "recipe";
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: MessageType;
  recipeData?: Recipe;
  timestamp: Date;
};

interface RecipeChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentRecipe: Recipe | null; // Tracks the single recipe being developed
  hasGeneratedRecipe: boolean; // Prevents multiple recipes per session
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  clearChat: () => void; // Resets all state when modal closes
}

export const useRecipeChatStore = create<RecipeChatState>((set) => ({
  // Initial state and actions
}));
```

### 3. AI Orchestrator Implementation

```typescript
// src/features/recipe-chat/lib/ai-orchestrator.ts
import { Recipe } from "@prisma/client";

type ResponseType = "conversation" | "recipe" | "recipe-modification";

interface OrchestratorResponse {
  type: ResponseType;
  content: string;
  recipeData?: Recipe;
}

export async function processUserMessage(
  message: string,
  chatHistory: ChatMessage[],
  hasExistingRecipe: boolean
): Promise<OrchestratorResponse> {
  // Determine if this is a new recipe request or modification
  const isModificationRequest = hasExistingRecipe && 
    analyzeIfModification(message, chatHistory);
  
  if (isModificationRequest) {
    // Get current recipe and apply modifications
    const currentRecipe = extractCurrentRecipe(chatHistory);
    const modifiedRecipe = await applyModifications(
      currentRecipe, 
      message, 
      chatHistory
    );
    return {
      type: "recipe-modification",
      content: "I've updated the recipe based on your request:",
      recipeData: modifiedRecipe
    };
  }
  
  // Check if asking for a new recipe when one exists
  if (hasExistingRecipe && isNewRecipeRequest(message)) {
    return {
      type: "conversation",
      content: "You already have a recipe in this session. To create a new recipe, please start a new chat session.",
    };
  }
  
  // Process as normal (conversation or initial recipe)
  return await generateResponse(message, chatHistory);
}
```

### 4. Server Actions (Instead of API Routes)

```typescript
// src/features/recipe-chat/actions/recipe-chat-actions.ts
"use server";

import { getUser } from "@/lib/actions/auth-actions";
import { processUserMessage } from "../lib/ai-orchestrator";

export async function sendChatMessage(
  message: string,
  chatHistory: ChatMessage[]
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  
  try {
    const response = await processUserMessage(message, chatHistory);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: "Failed to process message" };
  }
}

export async function saveRecipeFromChat(
  recipe: Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  
  // Save recipe without image first
  const savedRecipe = await createRecipe(recipe, user.id);
  
  // Trigger background image generation (non-blocking)
  generateAndSaveRecipeImage(savedRecipe.id, recipe.title).catch(console.error);
  
  revalidatePath("/recipes");
  return savedRecipe;
}

// Background process for image generation
async function generateAndSaveRecipeImage(recipeId: string, title: string) {
  try {
    // 1. Generate image using AI (DALL-E or similar)
    const imageUrl = await generateAIImage(title);
    
    // 2. Upload to Cloudflare Images
    const uploadedUrl = await uploadImageFromUrl(imageUrl);
    
    // 3. Update recipe with image URL
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { imageUrl: uploadedUrl }
    });
  } catch (error) {
    console.error("Failed to generate recipe image:", error);
    // Fail silently - recipe already saved
  }
}
```

### 5. Recipe Data Structure

All generated recipes must match the existing Prisma schema:

```prisma
model Recipe {
  id                  String              @id @default(cuid())
  userId              String
  title               String
  description         String?
  difficulty          RecipeDifficulty    @default(EASY)
  prepTime            Int?
  cookTime            Int?
  restTime            Int?
  totalTime           Int?
  servings            Int?
  ingredients         String?
  instructions        String?
  equipment           String?
  utensils            String?
  nutrition           Json?
  notes               String?
  cuisineType         String?
  mealType            String?
  dietaryRestrictions String[]
  tags                String[]
  sourceUrl           String?
  imageUrl            String?
  seasonality         String?
  parsedIngredients   Json?
  parsedInstructions  Json?
}
```

### 6. React Query Integration

```typescript
// src/features/recipe-chat/hooks/useRecipeChatQuery.ts
import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "../actions/recipe-chat-actions";

export function useRecipeChat() {
  const { messages, addMessage, setLoading, setError } = useRecipeChatStore();
  
  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(message, messages),
    onMutate: () => setLoading(true),
    onSuccess: (response) => {
      if (response.success) {
        addMessage({
          id: generateId(),
          role: "assistant",
          content: response.data.content,
          type: response.data.type === "recipe" ? "recipe" : "text",
          recipeData: response.data.recipeData,
          timestamp: new Date(),
        });
      }
    },
    onError: () => setError("Failed to send message"),
    onSettled: () => setLoading(false),
  });
  
  return mutation;
}
```

### 7. Message Display Components

```typescript
// src/features/recipe-chat/components/message-list.tsx
export function MessageList() {
  const { messages, isLoading } = useRecipeChatStore();
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.type === "recipe" ? (
            <RecipeMessage message={message} />
          ) : (
            <TextMessage message={message} />
          )}
        </div>
      ))}
      {isLoading && <LoadingIndicator />}
    </div>
  );
}
```

### 8. Recipe Display and Save Component

```typescript
// src/features/recipe-chat/components/recipe-message.tsx
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { saveRecipeFromChat } from "../actions/recipe-chat-actions";
import { useRouter } from "next/navigation";
import { formatRecipeForDisplay } from "../lib/recipe-formatter";
import { toast } from "sonner";

export function RecipeMessage({ message }: { message: ChatMessage }) {
  const router = useRouter();
  const { setIsOpen, currentRecipe } = useRecipeChatStore();
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  
  // Check if this is the latest version of the recipe
  const isLatestVersion = message.recipeData?.title === currentRecipe?.title;
  
  const saveMutation = useMutation({
    mutationFn: () => saveRecipeFromChat(message.recipeData!),
    onSuccess: (recipe) => {
      setHasBeenSaved(true);
      toast.success("Recipe saved! Generating image...");
      setTimeout(() => {
        setIsOpen(false);
        router.push(`/recipes/${recipe.id}`);
      }, 1500);
    },
    onError: () => {
      toast.error("Failed to save recipe. Please try again.");
    }
  });
  
  return (
    <div className="bg-secondary/10 rounded-lg p-4 max-w-2xl">
      <div className="prose dark:prose-invert">
        {formatRecipeForDisplay(message.recipeData!)}
      </div>
      {isLatestVersion && (
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || hasBeenSaved}
          className="mt-4"
        >
          {saveMutation.isPending ? "Saving..." : 
           hasBeenSaved ? "Saved ✓" : "Save Recipe"}
        </Button>
      )}
    </div>
  );
}
```

### 9. Input Component with Keyboard Support

```typescript
// src/features/recipe-chat/components/message-input.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function MessageInput() {
  const [input, setInput] = useState("");
  const { isLoading } = useRecipeChatStore();
  const { mutate } = useRecipeChat();
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      mutate(input);
      setInput("");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about recipes or cooking..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={!input.trim() || isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
```

### 10. Integration with Existing Recipe Creation

```typescript
// Update src/app/recipes/create/page.tsx
import { RecipeChatModal } from "@/features/recipe-chat/components/chat-modal";
import { useRecipeChatStore } from "@/features/recipe-chat/stores/recipe-chat-store";

export default function CreateRecipePage() {
  const { setIsOpen } = useRecipeChatStore();
  
  return (
    <>
      {/* Existing form */}
      <Button onClick={() => setIsOpen(true)}>
        Generate AI Recipe
      </Button>
      <RecipeChatModal />
    </>
  );
}
```

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create feature directory structure at `src/features/recipe-chat/`
- [ ] Implement Zustand store for chat state management
- [ ] Create base modal component using Radix Dialog
- [ ] Set up message type definitions and interfaces

### Phase 2: Core Chat UI
- [ ] Build message list component with proper styling
- [ ] Create message input with keyboard support
- [ ] Implement different message renderers (text vs recipe)
- [ ] Add loading states and animations
- [ ] Ensure dark/light mode compatibility

### Phase 3: AI Integration
- [ ] Implement AI orchestrator function
- [ ] Create server actions for chat processing
- [ ] Add recipe parsing and validation
- [ ] Integrate with OpenAI API using existing patterns

### Phase 4: Recipe Management
- [ ] Build recipe display component within chat
- [ ] Implement save functionality using server actions
- [ ] Add React Query mutations for optimistic updates
- [ ] Handle navigation after successful save
- [ ] Implement background AI image generation
- [ ] Add image upload to Cloudflare integration
- [ ] Update recipe with generated image URL

### Phase 5: Polish & Testing
- [ ] Add comprehensive error handling
- [ ] Implement proper TypeScript types
- [ ] Add accessibility features (ARIA labels, focus management)
- [ ] Test mobile responsiveness
- [ ] Add unit tests for critical functions
- [ ] Test with existing authentication flow

## Key Technical Considerations

### 1. State Management Pattern
- Use Zustand for local UI state (modal open/close, messages)
- Use React Query for server interactions (mutations)
- No need for Context providers - leverage existing providers

### 2. Server Actions vs API Routes
- All data mutations through server actions
- Leverage existing auth patterns in server actions
- Use `revalidatePath` for cache invalidation

### 3. Type Safety
- Utilize Prisma-generated types for Recipe
- Create proper TypeScript interfaces for all components
- Use Zod for runtime validation where needed

### 4. Performance Optimizations
- Implement virtual scrolling for long chat histories
- Debounce user input to prevent excessive API calls
- Use React.memo for message components
- Lazy load the chat modal component

### 5. Integration Points
- Hook into existing recipe creation flow
- Use existing image upload functionality if needed
- Leverage existing recipe parsing utilities
- Integrate with existing user authentication

## Error Handling Strategy

```typescript
// src/features/recipe-chat/lib/error-handler.ts
export class ChatError extends Error {
  constructor(
    message: string,
    public code: "TIMEOUT" | "NETWORK" | "AI_ERROR" | "SAVE_ERROR",
    public userMessage: string
  ) {
    super(message);
  }
}

// Usage in components
try {
  await sendMessage();
} catch (error) {
  if (error instanceof ChatError) {
    toast.error(error.userMessage);
  } else {
    toast.error("An unexpected error occurred");
  }
}
```

## OpenAI Integration Pattern

```typescript
// src/features/recipe-chat/lib/ai-config.ts
import { generateAiRecipeCaller } from "@/lib/functions/open-ai-recipe-gen";

const SYSTEM_PROMPT = `
You are a helpful cooking assistant with these capabilities:

1. Recipe Generation: Create ONE recipe per chat session
2. Recipe Modifications: 
   - Scale servings up or down
   - Substitute ingredients for dietary needs or preferences
   - Adjust cooking methods or techniques
   - Modify for different skill levels
   - Adapt for available equipment
3. Cooking Advice: Answer general cooking questions
4. Context Awareness: Remember the current recipe and all modifications

RULES:
- Only ONE recipe can be created per chat session
- Always return the COMPLETE updated recipe after modifications
- Maintain conversational tone while being helpful
- For recipes, return structured JSON matching this schema:
  {
    title, description, difficulty, prepTime, cookTime, 
    servings, ingredients, instructions, equipment, 
    cuisineType, mealType, dietaryRestrictions, tags
  }
`;

export async function callOpenAI(
  messages: ChatMessage[],
  userMessage: string
) {
  // Transform to OpenAI format
  const openAIMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map(m => ({ 
      role: m.role, 
      content: m.content 
    })),
    { role: "user", content: userMessage }
  ];
  
  // Use existing OpenAI integration patterns
  return await generateAiRecipeCaller(openAIMessages);
}
```

## AI Image Generation Process

```typescript
// src/features/recipe-chat/lib/image-generator.ts
import { generateImage } from "@/lib/functions/ai-image-generation";
import { uploadImageFromUrl } from "@/lib/image-upload/cloudflare-images";

export async function generateAIImage(recipeTitle: string): Promise<string> {
  // Generate prompt based on recipe title
  const prompt = `Professional food photography of ${recipeTitle}, 
    appetizing presentation, natural lighting, high quality, 
    styled for cookbook, shallow depth of field`;
  
  // Call AI image generation (DALL-E or similar)
  const imageUrl = await generateImage(prompt);
  return imageUrl;
}
```

## Summary

This implementation plan provides:
- **Single recipe per session** constraint with clear user messaging
- **Background AI image generation** that doesn't block the save flow
- **Ephemeral chat sessions** that reset on modal close
- **Full AI adaptation** for recipe modifications (scaling, substitutions, etc.)
- **Standard responsive design** without special mobile features

The architecture aligns with your codebase:
- Zustand for UI state management
- Server Actions for all data mutations
- Feature-based file organization
- Radix UI + Tailwind for consistent styling
- React Query for optimistic updates
- Non-blocking background processes for better UX
