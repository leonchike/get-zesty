"use server";

import prisma from "@/lib/prisma-client";
import { getUser, redirectToLogin } from "@/lib/actions/auth-actions";
import { classifyItemWithAI } from "@/lib/functions/ai-grocery-classification";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import { withTimeout } from "@/lib/functions/with-timeout";
/**
 * Retrieves the grocery items for the authenticated user.
 *
 * This function performs the following tasks:
 * 1. Authenticates the user, redirecting to login if not authenticated.
 * 2. Fetches grocery items from the database based on the following criteria:
 *    - All active items
 *    - Completed items that were updated within the last 7 days
 * 3. Includes related section and recipe information for each item.
 * 4. Orders the items by creation date, most recent first.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of grocery items.
 * @throws {Error} If there's an issue fetching the grocery items.
 */
export async function getUserGroceriesBase(userId: string) {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const groceries = await prisma.groceryItem.findMany({
      where: {
        userId,
        OR: [
          { status: "ACTIVE" },
          {
            status: "COMPLETED",
            updatedAt: {
              gte: oneWeekAgo,
            },
          },
        ],
      },
      include: {
        section: true,
        recipe: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return groceries;
  } catch (error) {
    console.error("Error getting user groceries:", error);
    throw new Error("Failed to get user groceries");
  }
}

export async function getUserGroceriesAction() {
  const user = await getUser();
  if (!user?.id) return [];
  return getUserGroceriesBase(user.id);
}

export async function getUserGroceriesAPI(token: string) {
  const userId = getUserIdFromJwt(token);
  if (!userId) {
    return { error: "User not found" };
  }
  return getUserGroceriesBase(userId);
}

export async function getUserGroceriesAPITest(userId: string) {
  try {
    const groceries = await prisma.groceryItem.findMany({
      where: {
        userId,
        status: "ACTIVE" || "COMPLETED",
      },
    });

    return groceries;
  } catch (error) {
    console.error("Error getting user groceries API test:", error);
    throw new Error("Failed to get user groceries API test");
  }
}

/*
  Create a grocery item
  - If the item is not found in the common grocery items, classify with AI
  - If the item is found in the common grocery items, use the section from the common grocery item
  - If the item is not found in the common grocery items, classify with AI but with a timeout
*/

export async function createGroceryItem(
  item: {
    name: string;
    quantity: number | null | undefined;
    quantityUnit: string | null | undefined;
    recipeId?: string | null;
  },
  userId: string
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Try to find a common item (exact match)
    let commonItem = await prisma.commonGroceryItem.findFirst({
      where: {
        name: item.name.toLowerCase().trim(),
      },
      include: {
        section: true,
      },
    });

    // If exact match not found, try a partial/contains match
    if (!commonItem) {
      commonItem = await prisma.commonGroceryItem.findFirst({
        where: {
          name: {
            contains: item.name.toLowerCase().trim(),
            mode: "insensitive",
          },
        },
        include: {
          section: true,
        },
      });
    }

    let sectionId: string | undefined;

    // If no common item found, classify with AI
    // If no common item found, classify with AI but with a timeout
    if (!commonItem) {
      let sectionName: string | null = null;

      try {
        // classifyItemWithAI returns a promise that resolves to a string or null. With a timeout of 10 seconds
        sectionName = await withTimeout(classifyItemWithAI(item.name), 10000); // 10 seconds
        console.log("sectionName in AI classification", sectionName);
      } catch (error) {
        console.warn(
          `Classification for '${item.name}' timed out or failed. Proceeding without a section.`
        );
      }

      if (sectionName) {
        // Find the section by name
        const section = await prisma.grocerySection.findUnique({
          where: { name: sectionName },
        });

        if (section) {
          sectionId = section.id;
          // Add or update the common item with this section
          await addOrUpdateCommonGroceryItem(item.name, sectionId);
        }
      }
    } else {
      // Common item found, use its section
      sectionId = commonItem.sectionId || undefined;
    }

    // Prepare the data for creation
    const itemData = {
      ...item,
      userId,
      status: "ACTIVE" as const,
      sectionId: sectionId,
      commonItemId: commonItem?.id,
      quantity: item.quantity !== undefined ? item.quantity : null,
      quantityUnit: item.quantityUnit || null,
      recipeId: item.recipeId || null,
    };

    // Create the new grocery item
    const newGroceryItem = await prisma.groceryItem.create({
      data: itemData,
      include: {
        section: true,
        recipe: true,
      },
    });

    return newGroceryItem;
  } catch (error) {
    console.error("Error creating grocery item:", error);
    throw new Error("Failed to create grocery item");
  }
}

export async function createGroceryItemAction(item: {
  name: string;
  quantity: number | null | undefined;
  quantityUnit: string | null | undefined;
  recipeId?: string | null;
}) {
  const user = await getUser();

  if (!user?.id) return redirectToLogin();

  return createGroceryItem(item, user.id);
}

export async function createGroceryItemAPI(
  token: string,
  item: {
    name: string;
    quantity: number | null | undefined;
    quantityUnit: string | null | undefined;
    recipeId?: string | null;
  }
) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return createGroceryItem(item, userId);
  } catch (error) {
    console.error("Error creating grocery item:", error);
    throw new Error("Failed to create grocery item");
  }
}

export async function updateGroceryItem(
  item: {
    id: string;
    name?: string;
    quantity?: number | null;
    quantityUnit?: string | null;
    status?: "ACTIVE" | "COMPLETED" | "DELETED";
    sectionId?: string | null;
  },
  userId: string
) {
  try {
    // Fetch the existing item to ensure it belongs to the user
    const existingItem = await prisma.groceryItem.findFirst({
      where: {
        id: item.id,
        userId: userId,
      },
    });

    if (!existingItem) {
      throw new Error("Grocery item not found or does not belong to the user");
    }

    // Add or update the common grocery item
    let commonItemId = existingItem.commonItemId;

    // If the section is being updated, update or create the CommonGroceryItem
    if (
      item.sectionId &&
      item.sectionId !== existingItem.sectionId &&
      item.name
    ) {
      const commonItem = await addOrUpdateCommonGroceryItem(
        item.name,
        item.sectionId
      );
      commonItemId = commonItem.id;
    }

    // Update the grocery item
    const updatedGroceryItem = await prisma.groceryItem.update({
      where: { id: item.id },
      data: {
        name: item.name,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        status: item.status,
        sectionId: item.sectionId,
        commonItemId: commonItemId,
      },
      include: {
        section: true,
        recipe: true,
      },
    });

    return updatedGroceryItem;
  } catch (error) {
    console.error("Error updating grocery item:", error);
    throw new Error("Failed to update grocery item");
  }
}

export async function updateGroceryItemAction(item: {
  id: string;
  name?: string;
  quantity?: number | null;
  quantityUnit?: string | null;
  status?: "ACTIVE" | "COMPLETED" | "DELETED";
  sectionId?: string | null;
}) {
  const user = await getUser();

  if (!user?.id) return redirectToLogin();

  return updateGroceryItem(item, user.id);
}

export async function updateGroceryItemAPI(
  token: string,
  item: {
    id: string;
    name?: string;
    quantity?: number | null;
    quantityUnit?: string | null;
    status?: "ACTIVE" | "COMPLETED" | "DELETED";
    sectionId?: string | null;
  }
) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return updateGroceryItem(item, userId);
  } catch (error) {
    console.error("Error updating grocery item:", error);
    throw new Error("Failed to update grocery item");
  }
}

export async function deleteGroceryItemBase(id: string, userId: string) {
  try {
    // Fetch the existing item to ensure it belongs to the user
    const existingItem = await prisma.groceryItem.findFirst({
      where: {
        id: id,
        userId,
      },
    });

    if (!existingItem) {
      throw new Error("Grocery item not found or does not belong to the user");
    }

    // Delete the grocery item
    await prisma.groceryItem.delete({
      where: { id: id },
    });

    return id;
  } catch (error) {
    console.error("Error deleting grocery item:", error);
    throw new Error("Failed to delete grocery item");
  }
}

export async function deleteGroceryItemAction(id: string) {
  const user = await getUser();
  if (!user?.id) return redirectToLogin();
  return deleteGroceryItemBase(id, user.id);
}

export async function deleteGroceryItemAPI(token: string, id: string) {
  const userId = getUserIdFromJwt(token);
  if (!userId) throw new Error("Unauthorized");
  return deleteGroceryItemBase(id, userId);
}

export async function getGrocerySections() {
  try {
    const sections = await prisma.grocerySection.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return sections;
  } catch (error) {
    console.error("Error getting grocery sections:", error);
    throw new Error("Failed to get grocery sections");
  }
}

interface GroceryItemInput {
  name: string;
  quantity: number | null;
  quantityUnit: string | null;
  recipeId: string | null;
}

// Add groceries from recipe

// export async function addGroceriesFromRecipe(
//   items: GroceryItemInput[],
//   userId: string | null
// ) {
//   try {
//     if (!userId) throw new Error("Unauthorized");

//     // 1. Fetch all common grocery items in one query for a quick lookup
//     const itemNames = items.map((item) => item.name.toLowerCase().trim());
//     const commonItems = await prisma.commonGroceryItem.findMany({
//       where: {
//         name: {
//           in: itemNames,
//         },
//       },
//       include: { section: true },
//     });

//     const commonItemMap = new Map(
//       commonItems.map((commonItem) => [
//         commonItem.name.toLowerCase().trim(),
//         commonItem,
//       ])
//     );

//     // 2. For items not found in common items, we need to classify them with AI
//     // We'll build the final array of items to insert
//     const groceryItemsData = [];

//     for (const item of items) {
//       const normalizedName = item.name.toLowerCase().trim();
//       let sectionId: string | undefined;
//       let commonItemId: string | undefined = undefined;

//       const commonItem = commonItemMap.get(normalizedName);

//       if (commonItem) {
//         // Use the existing section from the common item
//         sectionId = commonItem.sectionId || undefined;
//         commonItemId = commonItem.id;
//       } else {
//         // No common item found, try AI classification with a timeout
//         let sectionName: string | null = null;

//         try {
//           sectionName = await withTimeout(classifyItemWithAI(item.name), 10000); // 10 seconds
//         } catch (error) {
//           console.warn(
//             `Classification for '${item.name}' timed out or failed. Proceeding without a section.`
//           );
//         }

//         if (sectionName) {
//           const section = await prisma.grocerySection.findUnique({
//             where: { name: sectionName },
//           });

//           if (section) {
//             sectionId = section.id;
//             // Add or update the common item with this section
//             const newCommon = await addOrUpdateCommonGroceryItem(
//               item.name,
//               section.id
//             );
//             commonItemId = newCommon.id;
//           }
//         }
//       }

//       // Prepare the data for bulk insert
//       groceryItemsData.push({
//         name: item.name,
//         quantity: item.quantity,
//         quantityUnit: item.quantityUnit,
//         userId,
//         recipeId: item.recipeId,
//         sectionId: sectionId,
//         commonItemId: commonItemId,
//         status: "ACTIVE" as const,
//       });
//     }

//     // 3. Perform bulk insert
//     const results = await prisma.groceryItem.createMany({
//       data: groceryItemsData,
//     });

//     console.log(`Successfully added ${results.count} items`);
//     return { success: true, count: results.count };
//   } catch (error) {
//     console.error("Error adding groceries from recipe:", error);
//     return { success: false, error: "Failed to add groceries" };
//   }
// }

export async function addGroceriesFromRecipe(
  items: GroceryItemInput[],
  userId: string | null
) {
  try {
    if (!userId) throw new Error("Unauthorized");

    // 1. Fetch all common grocery items in one query for a quick lookup
    const itemNames = items.map((item) => item.name.toLowerCase().trim());
    const commonItems = await prisma.commonGroceryItem.findMany({
      where: {
        name: {
          in: itemNames,
        },
      },
      include: { section: true },
    });

    const commonItemMap = new Map(
      commonItems.map((commonItem) => [
        commonItem.name.toLowerCase().trim(),
        commonItem,
      ])
    );

    // Separate items into those that need AI classification and those that don't
    const itemsNeedingClassification = items.filter((item) => {
      const normalizedName = item.name.toLowerCase().trim();
      return !commonItemMap.has(normalizedName);
    });

    // 2. Classify items that don't have common items in parallel
    // For each item needing classification, call classifyItemWithAI with a timeout
    const classificationPromises = itemsNeedingClassification.map(
      async (item) => {
        try {
          const sectionName = await withTimeout(
            classifyItemWithAI(item.name),
            10000
          );
          return { item, sectionName };
        } catch (error) {
          console.warn(
            `Classification for '${item.name}' timed out or failed. Proceeding without a section.`
          );
          return { item, sectionName: null };
        }
      }
    );

    const classificationResults = await Promise.all(classificationPromises);

    // 3. For items that got a sectionName, fetch the section and possibly add/update a common item
    // We'll also run these requests in parallel
    const sectionFetchPromises = classificationResults.map(async (result) => {
      const { item, sectionName } = result;
      let sectionId: string | undefined;
      let commonItemId: string | undefined;

      if (sectionName) {
        const section = await prisma.grocerySection.findUnique({
          where: { name: sectionName },
        });
        if (section) {
          sectionId = section.id;
          const newCommon = await addOrUpdateCommonGroceryItem(
            item.name,
            section.id
          );
          commonItemId = newCommon.id;
        }
      }

      return { item, sectionId, commonItemId };
    });

    const sectionResults = await Promise.all(sectionFetchPromises);

    // 4. Construct a map of itemName -> {sectionId, commonItemId} for items that were classified
    const classifiedMap = new Map(
      sectionResults.map((res) => [
        res.item.name.toLowerCase().trim(),
        { sectionId: res.sectionId, commonItemId: res.commonItemId },
      ])
    );

    // 5. Now build the final array of items to insert
    const groceryItemsData = items.map((item) => {
      const normalizedName = item.name.toLowerCase().trim();
      const commonItem = commonItemMap.get(normalizedName);

      let sectionId: string | undefined;
      let commonItemId: string | undefined;

      if (commonItem) {
        // Item was found in commonItems
        sectionId = commonItem.sectionId || undefined;
        commonItemId = commonItem.id;
      } else {
        // Item needed classification - check the classifiedMap
        const classifiedData = classifiedMap.get(normalizedName);
        if (classifiedData) {
          sectionId = classifiedData.sectionId;
          commonItemId = classifiedData.commonItemId;
        }
      }

      return {
        name: item.name,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        userId,
        recipeId: item.recipeId,
        sectionId,
        commonItemId,
        status: "ACTIVE" as const,
      };
    });

    // 6. Perform bulk insert
    const results = await prisma.groceryItem.createMany({
      data: groceryItemsData,
    });

    console.log(`Successfully added ${results.count} items`);
    return { success: true, count: results.count };
  } catch (error) {
    console.error("Error adding groceries from recipe:", error);
    return { success: false, error: "Failed to add groceries" };
  }
}

export async function addGroceriesFromRecipeAction(items: GroceryItemInput[]) {
  const user = await getUser();
  const userId = user?.id ?? null;
  return addGroceriesFromRecipe(items, userId);
}

export async function addGroceriesFromRecipeAPI(
  token: string,
  items: GroceryItemInput[]
) {
  try {
    const userId = getUserIdFromJwt(token);
    if (!userId) throw new Error("Unauthorized");
    return addGroceriesFromRecipe(items, userId);
  } catch (error) {
    console.error("Error adding groceries from recipe:", error);
    return { success: false, error: "Failed to add groceries" };
  }
}

// Add or update common grocery item

export async function addOrUpdateCommonGroceryItem(
  name: string,
  sectionId: string
) {
  const normalizedName = name.toLowerCase().trim();

  const existingItem = await prisma.commonGroceryItem.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (existingItem) {
    return prisma.commonGroceryItem.update({
      where: { id: existingItem.id },
      data: { sectionId, isUserCreated: true },
    });
  } else {
    return prisma.commonGroceryItem.create({
      data: {
        name: normalizedName,
        sectionId,
        isUserCreated: true,
      },
    });
  }
}
