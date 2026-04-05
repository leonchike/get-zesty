/**
 * Sentry instrumentation utilities for MCP tools
 */

import * as Sentry from "@sentry/cloudflare";

/**
 * Wrap a tool handler with Sentry instrumentation for tracing and error capture
 */
export function wrapWithSentry<T extends Record<string, any>>(
  toolName: string,
  handler: (args: T) => Promise<any>
): (args: T) => Promise<any> {
  return async (args: T) => {
    const sentryEnabled = typeof Sentry !== "undefined" && Sentry.getCurrentScope;

    if (!sentryEnabled) {
      return handler(args);
    }

    return await Sentry.startNewTrace(async () => {
      return await Sentry.startSpan(
        {
          name: `mcp.tool/${toolName}`,
          op: "function",
          attributes: {
            "mcp.tool.name": toolName,
            ...Object.entries(args).reduce(
              (acc, [key, value]) => {
                acc[`mcp.tool.arg.${key}`] =
                  typeof value === "object" ? JSON.stringify(value) : value;
                return acc;
              },
              {} as Record<string, any>
            ),
          },
        },
        async (span) => {
          try {
            const result = await handler(args);
            span.setStatus({ code: 1 }); // OK
            return result;
          } catch (error) {
            span.setStatus({ code: 2 }); // ERROR
            Sentry.captureException(error);

            const eventId = Sentry.lastEventId();
            const errorMessage = error instanceof Error ? error.message : String(error);

            return {
              content: [
                {
                  type: "text",
                  text: `**Error**\n\n${errorMessage}${eventId ? `\n\nError ID: ${eventId}` : ""}`,
                  isError: true,
                },
              ],
            };
          }
        }
      );
    });
  };
}
