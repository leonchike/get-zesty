# Quick Start Guide

Get the Recipe Manager MCP server running in 5 minutes!

## Prerequisites
- Python 3.8+ installed
- Recipe Manager Next.js app running on `http://localhost:3000`
- A valid user account in the database

## Step 1: Install Dependencies

```bash
cd mcp
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 2: Configure Environment

The `.env` file should already be configured with:
- `API_BASE_URL=http://localhost:3000`
- `MCP_API_KEY` (pre-configured)
- `DEFAULT_USER_ID=clzej3dqz0000inntk5x0bqrr`

If you need to use a different user ID, update `DEFAULT_USER_ID` in `.env`.

## Step 3: Start Your Next.js App

In a separate terminal:
```bash
cd /path/to/recipe-management-app
npm run dev
```

## Step 4: Test the MCP Server

Run the server:
```bash
python main.py
```

You should see the server start with StreamingHTTP transport.

## Step 5: Test with Claude Desktop (Optional)

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "recipe-manager": {
      "command": "python",
      "args": ["/absolute/path/to/recipe-management-app/mcp/main.py"],
      "env": {
        "API_BASE_URL": "http://localhost:3000",
        "MCP_API_KEY": "your-mcp-api-key-here",
        "DEFAULT_USER_ID": "clzej3dqz0000inntk5x0bqrr"
      },
      "timeout": 60000
    }
  }
}
```

**Important:** Replace `/absolute/path/to/recipe-management-app/mcp/main.py` with your actual path!

## Example Commands to Try

Once connected via Claude Desktop or Claude Code, try:

1. **Search for recipes:**
   ```
   Search for pasta recipes
   ```

2. **Get recipe details:**
   ```
   Show me the full details of recipe ID: [id from search]
   ```

3. **Add to grocery list:**
   ```
   Add 2 lbs of chicken to my grocery list
   ```

4. **View grocery list:**
   ```
   What's on my grocery list?
   ```

5. **Create a recipe:**
   ```
   Create a new recipe called "Quick Pasta" with ingredients: 1 lb pasta, 2 cups sauce, and instructions: boil pasta, add sauce
   ```

## Troubleshooting

**Server won't start:**
- Check Python version: `python --version` (should be 3.8+)
- Reinstall dependencies: `pip install -r requirements.txt`

**Can't connect to API:**
- Ensure Next.js app is running: `http://localhost:3000`
- Check `.env` has correct `API_BASE_URL`

**Authentication errors:**
- Verify `MCP_API_KEY` matches the key in `recipe-management-app/.env`

**User not found:**
- Get a valid user ID from database: `SELECT id FROM "User" LIMIT 1;`
- Update `DEFAULT_USER_ID` in `.env`

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [API documentation](../src/app/api/mcp/README.md) for endpoint details
- Explore all available tools and their parameters

## Need Help?

- Review the main README.md
- Check the API documentation
- Verify your environment configuration
