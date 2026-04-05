# RCP-012: OpenAI Embedding Utility

**Status:** `[ ]` Not started
**Phase:** 5 — Cookbook API
**Priority:** P0
**Depends on:** RCP-010

## Summary

Create a reusable utility for generating text embeddings via OpenAI's text-embedding-3-small model. Used by the cookbook search API route and the ingestion pipeline.

## Files to Create

- `recipe-management-app/src/lib/embeddings.ts`

## Implementation Details

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
    dimensions: 1536,
  });
  return response.data.map(d => d.embedding);
}
```

## Notes

- The Next.js app already has `openai` as a dependency (used for recipe generation)
- text-embedding-3-small: 1536 dimensions, good balance of quality/cost
- Batch embedding function useful for ingestion pipeline efficiency

## Acceptance Criteria

- [ ] Single text embedding generation works
- [ ] Batch embedding generation works
- [ ] Returns correct dimensionality (1536)
- [ ] Handles API errors gracefully
