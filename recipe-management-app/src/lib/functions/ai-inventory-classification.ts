import anthropic, { extractJson } from "@/lib/anthropic-client";

export type InventoryClassification = {
  locationName: string | null;
  suggestedShelfLifeDays: number | null;
};

export async function classifyInventoryWithAI(
  itemName: string,
  availableLocations: { name: string }[]
): Promise<InventoryClassification | null> {
  try {
    const locationNames = availableLocations.map((l) => l.name);

    if (locationNames.length === 0) {
      return null;
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `You categorize kitchen items for a household inventory app.
Given an item name, respond with JSON:
{"locationName": "<one of the allowed names>", "suggestedShelfLifeDays": <integer or null>}

Allowed locationName values (use exactly one, matching case): ${locationNames.join(", ")}.

Heuristics:
- Pantry: shelf-stable dry goods and packaged items (pasta, rice, flour, canned goods, oil, vinegar, cereal, snacks).
- Spices: dried herbs, ground spices, seasoning blends, salt, pepper, vanilla extract (anything you'd keep in a small jar on a spice rack).
- Fridge: items needing refrigeration (dairy, deli meats, fresh produce that wilts, opened condiments, leftovers).
- Freezer: items typically frozen (ice cream, frozen vegetables, frozen meats).
- Counter: produce typically left at room temperature (bananas, tomatoes, garlic, onions, bread loaves, avocados).
- Other: only when nothing else fits.

suggestedShelfLifeDays should reflect a typical at-home shelf life:
- Use a small integer (1-30) for perishables (milk ~14, bread ~7, leafy greens ~5).
- Use a larger integer (60-730) for shelf-stable items (pasta ~365, canned ~730).
- Use null for items that don't meaningfully expire at home (salt, sugar, honey, vinegar, oil).

Return ONLY the JSON object. No prose, no markdown.`,
      messages: [
        { role: "user", content: `Classify this kitchen item: ${itemName}` },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    if (!text) return null;

    const parsed = JSON.parse(extractJson(text)) as {
      locationName?: string | null;
      suggestedShelfLifeDays?: number | null;
    };

    const matchedLocation = parsed.locationName
      ? locationNames.find(
          (name) => name.toLowerCase() === parsed.locationName!.toLowerCase()
        ) ?? null
      : null;

    const shelfLife =
      typeof parsed.suggestedShelfLifeDays === "number" &&
      parsed.suggestedShelfLifeDays > 0 &&
      parsed.suggestedShelfLifeDays < 10000
        ? Math.round(parsed.suggestedShelfLifeDays)
        : null;

    return {
      locationName: matchedLocation,
      suggestedShelfLifeDays: shelfLife,
    };
  } catch (error) {
    console.error("Error classifying inventory item with AI:", error);
    return null;
  }
}
