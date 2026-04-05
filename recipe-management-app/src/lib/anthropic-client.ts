import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = global as unknown as { anthropic: Anthropic };

const anthropic =
  globalForAnthropic.anthropic ||
  new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
  });

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropic = anthropic;

export default anthropic;

/**
 * Strip markdown code fences that Claude sometimes wraps around JSON responses.
 */
export function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}
