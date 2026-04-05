import anthropic, { extractJson } from "@/lib/anthropic-client";
import prisma from "@/lib/prisma-client";
import { addOrUpdateCommonGroceryItem } from "@/features/groceries/actions/grocery-actions";

export async function classifyItemAsync(itemId: string, itemName: string) {
  try {
    const sectionName = await classifyItemWithAI(itemName);
    if (sectionName) {
      const section = await prisma.grocerySection.findUnique({
        where: { name: sectionName },
      });
      if (section) {
        await prisma.groceryItem.update({
          where: { id: itemId },
          data: { sectionId: section.id },
        });
        // add or update the common grocery item with new section information
        await addOrUpdateCommonGroceryItem(itemName, section.id);
      }
    }
  } catch (error) {
    console.error(`Error classifying item ${itemId}:`, error);
  }
}

export async function classifyItemWithAI(
  itemName: string
): Promise<string | null> {
  try {
    const sections = await prisma.grocerySection.findMany({
      select: { name: true },
    });
    const sectionNames = sections.map((section) => section.name);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: `You are an expert at classifying grocery items into sections.
                    Classify the item into one of the following sections: ${sectionNames.join(
                      ", "
                    )}.
                    If the item doesn't fit any of these sections, return null.
                    Respond with JSON only: {"sectionName": "..."}`,
      messages: [
        { role: "user", content: `Classify this grocery item: ${itemName}` },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    if (text) {
      const parsedClassification = JSON.parse(extractJson(text));
      const classifiedSection = sectionNames.find(
        (name) =>
          name.toLowerCase() === parsedClassification.sectionName.toLowerCase()
      );
      return classifiedSection || null;
    }
    return null;
  } catch (error) {
    console.error("Error classifying item with AI:", error);
    return null;
  }
}
