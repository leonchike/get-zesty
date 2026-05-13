/**
 * @jest-environment node
 */

/// <reference types="jest" />

jest.mock("@/lib/prisma-client", () => ({
  __esModule: true,
  default: {
    inventoryItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    inventoryLocation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("@/lib/functions/ai-inventory-classification", () => ({
  classifyInventoryWithAI: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/actions/auth-actions", () => ({
  getUser: jest.fn(),
  redirectToLogin: jest.fn(),
}));

import prisma from "@/lib/prisma-client";
import { classifyInventoryWithAI } from "@/lib/functions/ai-inventory-classification";
import {
  createInventoryItem,
  consumeInventoryItem,
  discardInventoryItem,
  deleteInventoryItemBase,
  updateInventoryItem,
} from "../inventory-actions";

const mockedFindManyLocations = prisma.inventoryLocation
  .findMany as jest.MockedFunction<typeof prisma.inventoryLocation.findMany>;
const mockedFindFirstItem = prisma.inventoryItem
  .findFirst as jest.MockedFunction<typeof prisma.inventoryItem.findFirst>;
const mockedCreateItem = prisma.inventoryItem.create as jest.MockedFunction<
  typeof prisma.inventoryItem.create
>;
const mockedUpdateItem = prisma.inventoryItem.update as jest.MockedFunction<
  typeof prisma.inventoryItem.update
>;
const mockedDeleteItem = prisma.inventoryItem.delete as jest.MockedFunction<
  typeof prisma.inventoryItem.delete
>;
const mockedFindFirstLocation = prisma.inventoryLocation
  .findFirst as jest.MockedFunction<typeof prisma.inventoryLocation.findFirst>;
const mockedClassify = classifyInventoryWithAI as jest.MockedFunction<
  typeof classifyInventoryWithAI
>;

const LOCATIONS = [
  { id: "loc-pantry", name: "Pantry", emoji: "🥫" },
  { id: "loc-fridge", name: "Fridge", emoji: "❄️" },
  { id: "loc-freezer", name: "Freezer", emoji: "🧊" },
  { id: "loc-counter", name: "Counter", emoji: "🍞" },
  { id: "loc-other", name: "Other", emoji: "📦" },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedFindManyLocations.mockResolvedValue(LOCATIONS as any);
});

describe("createInventoryItem", () => {
  it("uses AI-suggested location + shelf-life when none specified", async () => {
    mockedClassify.mockResolvedValue({
      locationName: "Fridge",
      suggestedShelfLifeDays: 14,
    });
    (mockedCreateItem as any).mockImplementation(async ({ data, include }: any) => {
      const baseExpiry = (data as any).expiresAt as Date | null;
      return {
        id: "inv-1",
        name: (data as any).name,
        locationId: (data as any).locationId,
        expiresAt: baseExpiry,
        status: "ACTIVE",
        quantity: (data as any).quantity,
        location: LOCATIONS.find((l) => l.id === (data as any).locationId),
        recipe: null,
      } as any;
    });

    const result = await createInventoryItem(
      { name: "milk" },
      "user-1"
    );

    expect(mockedClassify).toHaveBeenCalledWith("milk", LOCATIONS);
    expect((result as any).locationId).toBe("loc-fridge");
    expect((result as any).expiresAt).toBeInstanceOf(Date);
    const daysUntil = Math.round(
      ((result as any).expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expect(daysUntil).toBeGreaterThanOrEqual(13);
    expect(daysUntil).toBeLessThanOrEqual(15);
  });

  it("falls back to Other when AI classification fails", async () => {
    mockedClassify.mockRejectedValue(new Error("AI down"));
    (mockedCreateItem as any).mockImplementation(async ({ data }: any) => {
      return {
        id: "inv-2",
        name: (data as any).name,
        locationId: (data as any).locationId,
        expiresAt: (data as any).expiresAt,
        status: "ACTIVE",
        location: LOCATIONS.find((l) => l.id === (data as any).locationId),
        recipe: null,
      } as any;
    });

    const result = await createInventoryItem(
      { name: "obscure-item-xyz" },
      "user-1"
    );

    expect((result as any).locationId).toBe("loc-other");
    expect((result as any).expiresAt).toBeNull();
  });

  it("respects an explicit locationId and skips AI", async () => {
    (mockedCreateItem as any).mockImplementation(async ({ data }: any) => ({
      id: "inv-3",
      name: (data as any).name,
      locationId: (data as any).locationId,
      expiresAt: (data as any).expiresAt,
      location: LOCATIONS.find((l) => l.id === (data as any).locationId),
      recipe: null,
    }) as any);

    const result = await createInventoryItem(
      { name: "olive oil", locationId: "loc-pantry" },
      "user-1"
    );

    expect(mockedClassify).not.toHaveBeenCalled();
    expect((result as any).locationId).toBe("loc-pantry");
  });
});

describe("consumeInventoryItem", () => {
  it("decrements quantity when there is more than the decrement value", async () => {
    mockedFindFirstItem.mockResolvedValue({
      id: "inv-1",
      userId: "user-1",
      quantity: 3,
      status: "ACTIVE",
    } as any);
    (mockedUpdateItem as any).mockImplementation(async ({ data }: any) => ({
      id: "inv-1",
      quantity: (data as any).quantity,
      status: (data as any).status ?? "ACTIVE",
    }) as any);

    const result = await consumeInventoryItem("inv-1", "user-1", 1);

    expect((result as any).quantity).toBe(2);
    expect((result as any).status).toBe("ACTIVE");
  });

  it("marks CONSUMED when quantity is at or below the decrement", async () => {
    mockedFindFirstItem.mockResolvedValue({
      id: "inv-1",
      userId: "user-1",
      quantity: 1,
      status: "ACTIVE",
    } as any);
    (mockedUpdateItem as any).mockImplementation(async ({ data }: any) => ({
      id: "inv-1",
      quantity: (data as any).quantity,
      status: (data as any).status,
    }) as any);

    const result = await consumeInventoryItem("inv-1", "user-1", 1);

    expect((result as any).status).toBe("CONSUMED");
    expect((result as any).quantity).toBe(0);
  });

  it("marks CONSUMED when quantity is null (unmeasured items)", async () => {
    mockedFindFirstItem.mockResolvedValue({
      id: "inv-1",
      userId: "user-1",
      quantity: null,
      status: "ACTIVE",
    } as any);
    (mockedUpdateItem as any).mockImplementation(async ({ data }: any) => ({
      id: "inv-1",
      status: (data as any).status,
    }) as any);

    const result = await consumeInventoryItem("inv-1", "user-1", 1);

    expect((result as any).status).toBe("CONSUMED");
  });
});

describe("discardInventoryItem", () => {
  it("marks DISCARDED", async () => {
    mockedFindFirstItem.mockResolvedValue({
      id: "inv-1",
      userId: "user-1",
      quantity: 1,
    } as any);
    (mockedUpdateItem as any).mockImplementation(async ({ data }: any) => ({
      id: "inv-1",
      status: (data as any).status,
    }) as any);

    const result = await discardInventoryItem("inv-1", "user-1");
    expect((result as any).status).toBe("DISCARDED");
  });
});

describe("deleteInventoryItemBase", () => {
  it("throws when item does not belong to the user", async () => {
    mockedFindFirstItem.mockResolvedValue(null);

    await expect(deleteInventoryItemBase("inv-1", "user-2")).rejects.toThrow(
      /not found or does not belong/i
    );
    expect(mockedDeleteItem).not.toHaveBeenCalled();
  });

  it("deletes when the user owns the item", async () => {
    mockedFindFirstItem.mockResolvedValue({
      id: "inv-1",
      userId: "user-1",
    } as any);
    mockedDeleteItem.mockResolvedValue({} as any);

    const result = await deleteInventoryItemBase("inv-1", "user-1");
    expect(result).toEqual({ id: "inv-1" });
    expect(mockedDeleteItem).toHaveBeenCalledWith({ where: { id: "inv-1" } });
  });
});

describe("updateInventoryItem", () => {
  it("rejects a locationId not visible to the user", async () => {
    mockedFindFirstItem.mockResolvedValue({
      id: "inv-1",
      userId: "user-1",
    } as any);
    mockedFindFirstLocation.mockResolvedValue(null);

    await expect(
      updateInventoryItem(
        { id: "inv-1", locationId: "loc-someone-else" },
        "user-1"
      )
    ).rejects.toThrow(/location not found/i);
    expect(mockedUpdateItem).not.toHaveBeenCalled();
  });
});
