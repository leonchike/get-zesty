import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const userId = "clzej3dqz0000inntk5x0bqre";

const groceryItems = [
  { name: "Apples", sectionName: "Fresh Produce" },
  { name: "Bread", sectionName: "Bakery" },
  { name: "Chicken", sectionName: "Meat & Seafood" },
  { name: "Milk", sectionName: "Dairy" },
  { name: "Tomatoes", sectionName: "Fresh Produce" },
  { name: "Pasta", sectionName: "Dry Goods" },
  { name: "Cheese", sectionName: "Dairy & Eggs" },
  { name: "Bananas", sectionName: "Fruits" },
  { name: "Cereal", sectionName: "Breakfast" },
  { name: "Eggs", sectionName: "Dairy" },
];

async function main() {
  console.log("Start seeding...");

  for (const item of groceryItems) {
    // Try to find the existing section
    const section = await prisma.grocerySection.findUnique({
      where: { name: item.sectionName },
    });

    // Create the grocery item
    const groceryItem = await prisma.groceryItem.create({
      data: {
        name: item.name,
        userId: userId,
        sectionId: section?.id || null, // Use the section id if found, otherwise null
        quantity: Math.floor(Math.random() * 5) + 1, // Random quantity between 1 and 5
      },
    });

    console.log(
      `Created grocery item: ${groceryItem.name}${
        section ? ` in section ${section.name}` : " (no section)"
      }`
    );
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
