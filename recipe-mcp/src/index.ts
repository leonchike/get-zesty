/// <reference types="../worker-configuration.d.ts" />

import * as Sentry from "@sentry/cloudflare";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import type { Props } from "./types/index.js";
import { GoogleHandler } from "./auth/google-handler.js";
import { registerAllTools } from "./tools/register-all-tools.js";

// Sentry configuration helper
function getSentryConfig(env: Env) {
  return {
    dsn: (env as any).SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: (env as any).ENVIRONMENT || "production",
  };
}

export class RecipeMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "Recipe Manager MCP Server",
    version: "1.0.0",
  });

  async cleanup(): Promise<void> {
    try {
      console.log("Recipe MCP cleanup completed successfully");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  async alarm(): Promise<void> {
    await this.cleanup();
  }

  async init() {
    const sentryConfig = getSentryConfig(this.env);
    if (sentryConfig.dsn) {
      console.log("Sentry configured via withSentry wrapper");
      console.log("Sentry environment:", sentryConfig.environment);

      if (this.props) {
        try {
          Sentry.setUser({
            username: this.props.login,
            email: this.props.email,
          });
          console.log("Sentry user context set:", this.props.email);
        } catch (e) {
          console.log("Sentry user context will be set in request handlers");
        }
      }
    } else {
      console.log("Sentry DSN not configured - error tracking disabled");
    }

    // Register all tools
    try {
      registerAllTools(this.server, this.env, this.props);
      console.log("All tools registered successfully (15 tools)");
    } catch (error) {
      console.error("Failed to register tools:", error);
      Sentry.captureException(error);
    }
  }
}

const oauthProvider = new OAuthProvider({
  apiHandlers: {
    "/sse": RecipeMCP.serveSSE("/sse") as any,
    "/mcp": RecipeMCP.serve("/mcp") as any,
  },
  authorizeEndpoint: "/authorize",
  clientRegistrationEndpoint: "/register",
  defaultHandler: GoogleHandler as any,
  tokenEndpoint: "/token",
  accessTokenTTL: 365 * 24 * 60 * 60, // 365 days
});

export default Sentry.withSentry((env: Env) => {
  const sentryConfig = getSentryConfig(env);
  return {
    dsn: sentryConfig.dsn,
    tracesSampleRate: sentryConfig.tracesSampleRate,
    environment: sentryConfig.environment,
    sendDefaultPii: true,
    enableLogs: true,
  };
}, oauthProvider);
