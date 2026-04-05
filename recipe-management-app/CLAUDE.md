# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
```

### Database
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
npx prisma db push       # Push schema changes without migration
ts-node-esm prisma/seed.ts  # Seed database
```

### Cookbook Ingestion (CLI)
```bash
# Ingest a PDF cookbook
npm run ingest-cookbook -- /path/to/cookbook.pdf --user-id <userId>

# Resume a failed/partial ingestion (skips existing recipes, embeds remaining chunks)
npm run ingest-cookbook -- /path/to/cookbook.pdf --user-id <userId> --resume
```

### Testing
```bash
npm test                           # Run all tests
npm test -- --watch               # Run tests in watch mode
npm test -- path/to/file.test.ts  # Run specific test file
```

## Architecture Overview

### Tech Stack
- **Next.js 14** with App Router for full-stack React framework
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL database
- **NextAuth.js v5** for authentication (Google OAuth + credentials)
- **Zustand** for client-side state management
- **React Query** (TanStack Query) for server state and caching
- **Tailwind CSS** with Radix UI components
- **React Hook Form** with Zod validation
- **Cloudflare Images** for image uploads

### Key Architectural Patterns

1. **Feature-Based Organization**: Each feature in `src/features/` contains:
   - `components/` - React components
   - `actions/` - Server actions for data mutations
   - `hooks/` - Custom React hooks
   - `stores/` - Zustand stores for local state

2. **Authentication Flow**:
   - NextAuth configuration at `src/app/api/auth/[...nextauth]/auth.ts`
   - Middleware protection in `src/middleware.ts`
   - Separate mobile auth endpoints in `/api/mobile-auth/`
   - JWT session strategy with custom session callbacks

3. **Real-Time Updates**:
   - Server-Sent Events (SSE) for grocery list synchronization
   - Implementation in `src/features/groceries/hooks/useSSEGroceryUpdates.ts`
   - Backend SSE endpoint at `/api/grocery-updates`

4. **API Structure**:
   - RESTful routes in `/api/` directory
   - Server Actions for mutations (preferred over API routes)
   - Mobile-specific endpoints prefixed with `/mobile/`
   - AI integrations for recipe generation and parsing

5. **State Management Strategy**:
   - **Zustand**: UI state (modals, forms, local preferences)
   - **React Query**: Server data fetching and caching
   - **Context**: Global providers (auth, query client)
   - **URL State**: Search filters and pagination

6. **Key Features**:
   - **Recipe Management**: CRUD operations, AI generation, web scraping
   - **Grocery Lists**: Real-time collaborative lists with smart categorization
   - **Cooking Experience**: Step-by-step cooking mode with wake lock
   - **Search & Filters**: Advanced filtering with multiple criteria

### Cookbook Ingestion Pipeline

Located in `scripts/`, this CLI pipeline ingests PDF cookbooks into the database for RAG search via MCP tools.

**7-stage pipeline** (`scripts/ingest-cookbook.ts`):
1. CLI validation (file, user, env vars)
2. PDF text extraction (`pdf-parse` v2, per-page)
3. Cookbook metadata (OPF file if available, otherwise Claude Haiku)
4. Recipe boundary detection (Claude Sonnet, 5-page windowed with 2-page overlap, dedup)
5. Recipe detail extraction (Claude Sonnet, per recipe with 3-attempt retry)
6. Database persistence (Prisma: Cookbook + CookbookRecipe records)
7. Chunk + embed (4 chunk types per recipe, batch OpenAI embeddings, pgvector raw SQL)

**Key files:**
- `scripts/lib/pipeline-types.ts` — Zod schemas, constants, `extractJson` utility
- `scripts/lib/pdf-extractor.ts` — PDF to per-page text
- `scripts/lib/cookbook-metadata.ts` — OPF parsing with Claude fallback
- `scripts/lib/recipe-detector.ts` — Windowed boundary detection + dedup
- `scripts/lib/recipe-extractor.ts` — Full recipe extraction per boundary
- `scripts/lib/recipe-persister.ts` — DB persistence with resume support
- `scripts/lib/chunk-embedder.ts` — Chunk creation + batch OpenAI embeddings
- `scripts/lib/rate-limiter.ts` — Token-bucket rate limiter + `pMap` concurrency utility

**Resume behavior** (`--resume` flag):
- Reuses existing Cookbook record (matched by filePath + userId)
- Skips recipes already in DB (case-insensitive title match)
- Only embeds chunks where `embedding IS NULL`

**Dependencies**: `pdf-parse` (v2), `tsx` (script runner). Uses `dotenv` with `override: true` to ensure `.env` values take precedence.

**pgvector setup**: The `embedding vector(1536)` column on RecipeChunk is added via manual SQL at `prisma/manual-sql/add_pgvector_cookbook_indexes.sql` (not in Prisma schema). Must be applied after migrations.

**Admin endpoint**: `DELETE /api/mcp/cookbooks/clear` — clears all cookbook data for a user (cascades to recipes + chunks). Useful for iterative testing.

### Database Schema Highlights
- Users with OAuth and credential authentication support
- Recipes with extensive metadata (nutrition, equipment, difficulty)
- Grocery items organized by sections with AI classification
- Favorites and pinned recipes for personalization
- Recipe sources tracking (user-created, scraped, AI-generated)
- **Cookbooks**: Cookbook → CookbookRecipe → RecipeChunk (with pgvector embeddings for RAG search)

### Development Notes
- Always use Server Actions for data mutations when possible
- Maintain TypeScript strict mode compliance
- Follow existing component patterns in the codebase
- Use the established Zustand store patterns for new features
- Leverage React Query for all data fetching needs
- Test new features with the existing Jest setup