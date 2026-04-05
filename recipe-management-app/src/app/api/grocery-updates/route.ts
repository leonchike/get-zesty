// app/api/grocery-updates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserGroceriesAction } from "@/features/groceries/actions/grocery-actions";

export const dynamic = "force-dynamic";

export const runtime = "nodejs"; // or 'edge', depending on your needs

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue("retry: 1000\n\n");

      // Send initial groceries
      const initialGroceries = await getUserGroceriesAction();
      controller.enqueue(`data: ${JSON.stringify(initialGroceries)}\n\n`);

      // Set up interval to check for updates
      const intervalId = setInterval(async () => {
        try {
          const updatedGroceries = await getUserGroceriesAction();
          controller.enqueue(`data: ${JSON.stringify(updatedGroceries)}\n\n`);
        } catch (error) {
          console.error("Error fetching groceries:", error);
          controller.error(error);
        }
      }, 5000); // Check every 5 seconds

      // Clean up the interval when the connection is closed
      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
