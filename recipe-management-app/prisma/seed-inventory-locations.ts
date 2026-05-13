import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_LOCATIONS = [
  { name: "Pantry", emoji: "🥫", sortOrder: 0 },
  { name: "Spices", emoji: "🧂", sortOrder: 1 },
  { name: "Fridge", emoji: "❄️", sortOrder: 2 },
  { name: "Freezer", emoji: "🧊", sortOrder: 3 },
  { name: "Counter", emoji: "🍞", sortOrder: 4 },
  { name: "Other", emoji: "📦", sortOrder: 5 },
];

async function seedInventoryLocations() {
  for (const location of DEFAULT_LOCATIONS) {
    const existing = await prisma.inventoryLocation.findFirst({
      where: { name: location.name, userId: null },
    });

    if (existing) {
      await prisma.inventoryLocation.update({
        where: { id: existing.id },
        data: {
          emoji: location.emoji,
          sortOrder: location.sortOrder,
          isUserCreated: false,
        },
      });
      console.log(`Updated global location: ${location.name}`);
    } else {
      await prisma.inventoryLocation.create({
        data: {
          name: location.name,
          emoji: location.emoji,
          sortOrder: location.sortOrder,
          isUserCreated: false,
          userId: null,
        },
      });
      console.log(`Created global location: ${location.name}`);
    }
  }
}

seedInventoryLocations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
