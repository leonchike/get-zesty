import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateExistingUsers() {
  try {
    await prisma.user.updateMany({
      data: {
        isAccountDisabled: false,
      },
    });
    console.log("Successfully updated all users");
  } catch (error) {
    console.error("Error updating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingUsers();
