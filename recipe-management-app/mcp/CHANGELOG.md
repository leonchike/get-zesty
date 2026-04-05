# Changelog - Recipe Manager MCP Server

All notable changes to this project will be documented in this file.

## [1.0.3] - 2025-10-20

### Added
- **Sentry Error Tracking** 🎯
  - Integrated Sentry SDK for real-time error monitoring
  - Automatic exception capture with context for all 11 tools
  - HTTP error tracking with status codes and response details
  - Custom error context including tool names and parameters
  - Performance monitoring with 100% trace and profile sampling
  - Environment and release tagging for better error organization
  - Graceful fallback to console logging when Sentry disabled

### Changed
- Updated `requirements.txt` to include `sentry-sdk`
- Enhanced error handling across all MCP tools
- Added `capture_exception()` helper function for consistent error reporting
- Updated `.env` with Sentry configuration variables
- Bumped version to 1.0.3 in documentation

### Documentation
- Created comprehensive `SENTRY.md` setup guide
- Updated `README.md` with Sentry configuration instructions
- Added Sentry best practices and troubleshooting guide
- Documented alert configuration and cost considerations

### Fixed
- None (no bugs in this release)

---

## [1.0.2] - 2025-10-20

### Fixed
- **Delete Operations** 🔧
  - Fixed `delete_recipe()` to use `client.request()` instead of `client.delete()`
  - Fixed `delete_grocery_item()` to use `client.request()` instead of `client.delete()`
  - Resolved "AsyncClient.delete() got an unexpected keyword argument" errors

- **Search Array Parameters** 🔍
  - Fixed `search_recipes()` to conditionally include array parameters
  - Only send `cuisine_types` and `meal_types` when they have values
  - Resolved input validation errors with empty arrays

### Documentation
- Created `BUGFIXES.md` with detailed error analysis
- Updated `README.md` to reflect v1.0.2 changes
- Documented httpx DELETE method limitations

---

## [1.0.1] - 2025-10-20

### Fixed
- **Recipe Creation** 🍳
  - Changed recipe `source` from "USER_CREATED" to "USER" to match Prisma enum
  - Resolved PrismaClientValidationError: "Invalid value for argument 'source'"

### Changed
- Updated `create_recipe()` in `main.py` line 281

### Documentation
- Initial `BUGFIXES.md` creation

---

## [1.0.0] - 2025-10-19

### Added - Initial Release
- **11 MCP Tools** for recipe and grocery management
  - Recipe Tools: search, get, create, update, delete
  - Grocery Tools: get list, add, add multiple, update, complete, delete

- **Authentication**
  - API key authentication via X-API-Key header
  - User ID validation
  - Centralized auth helper function

- **AI Features**
  - Recipe ingredient/instruction parsing
  - Grocery item section classification
  - Common items caching for performance

- **Advanced Features**
  - Parallel execution for bulk operations
  - Flexible numeric type handling (int/float/string)
  - Real-time grocery list synchronization
  - Server-Sent Events (SSE) support

- **Documentation**
  - Complete README with setup instructions
  - QUICKSTART guide for 5-minute setup
  - API documentation with Postman examples
  - TEST-GUIDE for comprehensive testing

### Technical Stack
- FastMCP with StreamingHTTP transport
- httpx for async HTTP requests
- python-dotenv for environment configuration
- Type-safe with full type annotations

---

## Version Comparison

| Version | Tools | Bug Fixes | Features | Documentation |
|---------|-------|-----------|----------|---------------|
| 1.0.3   | 11    | 0         | +Sentry  | +SENTRY.md    |
| 1.0.2   | 11    | 3         | 0        | +BUGFIXES.md  |
| 1.0.1   | 11    | 1         | 0        | Updated       |
| 1.0.0   | 11    | -         | All      | Complete      |

---

## Upgrade Guide

### From 1.0.2 to 1.0.3

1. **Install Sentry SDK:**
   ```bash
   cd mcp
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Sentry (Optional):**
   ```env
   # Add to .env
   SENTRY_DSN=your_sentry_dsn_here
   SENTRY_ENVIRONMENT=production
   SENTRY_RELEASE=recipe-manager-mcp@1.0.3
   ```

3. **Restart MCP Server:**
   ```bash
   python main.py
   ```

   Look for: `[MCP Server] Sentry initialized successfully`

### From 1.0.1 to 1.0.2

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Restart MCP Server:**
   - Delete operations now work correctly
   - Search with array filters now works

### From 1.0.0 to 1.0.1

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Restart MCP Server:**
   - Recipe creation now works correctly

---

## Future Roadmap

### v1.1.0 (Planned)
- [ ] Recipe favorite/unfavorite tools
- [ ] Recipe pin/unpin tools
- [ ] Recipe rating tools
- [ ] Grocery list sharing
- [ ] Recipe collections/folders

### v1.2.0 (Planned)
- [ ] Batch recipe operations
- [ ] Advanced search filters (nutrition, equipment)
- [ ] Recipe export (PDF, JSON)
- [ ] Meal planning tools

### v2.0.0 (Future)
- [ ] Multi-user support
- [ ] Real-time collaboration
- [ ] Recipe recommendations
- [ ] Ingredient substitutions
- [ ] Shopping list optimization

---

**Maintained by:** Recipe Manager Team
**License:** MIT
**Repository:** [github.com/your-org/recipe-manager](https://github.com/your-org/recipe-manager)
