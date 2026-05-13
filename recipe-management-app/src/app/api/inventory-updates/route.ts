import { NextRequest } from "next/server";
import { getUserInventoryAction } from "@/features/inventory/actions/inventory-actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue("retry: 1000\n\n");

      try {
        const initial = await getUserInventoryAction();
        controller.enqueue(`data: ${JSON.stringify(initial)}\n\n`);
      } catch (error) {
        console.error("Error fetching initial inventory:", error);
      }

      const intervalId = setInterval(async () => {
        try {
          const updated = await getUserInventoryAction();
          controller.enqueue(`data: ${JSON.stringify(updated)}\n\n`);
        } catch (error) {
          console.error("Error fetching inventory:", error);
          controller.error(error);
        }
      }, 5000);

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
