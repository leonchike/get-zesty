# AI Recipe Chat Feature Implementation Plan - React Native Expo

## Project Context

- **Framework**: React Native with Expo Router, TypeScript
- **State Management**: Zustand for UI state, React Query for server state
- **UI Components**: React Native components with NativeWind (Tailwind CSS)
- **API Integration**: Axios client with JWT authentication
- **AI Integration**: Backend API with recipe chat endpoints
- **Current State**: Single prompt recipe generation
- **Goal**: Interactive chat for iterative recipe development

## Key Specifications

1. **Single Recipe Per Session**: Users can generate and iterate on ONE recipe per chat session
2. **AI Image Generation**: On save, trigger background process to generate and store recipe image
3. **Ephemeral Sessions**: Chat history is not persisted - closes without saving
4. **Adaptive AI**: Handles all modification requests (scaling, substitutions, dietary changes)
5. **Mobile-First UI**: Optimized for mobile with keyboard handling, safe areas, and touch interactions

## Feature Organization Structure

Following the codebase's feature-based pattern:

```
features/recipe-chat/
├── components/
│   ├── chat-modal.tsx           # Main modal using SheetModalBase
│   ├── message-list.tsx         # Chat message display with FlatList
│   ├── message-input.tsx        # Input with keyboard handling
│   ├── recipe-message.tsx       # Recipe display component
│   └── save-recipe-button.tsx   # Save functionality
├── hooks/
│   ├── use-recipe-chat.ts       # Main chat logic hook
│   └── use-recipe-chat-query.ts # React Query integration
├── stores/
│   └── recipe-chat-store.ts     # Zustand store for chat state
├── actions/
│   └── recipe-actions.ts        # API calls using backend-api
└── lib/
    ├── chat-api.ts              # Chat API integration
    └── recipe-formatter.ts      # Display formatting
```

## Core Requirements

### 1. Chat Modal Implementation (Using SheetModalBase)

Create modal component using established patterns:

```typescript
// features/recipe-chat/components/chat-modal.tsx
import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SheetModalBase } from '@/components/sheet-modal-base';
import { useRecipeChatStore } from '../stores/recipe-chat-store';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';

export function RecipeChatModal() {
  const { isOpen, setIsOpen, clearChat } = useRecipeChatStore();

  const handleClose = () => {
    setIsOpen(false);
    clearChat(); // Reset chat state on close
  };

  return (
    <SheetModalBase
      isVisible={isOpen}
      onClose={handleClose}
      title="AI Recipe Assistant"
      showCloseButton
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <MessageList />
          <MessageInput />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SheetModalBase>
  );
}
```

### 2. Zustand Store for Chat State

```typescript
// features/recipe-chat/stores/recipe-chat-store.ts
import { create } from 'zustand';
import { Recipe } from '@/lib/types';

type MessageType = 'text' | 'recipe';
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: MessageType;
  recipeData?: Partial<Recipe>;
  timestamp: Date;
};

interface RecipeChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentRecipe: Partial<Recipe> | null; // Tracks the single recipe being developed
  hasGeneratedRecipe: boolean; // Prevents multiple recipes per session

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  addUserMessage: (content: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentRecipe: (recipe: Partial<Recipe> | null) => void;
  clearChat: () => void; // Resets all state when modal closes
}

export const useRecipeChatStore = create<RecipeChatState>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
  currentRecipe: null,
  hasGeneratedRecipe: false,

  setIsOpen: (isOpen) => set({ isOpen }),
  
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message],
      currentRecipe: message.recipeData || state.currentRecipe,
      hasGeneratedRecipe: message.type === 'recipe' ? true : state.hasGeneratedRecipe
    })),
  
  addUserMessage: (content) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      type: 'text',
      timestamp: new Date(),
    };
    set((state) => ({ messages: [...state.messages, userMessage] }));
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setCurrentRecipe: (currentRecipe) => set({ currentRecipe }),
  
  clearChat: () => set({
    messages: [],
    isLoading: false,
    error: null,
    currentRecipe: null,
    hasGeneratedRecipe: false,
  }),
}));
```

### 3. Chat API Integration

```typescript
// features/recipe-chat/lib/chat-api.ts
import { backendAPI } from '@/lib/backend-api';
import { ChatMessage } from '../stores/recipe-chat-store';

interface ChatRequest {
  message: string;
  chatHistory: ChatMessage[];
}

interface ChatResponse {
  success: boolean;
  data: {
    type: 'conversation' | 'recipe' | 'recipe-modification';
    content: string;
    recipeData?: any;
  };
}

export async function sendChatMessage({ message, chatHistory }: ChatRequest): Promise<ChatResponse> {
  const response = await backendAPI.post('/api/mobile/recipe-chat', {
    message,
    chatHistory: chatHistory.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      type: msg.type,
      timestamp: msg.timestamp.toISOString(),
    })),
  });

  return response.data;
}

export async function saveRecipeFromChat(recipe: any): Promise<{ success: boolean; data: { id: string } }> {
  const response = await backendAPI.put('/api/mobile/recipe-chat', {
    recipe,
  });

  return response.data;
}
```

### 4. React Query Integration

```typescript
// features/recipe-chat/hooks/use-recipe-chat-query.ts
import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '../lib/chat-api';
import { useRecipeChatStore } from '../stores/recipe-chat-store';

export function useRecipeChat() {
  const { 
    messages, 
    addUserMessage, 
    addMessage, 
    setLoading, 
    setError,
    hasGeneratedRecipe 
  } = useRecipeChatStore();

  const mutation = useMutation({
    mutationFn: (message: string) => {
      addUserMessage(message);
      return sendChatMessage({ message, chatHistory: messages });
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (response) => {
      if (response.success) {
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data.content,
          type: response.data.type === 'recipe' ? 'recipe' : 'text',
          recipeData: response.data.recipeData,
          timestamp: new Date(),
        });
      }
    },
    onError: (error) => {
      setError('Failed to send message. Please try again.');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  return {
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
```

### 5. Message List Component with FlatList

```typescript
// features/recipe-chat/components/message-list.tsx
import React from 'react';
import { FlatList, View, Text } from 'react-native';
import { useRecipeChatStore } from '../stores/recipe-chat-store';
import { RecipeMessage } from './recipe-message';
import { cn } from '@/lib/helpers/cn';

interface MessageItemProps {
  message: ChatMessage;
}

function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  return (
    <View className={cn('mb-4 px-4', isUser ? 'items-end' : 'items-start')}>
      {message.type === 'recipe' ? (
        <RecipeMessage message={message} />
      ) : (
        <View
          className={cn(
            'max-w-[80%] rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary-light dark:bg-primary-dark'
              : 'bg-secondary-light dark:bg-secondary-dark'
          )}
        >
          <Text
            className={cn(
              'text-base',
              isUser
                ? 'text-white'
                : 'text-text-primary-light dark:text-text-primary-dark'
            )}
          >
            {message.content}
          </Text>
        </View>
      )}
    </View>
  );
}

export function MessageList() {
  const { messages, isLoading } = useRecipeChatStore();

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <MessageItem message={item} />
  );

  return (
    <View className="flex-1">
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      />
      {isLoading && (
        <View className="items-center py-4">
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">
            Thinking...
          </Text>
        </View>
      )}
    </View>
  );
}
```

### 6. Recipe Display and Save Component

```typescript
// features/recipe-chat/components/recipe-message.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CustomButton } from '@/components/custom-button';
import { saveRecipeFromChat } from '../lib/chat-api';
import { useRecipeChatStore } from '../stores/recipe-chat-store';
import { useGlobalUIStore } from '@/stores/global-ui-store';

interface RecipeMessageProps {
  message: ChatMessage;
}

export function RecipeMessage({ message }: RecipeMessageProps) {
  const router = useRouter();
  const { setIsOpen, currentRecipe } = useRecipeChatStore();
  const { showToast } = useGlobalUIStore();
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // Check if this is the latest version of the recipe
  const isLatestVersion = message.recipeData?.title === currentRecipe?.title;

  const saveMutation = useMutation({
    mutationFn: () => saveRecipeFromChat(message.recipeData!),
    onSuccess: (response) => {
      setHasBeenSaved(true);
      showToast({
        message: 'Recipe saved! Generating image...',
        type: 'success',
      });
      setTimeout(() => {
        setIsOpen(false);
        router.push(`/recipe/${response.data.id}`);
      }, 1500);
    },
    onError: () => {
      showToast({
        message: 'Failed to save recipe. Please try again.',
        type: 'error',
      });
    },
  });

  const formatRecipe = (recipeData: any) => {
    return (
      <View className="space-y-4">
        <Text className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
          {recipeData.title}
        </Text>
        
        {recipeData.description && (
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">
            {recipeData.description}
          </Text>
        )}

        {/* Recipe metadata */}
        <View className="flex-row flex-wrap gap-2">
          {recipeData.prepTime && (
            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Prep: {recipeData.prepTime}m
            </Text>
          )}
          {recipeData.cookTime && (
            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Cook: {recipeData.cookTime}m
            </Text>
          )}
          {recipeData.servings && (
            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Serves: {recipeData.servings}
            </Text>
          )}
        </View>

        {/* Ingredients */}
        {recipeData.ingredients && (
          <View>
            <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Ingredients
            </Text>
            <Text className="text-text-primary-light dark:text-text-primary-dark">
              {recipeData.ingredients}
            </Text>
          </View>
        )}

        {/* Instructions */}
        {recipeData.instructions && (
          <View>
            <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
              Instructions
            </Text>
            <Text className="text-text-primary-light dark:text-text-primary-dark">
              {recipeData.instructions}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="bg-secondary-light/10 dark:bg-secondary-dark/10 rounded-lg p-4 max-w-[90%]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {formatRecipe(message.recipeData!)}
      </ScrollView>
      
      {isLatestVersion && (
        <CustomButton
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || hasBeenSaved}
          className="mt-4"
          variant="primary"
        >
          {saveMutation.isPending
            ? 'Saving...'
            : hasBeenSaved
            ? 'Saved ✓'
            : 'Save Recipe'}
        </CustomButton>
      )}
    </View>
  );
}
```

### 7. Input Component with Keyboard Support

```typescript
// features/recipe-chat/components/message-input.tsx
import React, { useState } from 'react';
import { View, TextInput, Keyboard } from 'react-native';
import { CustomButton } from '@/components/custom-button';
import { useRecipeChat } from '../hooks/use-recipe-chat-query';
import { cn } from '@/lib/helpers/cn';

export function MessageInput() {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useRecipeChat();

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
      Keyboard.dismiss();
    }
  };

  return (
    <View className="p-4 border-t border-border-light dark:border-border-dark">
      <View className="flex-row items-end space-x-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about recipes or cooking..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          editable={!isLoading}
          className={cn(
            'flex-1 min-h-[40px] max-h-[120px] px-4 py-2 rounded-lg',
            'bg-input-light dark:bg-input-dark',
            'text-text-primary-light dark:text-text-primary-dark',
            'border border-border-light dark:border-border-dark'
          )}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <CustomButton
          onPress={handleSubmit}
          disabled={!input.trim() || isLoading}
          variant="primary"
          size="small"
        >
          Send
        </CustomButton>
      </View>
    </View>
  );
}
```

### 8. Integration with Existing Recipe Creation

```typescript
// Update app/(tabs)/index/recipe/new.tsx or create-edit-recipe components
import { RecipeChatModal } from '@/features/recipe-chat/components/chat-modal';
import { useRecipeChatStore } from '@/features/recipe-chat/stores/recipe-chat-store';

export function CreateRecipeScreen() {
  const { setIsOpen } = useRecipeChatStore();

  return (
    <>
      {/* Existing form components */}
      <CustomButton
        onPress={() => setIsOpen(true)}
        variant="secondary"
        className="mb-4"
      >
        Generate AI Recipe
      </CustomButton>
      
      <RecipeChatModal />
    </>
  );
}
```

### 9. Global Modal Integration

```typescript
// Update context/GlobalModalProvider.tsx to include the chat modal
import { RecipeChatModal } from '@/features/recipe-chat/components/chat-modal';

export function GlobalModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      
      {/* Existing modals */}
      <RecipeChatModal />
    </>
  );
}
```

## Implementation Checklist

### Phase 1: Foundation

- [ ] Create feature directory structure at `features/recipe-chat/`
- [ ] Implement Zustand store for chat state management
- [ ] Create base modal component using SheetModalBase
- [ ] Set up message type definitions and interfaces
- [ ] Implement chat API integration with backend-api pattern

### Phase 2: Core Chat UI

- [ ] Build message list component with FlatList and proper styling
- [ ] Create message input with keyboard handling and auto-dismiss
- [ ] Implement different message renderers (text vs recipe)
- [ ] Add loading states and animations
- [ ] Ensure dark/light mode compatibility with NativeWind
- [ ] Add proper safe area handling for different devices

### Phase 3: Mobile-Specific Features

- [ ] Implement KeyboardAvoidingView for proper keyboard handling
- [ ] Add haptic feedback for button interactions
- [ ] Optimize FlatList performance with proper item rendering
- [ ] Add pull-to-refresh functionality if needed
- [ ] Implement proper focus management for accessibility

### Phase 4: Recipe Management

- [ ] Build recipe display component within chat
- [ ] Implement save functionality using React Query mutations
- [ ] Add optimistic updates for better UX
- [ ] Handle navigation after successful save
- [ ] Add proper error handling and user feedback
- [ ] Integrate with existing recipe creation flow

### Phase 5: Polish & Testing

- [ ] Add comprehensive error handling with proper user messages
- [ ] Implement proper TypeScript types matching existing patterns
- [ ] Add accessibility features (screen reader support, proper focus)
- [ ] Test on different device sizes (phone, tablet)
- [ ] Add proper loading states and skeleton screens
- [ ] Test with existing authentication flow
- [ ] Ensure proper memory management and cleanup

## Key Technical Considerations

### 1. State Management Pattern

- Use Zustand for local UI state (modal open/close, messages, current recipe)
- Use React Query for server interactions with proper error handling
- Follow existing store patterns in the codebase

### 2. API Integration

- All data operations through the centralized backend-api client
- Leverage existing auth patterns and JWT token handling
- Use proper error handling and retry strategies

### 3. Type Safety

- Utilize existing type definitions in lib/types.d.ts
- Create proper TypeScript interfaces following codebase patterns
- Ensure type safety for all API calls and responses

### 4. Performance Optimizations

- Use FlatList for efficient rendering of chat messages
- Implement proper memoization for message components
- Use React Query's built-in caching and background updates
- Optimize keyboard handling to prevent unnecessary re-renders

### 5. Mobile UX Considerations

- Proper keyboard handling with KeyboardAvoidingView
- Haptic feedback for user interactions
- Safe area handling for different device types
- Touch-friendly UI with proper sizing and spacing
- Smooth animations and transitions

### 6. Integration Points

- Hook into existing recipe creation flow in create-edit-recipe feature
- Use existing global modal provider pattern
- Leverage existing authentication and user management
- Follow established navigation patterns with Expo Router

## Error Handling Strategy

```typescript
// features/recipe-chat/lib/error-handler.ts
export class ChatError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK' | 'API_ERROR' | 'SAVE_ERROR' | 'VALIDATION_ERROR',
    public userMessage: string
  ) {
    super(message);
  }
}

// Usage in components with global UI store
try {
  await sendMessage();
} catch (error) {
  const { showToast } = useGlobalUIStore();
  
  if (error instanceof ChatError) {
    showToast({ message: error.userMessage, type: 'error' });
  } else {
    showToast({ message: 'An unexpected error occurred', type: 'error' });
  }
}
```

## Mobile-Specific Implementation Notes

### Keyboard Handling
```typescript
// Proper keyboard handling pattern
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
  {/* Chat content */}
</KeyboardAvoidingView>
```

### Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

// On button press
const handleSend = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  sendMessage(input);
};
```

### Device-Aware Styling
```typescript
import { useDeviceType } from '@/hooks/useDeviceType';

const { isTablet } = useDeviceType();

// Conditional styling based on device
className={cn(
  'p-4',
  isTablet ? 'max-w-3xl mx-auto' : 'max-w-full'
)}
```

## Summary

This implementation plan provides:

- **Single recipe per session** constraint with clear user messaging
- **Background AI image generation** that doesn't block the save flow
- **Ephemeral chat sessions** that reset on modal close
- **Full AI adaptation** for recipe modifications (scaling, substitutions, etc.)
- **Mobile-first design** optimized for touch interactions and various screen sizes

The architecture aligns with your React Native codebase:

- Zustand for UI state management following existing patterns
- React Query for API operations with proper error handling
- Feature-based file organization matching existing structure
- NativeWind for consistent styling with dark/light mode support
- Mobile-optimized UX with proper keyboard handling and haptic feedback
- Integration with existing global modal provider and navigation patterns