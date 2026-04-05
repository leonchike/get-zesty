import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "../actions/recipe-chat-actions";
import { useRecipeChatStore } from "../stores/recipe-chat-store";

export function useRecipeChat() {
  const { messages, addMessage, setLoading, setError } = useRecipeChatStore();
  
  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(message, messages),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        addMessage({
          id: Date.now().toString(),
          role: "assistant",
          content: response.data.content,
          type: response.data.type === "recipe" || response.data.type === "recipe-modification" ? "recipe" : "text",
          recipeData: response.data.recipeData,
          timestamp: new Date(),
        });
      } else {
        setError(response.error || "Failed to get response");
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setError("Failed to send message. Please try again.");
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  return mutation;
}