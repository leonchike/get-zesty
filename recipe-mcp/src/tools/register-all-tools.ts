/**
 * Orchestrator — registers all tool groups with the MCP server
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Props } from "../types/index.js";
import { resolveUserId } from "../config/allowed-users.js";
import { registerRecipeTools } from "./register-recipe-tools.js";
import { registerGroceryTools } from "./register-grocery-tools.js";
import { registerCookbookTools } from "./register-cookbook-tools.js";

/**
 * Register all MCP tools (recipe, grocery, cookbook)
 */
export function registerAllTools(server: McpServer, env: Env, props: Props): void {
  // Resolve database user ID from authenticated email
  const userId = resolveUserId(props.email);
  if (!userId) {
    throw new Error(
      `No database user ID configured for ${props.email}. Contact the server administrator.`
    );
  }

  console.log(`User authenticated: ${props.login} (${props.name})`);
  console.log(`Resolved database user ID: ${userId} for ${props.email}`);

  // Register tool groups
  registerRecipeTools(server, env, props, userId);
  console.log("Recipe tools registered (5 tools)");

  registerGroceryTools(server, env, props, userId);
  console.log("Grocery tools registered (6 tools)");

  registerCookbookTools(server, env, props, userId);
  console.log("Cookbook tools registered (4 tools)");
}
