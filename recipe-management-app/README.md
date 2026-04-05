# Get Zesty - Recipe Management App

A full-stack recipe management application with AI-powered features, grocery list management, and cookbook ingestion for RAG-based recipe search.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** + **PostgreSQL** (with pgvector for embeddings)
- **NextAuth.js v5** (Google OAuth + credentials)
- **Tailwind CSS** + **Radix UI**
- **React Query** + **Zustand**
- **Claude API** (recipe extraction, AI generation)
- **OpenAI** (text-embedding-3-small for RAG)

## Getting Started

```bash
npm install
npx prisma migrate dev
npx prisma db push
npm run dev
```

## Cookbook Ingestion Pipeline

Ingest PDF cookbooks into the database so recipes are searchable via MCP tools (semantic + full-text hybrid search).

### Prerequisites

- `CLAUDE_API_KEY` and `OPENAI_API_KEY` in `.env`
- pgvector extension enabled (run `prisma/manual-sql/add_pgvector_cookbook_indexes.sql` after migrations)
- A valid user ID from the database

### Usage

```bash
# Ingest a cookbook
npm run ingest-cookbook -- /path/to/cookbook.pdf --user-id <userId>

# Resume after a failure (skips completed work)
npm run ingest-cookbook -- /path/to/cookbook.pdf --user-id <userId> --resume
```

### How It Works

The pipeline runs 7 stages:

| Stage | What | API |
|-------|------|-----|
| 1 | CLI validation | local |
| 2 | PDF text extraction | pdf-parse v2 |
| 3 | Cookbook metadata | OPF file or Claude Haiku |
| 4 | Recipe boundary detection | Claude Sonnet (5-page windows) |
| 5 | Recipe detail extraction | Claude Sonnet (per recipe) |
| 6 | Database persistence | Prisma |
| 7 | Chunk + embed | OpenAI embeddings + pgvector |

If a `metadata.opf` file (Calibre format) exists alongside the PDF, it's used for structured metadata (title, author, ISBN, etc.) instead of calling Claude.

Each recipe gets 4 embedding chunks: `full`, `description`, `ingredients`, `instructions`.

### Clearing Data (for iterative testing)

```bash
# Via API (requires dev server running)
curl -X DELETE http://localhost:3000/api/mcp/cookbooks/clear \
  -H "X-API-Key: $MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<userId>"}'
```

### Pipeline Tests

```bash
# Unit tests (52 tests, no API keys needed)
npm test -- --testPathPattern="scripts/lib/__tests__"

# Integration test (requires API keys + database)
TEST_PDF_PATH=/path/to/test.pdf TEST_USER_ID=<id> npm test -- --testPathPattern="scripts/__tests__"
```

## Database Seeding

```bash
ts-node-esm prisma/seed.ts
```

## MCP Integration

The app exposes API endpoints consumed by the [Recipe MCP Server](../recipe-mcp/) which provides 15 tools to Claude:

- **Recipe tools** (5): search, get, create, update, delete
- **Grocery tools** (6): list, add, add multiple, update, complete, delete
- **Cookbook tools** (4): list cookbooks, search recipes, get recipe, search by ingredient
