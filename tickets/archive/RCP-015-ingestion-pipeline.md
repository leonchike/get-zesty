# RCP-015: Cookbook Ingestion Pipeline

**Status:** `[ ]` Not started
**Phase:** 7 — Ingestion
**Priority:** P1
**Depends on:** RCP-010, RCP-012

## Summary

Build a standalone Node.js/TypeScript script for processing PDF/ebook cookbooks into structured recipe data with vector embeddings. This is a batch operation run locally or via CI.

## Location

- `recipe-management-app/scripts/ingest-cookbooks/` or dedicated directory TBD

## Pipeline Steps

### 1. File Parsing
- **PDF**: Use `pdf-parse` or `@anthropic-ai/sdk` (Claude Vision) for text extraction
- **EPUB**: Use `epub.js` or `epub2` — EPUBs are zipped HTML with better structure
- Output: Raw text per page/chapter

### 2. Recipe Extraction (LLM-powered)
- Send raw text to Claude/GPT with structured extraction prompt
- Extract per recipe: title, ingredients (with quantities/units), instructions (ordered steps), prep time, cook time, servings, cuisine type, headnotes/tips, page number
- Output: Structured JSON per recipe

### 3. Database Insertion
- Create `Cookbook` record
- Create `CookbookRecipe` records for each extracted recipe
- Create `RecipeChunk` records (full recipe, ingredients-only, instructions-only)

### 4. Embedding Generation
- Generate embeddings for each chunk via OpenAI text-embedding-3-small
- Store embeddings in RecipeChunk.embedding vector column
- Use batch embedding API for efficiency

### 5. Finalization
- Update `Cookbook.isProcessed = true`
- Update `Cookbook.recipeCount`

## CLI Interface

```bash
npx ts-node scripts/ingest-cookbooks/ingest.ts \
  --file ./cookbooks/ottolenghi-simple.pdf \
  --title "Ottolenghi Simple" \
  --author "Yotam Ottolenghi" \
  --year 2018
```

## Considerations

- **Idempotency**: Skip already-processed files based on file hash
- **Cost**: LLM extraction + embedding generation costs per cookbook
- **Quality**: Recipe extraction quality varies by PDF formatting
- **Rate limits**: Batch API calls with appropriate delays

## Acceptance Criteria

- [ ] Successfully processes a sample PDF cookbook
- [ ] Extracts structured recipe data with reasonable accuracy
- [ ] Generates and stores embeddings
- [ ] Database records created correctly
- [ ] Idempotent — re-running doesn't create duplicates
