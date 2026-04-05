import { NextRequest, NextResponse } from "next/server";
import { generateAiRecipeCaller } from "@/lib/functions/ai-recipe-gen";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await generateAiRecipeCaller(prompt);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating AI recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate AI recipe" },
      { status: 500 }
    );
  }
}

/*
 In terminal run:
 curl -X POST http://localhost:3000/api/gen -H "Content-Type: application/json" -d '{"prompt": "Create a great ribeye recipe"}'
 */
