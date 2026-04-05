/// <reference types="jest" />

import { z } from "zod";

// ── Schema (same as in the parser module) ──────────────────────────────
const AiParsedIngredient = z.object({
  original_text: z.string(),
  quantity: z.number().min(0).nullable().optional(),
  unit: z.string().nullable().optional(),
  ingredient: z.string().nullable().optional(),
  extra: z.string().nullable().optional(),
});
const AiIngredientSchema = z.object({
  parsedIngredients: z.array(AiParsedIngredient),
});

// ── Inline extractJson (avoids importing anthropic-client in jsdom) ────
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

// ── extractJson helper ─────────────────────────────────────────────────
describe("extractJson", () => {
  it("returns plain JSON unchanged", () => {
    const raw = '{"parsedIngredients":[]}';
    expect(extractJson(raw)).toBe(raw);
  });

  it("strips ```json fences", () => {
    const raw = '```json\n{"parsedIngredients":[]}\n```';
    expect(extractJson(raw)).toBe('{"parsedIngredients":[]}');
  });

  it("strips ``` fences without language tag", () => {
    const raw = '```\n{"parsedIngredients":[]}\n```';
    expect(extractJson(raw)).toBe('{"parsedIngredients":[]}');
  });

  it("handles extra whitespace inside fences", () => {
    const raw = '```json\n  {"key": "value"}  \n```';
    expect(extractJson(raw)).toBe('{"key": "value"}');
  });

  it("handles text before and after fences", () => {
    const raw = 'Here is the JSON:\n```json\n{"key":"val"}\n```\nDone.';
    expect(extractJson(raw)).toBe('{"key":"val"}');
  });
});

// ── Zod schema validation ──────────────────────────────────────────────
describe("AiIngredientSchema validation", () => {
  it("accepts a well-formed ingredient with quantity", () => {
    const data = {
      parsedIngredients: [
        {
          original_text: "3 oz gin",
          quantity: 3,
          unit: "oz",
          ingredient: "gin",
          extra: null,
        },
      ],
    };
    const result = AiIngredientSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parsedIngredients[0].quantity).toBe(3);
    }
  });

  it("accepts null quantity", () => {
    const data = {
      parsedIngredients: [
        {
          original_text: "salt to taste",
          quantity: null,
          unit: null,
          ingredient: "salt",
          extra: "to taste",
        },
      ],
    };
    expect(AiIngredientSchema.safeParse(data).success).toBe(true);
  });

  it("accepts missing (undefined) quantity", () => {
    const data = {
      parsedIngredients: [
        { original_text: "salt to taste", ingredient: "salt", extra: "to taste" },
      ],
    };
    expect(AiIngredientSchema.safeParse(data).success).toBe(true);
  });

  it("rejects negative quantity", () => {
    const data = {
      parsedIngredients: [
        { original_text: "3 oz gin", quantity: -1, unit: "oz", ingredient: "gin", extra: null },
      ],
    };
    expect(AiIngredientSchema.safeParse(data).success).toBe(false);
  });

  it("rejects quantity as string", () => {
    const data = {
      parsedIngredients: [
        { original_text: "3 oz gin", quantity: "3", unit: "oz", ingredient: "gin", extra: null },
      ],
    };
    expect(AiIngredientSchema.safeParse(data).success).toBe(false);
  });
});

// ── Pipeline simulation (extractJson → JSON.parse → Zod) ──────────────
describe("AI response parsing pipeline", () => {
  function simulateParsePipeline(apiResponseText: string) {
    const cleaned = extractJson(apiResponseText);
    const parsedJson = JSON.parse(cleaned);
    const validated = AiIngredientSchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new Error(`Zod validation error: ${validated.error}`);
    }
    return parsedJson.parsedIngredients;
  }

  it("parses '3 oz gin or vodka' with correct quantity and unit", () => {
    const apiResponse = JSON.stringify({
      parsedIngredients: [
        { original_text: "3 oz gin or vodka", quantity: 3, unit: "oz", ingredient: "gin", extra: "or vodka" },
        { original_text: "3 oz gin or vodka", quantity: 3, unit: "oz", ingredient: "vodka", extra: "or gin" },
      ],
    });
    const result = simulateParsePipeline(apiResponse);
    expect(result).toHaveLength(2);
    expect(result[0].quantity).toBe(3);
    expect(result[0].unit).toBe("oz");
    expect(result[1].quantity).toBe(3);
  });

  it("parses '1 oz dry vermouth' with quantity preserved", () => {
    const apiResponse = JSON.stringify({
      parsedIngredients: [
        { original_text: "1 oz dry vermouth (such as Dolin Dry)", quantity: 1, unit: "oz", ingredient: "dry vermouth", extra: "such as Dolin Dry" },
      ],
    });
    const result = simulateParsePipeline(apiResponse);
    expect(result[0].quantity).toBe(1);
    expect(result[0].unit).toBe("oz");
  });

  it("parses '2-3 large green olives' as range (higher number)", () => {
    const apiResponse = JSON.stringify({
      parsedIngredients: [
        { original_text: "2-3 large green olives for garnish", quantity: 3, unit: null, ingredient: "green olives", extra: "large, for garnish, optional: 2-3" },
      ],
    });
    const result = simulateParsePipeline(apiResponse);
    expect(result[0].quantity).toBe(3);
  });

  it("handles markdown code fences around JSON", () => {
    const apiResponse =
      "```json\n" +
      JSON.stringify({
        parsedIngredients: [
          { original_text: "3 oz gin", quantity: 3, unit: "oz", ingredient: "gin", extra: null },
        ],
      }) +
      "\n```";
    const result = simulateParsePipeline(apiResponse);
    expect(result[0].quantity).toBe(3);
  });

  it("validates all dirty martini ingredients have numeric quantities", () => {
    const apiResponse = JSON.stringify({
      parsedIngredients: [
        { original_text: "3 oz gin or vodka", quantity: 3, unit: "oz", ingredient: "gin", extra: "or vodka" },
        { original_text: "3 oz gin or vodka", quantity: 3, unit: "oz", ingredient: "vodka", extra: "or gin" },
        { original_text: "1 oz dry vermouth (such as Dolin Dry)", quantity: 1, unit: "oz", ingredient: "dry vermouth", extra: "such as Dolin Dry" },
        { original_text: "1 oz olive brine", quantity: 1, unit: "oz", ingredient: "olive brine", extra: "from quality green olives" },
        { original_text: "2-3 large green olives for garnish", quantity: 3, unit: null, ingredient: "green olives", extra: "large, for garnish" },
      ],
    });
    const result = simulateParsePipeline(apiResponse);
    expect(result).toHaveLength(5);
    for (const ing of result) {
      expect(typeof ing.quantity).toBe("number");
      expect(ing.quantity).toBeGreaterThan(0);
    }
  });

  it("rejects string quantity (common AI mistake)", () => {
    const apiResponse = JSON.stringify({
      parsedIngredients: [
        { original_text: "3 oz gin", quantity: "3", unit: "oz", ingredient: "gin", extra: null },
      ],
    });
    expect(() => simulateParsePipeline(apiResponse)).toThrow("Zod validation error");
  });

  it("rejects fraction string for quantity", () => {
    const apiResponse = JSON.stringify({
      parsedIngredients: [
        { original_text: "1/2 cup milk", quantity: "1/2", unit: "cup", ingredient: "milk", extra: null },
      ],
    });
    expect(() => simulateParsePipeline(apiResponse)).toThrow("Zod validation error");
  });
});

// ── Live API test: calls Claude to parse dirty martini ingredients ──────
describe("Live Claude API: ingredient parsing", () => {
  // Skip if no API key is set (CI environments)
  const apiKey = process.env.CLAUDE_API_KEY;
  const describeIfApiKey = apiKey ? describe : describe.skip;

  describeIfApiKey("callAiParserForAllIngredientsInBatches", () => {
    // Increase timeout for API calls
    jest.setTimeout(30000);

    let Anthropic: any;
    let callApi: (chunk: string) => Promise<{ parsedIngredients: string }>;

    beforeAll(async () => {
      // jsdom doesn't provide fetch — polyfill it for SDK
      if (typeof globalThis.fetch === "undefined") {
        const nodeFetch = await import("node-fetch");
        (globalThis as any).fetch = nodeFetch.default;
        (globalThis as any).Headers = nodeFetch.Headers;
        (globalThis as any).Request = nodeFetch.Request;
        (globalThis as any).Response = nodeFetch.Response;
      }

      // Direct SDK instantiation to avoid jsdom guard from the module
      const AnthropicSDK = require("@anthropic-ai/sdk").default;
      Anthropic = new AnthropicSDK({
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Reproduce callAiParserForOneChunk with the live client
      callApi = async (chunk: string) => {
        const response = await Anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          temperature: 0,
          system: `
You are an AI that parses ingredient lines into structured JSON.

Rules:
- Output valid JSON only, with no extra keys or commentary.
- "parsedIngredients" is an array of objects. Each object has:
  {
    "original_text": string,
    "quantity": number or null,
    "unit": string or null,
    "ingredient": string or null,
    "extra": string or null
  }

- If a field is unknown, use null.

If a quantity is given as a range (e.g. "1-2 cups"), use the higher number
(2) for "quantity", and put "optional: 1-2 cups" in "extra" property.

Important rules:
1. Split combined ingredients like "salt and pepper" into separate entries.
2. When splitting alternative ingredients (e.g. "X or Y"), each entry
   MUST retain the original quantity and unit.
3. Capture ALL additional info in "extra" (prep instructions, descriptors, size, state).

Do not wrap the output in markdown. Return valid JSON only.
`,
          messages: [
            { role: "user", content: `Ingredients:\n${chunk}` },
          ],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        const parsedJson = JSON.parse(extractJson(text));
        const validated = AiIngredientSchema.safeParse(parsedJson);
        if (!validated.success) {
          throw new Error(`Zod validation error: ${validated.error}`);
        }
        return { parsedIngredients: JSON.stringify(parsedJson.parsedIngredients) };
      };
    });

    it("parses dirty martini ingredients with correct quantities", async () => {
      const input = `3 oz gin or vodka
1 oz dry vermouth (such as Dolin Dry)
1 oz olive brine (from quality green olives like Castelvetrano or Cerignola)
2-3 large green olives for garnish`;

      const result = await callApi(input);
      const parsed = JSON.parse(result.parsedIngredients);

      // Should have at least 4 entries (possibly more if alternatives are split)
      expect(parsed.length).toBeGreaterThanOrEqual(4);

      // Find gin entry and verify it has quantity 3
      const ginEntry = parsed.find((i: any) => i.ingredient?.toLowerCase().includes("gin"));
      expect(ginEntry).toBeDefined();
      expect(ginEntry.quantity).toBe(3);
      expect(ginEntry.unit).toBe("oz");

      // Find vermouth entry
      const vermouthEntry = parsed.find((i: any) => i.ingredient?.toLowerCase().includes("vermouth"));
      expect(vermouthEntry).toBeDefined();
      expect(vermouthEntry.quantity).toBe(1);

      // Find olive brine
      const brineEntry = parsed.find((i: any) => i.ingredient?.toLowerCase().includes("brine"));
      expect(brineEntry).toBeDefined();
      expect(brineEntry.quantity).toBe(1);

      // Find olives for garnish (quantity should be 3 for range 2-3)
      const olivesEntry = parsed.find(
        (i: any) =>
          i.ingredient?.toLowerCase().includes("olive") &&
          i.original_text?.toLowerCase().includes("garnish")
      );
      expect(olivesEntry).toBeDefined();
      expect(olivesEntry.quantity).toBeGreaterThanOrEqual(2);

      // ALL entries should have numeric quantities (not strings, not null for these ingredients)
      for (const ing of parsed) {
        expect(typeof ing.quantity).toBe("number");
        expect(ing.quantity).toBeGreaterThan(0);
      }
    });

    it("parses common baking ingredients correctly", async () => {
      const input = `2 cups all-purpose flour
1/2 cup unsalted butter, softened
3 large eggs
1 1/2 tsp vanilla extract`;

      const result = await callApi(input);
      const parsed = JSON.parse(result.parsedIngredients);

      expect(parsed.length).toBeGreaterThanOrEqual(4);

      const flour = parsed.find((i: any) => i.ingredient?.toLowerCase().includes("flour"));
      expect(flour).toBeDefined();
      expect(flour.quantity).toBe(2);

      const butter = parsed.find((i: any) => i.ingredient?.toLowerCase().includes("butter"));
      expect(butter).toBeDefined();
      expect(butter.quantity).toBe(0.5);

      const eggs = parsed.find((i: any) => i.ingredient?.toLowerCase().includes("egg"));
      expect(eggs).toBeDefined();
      expect(eggs.quantity).toBe(3);

      const vanilla = parsed.find((i: any) => i.ingredient?.toLowerCase().includes("vanilla"));
      expect(vanilla).toBeDefined();
      expect(vanilla.quantity).toBe(1.5);
    });
  });
});

// ── chunkArray ─────────────────────────────────────────────────────────
describe("chunkArray logic", () => {
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  it("chunks 4 items into 1 chunk of 4", () => {
    expect(chunkArray([1, 2, 3, 4], 4)).toEqual([[1, 2, 3, 4]]);
  });

  it("chunks 5 items into 2 chunks (4 + 1)", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 4)).toEqual([[1, 2, 3, 4], [5]]);
  });

  it("handles empty array", () => {
    expect(chunkArray([], 4)).toEqual([]);
  });

  it("handles array smaller than chunk size", () => {
    expect(chunkArray([1, 2], 4)).toEqual([[1, 2]]);
  });
});

// ── AiIngredientSchema.toString() bug detection ───────────────────────
describe("AiIngredientSchema.toString() bug", () => {
  it("produces useless output (model never sees real schema)", () => {
    const output = AiIngredientSchema.toString();
    // Zod .toString() does NOT produce the schema structure.
    // This means `${AiIngredientSchema.toString()}` in the system prompt
    // outputs something like "ZodObject" — not the actual schema.
    expect(output).not.toContain("parsedIngredients");
    expect(output).not.toContain("original_text");
  });
});

// ── splitRecipeString ──────────────────────────────────────────────────
describe("splitRecipeString for dirty martini ingredients", () => {
  function splitRecipeString(recipeString: string): string[] {
    const lines = recipeString.split(/\r?\n/);
    return lines.map((line) => line.trim()).filter((line) => line.length > 0);
  }

  const rawInput = `3 oz gin or vodka
1 oz dry vermouth (such as Dolin Dry)
1 oz olive brine (from quality green olives like Castelvetrano or Cerignola)
2-3 large green olives for garnish`;

  it("splits into 4 lines", () => {
    const lines = splitRecipeString(rawInput);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe("3 oz gin or vodka");
    expect(lines[3]).toBe("2-3 large green olives for garnish");
  });

  it("4 lines fit in a single chunk of size 4", () => {
    const lines = splitRecipeString(rawInput);
    expect(lines.length).toBeLessThanOrEqual(4);
  });
});
