import { NextRequest, NextResponse } from "next/server";
// import OpenAI from "openai";
// import { zodResponseFormat } from "openai/helpers/zod";
// import { z } from "zod";
// import { PrismaClient } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // await classifyGroceryItems();
    return NextResponse.json({ message: "Script run complete" });
  } catch (error) {
    return NextResponse.json({ message: "Script run failed" }, { status: 500 });
  }
}

// const prisma = new PrismaClient();
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const BATCH_SIZE = 100; // Number of items to process in each batch

// // Define the Zod schema for the grocery item classification
// const GroceryItemClassification = z.object({
//   itemName: z.string(),
//   sectionName: z.string(),
// });

// const GroceryItemBatchClassification = z.object({
//   grocery_classifications: z.array(GroceryItemClassification),
// });

// async function classifyGroceryItems() {
//   // Load all grocery sections into memory
//   const grocerySections = await prisma.grocerySection.findMany();
//   const sectionNames = grocerySections.map((section) => section.name);
//   const sectionMap = new Map(
//     grocerySections.map((section) => [section.name, section.id])
//   );

//   const totalItems = await prisma.commonGroceryItem.count();
//   console.log(`Total items to classify: ${totalItems}`);

//   let processedItems = 0;
//   let totalClassified = 0;

//   while (processedItems < totalItems) {
//     // Fetch batch of items
//     const items = await prisma.commonGroceryItem.findMany({
//       skip: processedItems,
//       take: BATCH_SIZE,
//       select: { id: true, name: true },
//     });

//     const itemNames = items.map((item) => item.name);

//     try {
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content: `You are an expert at classifying grocery items into grocery sections.
//                       Classify each item into one of the following sections: ${sectionNames.join(
//                         ", "
//                       )}.
//                       If an item doesn't fit any section, use "Other".`,
//           },
//           {
//             role: "user",
//             content: `Classify these grocery items: ${itemNames.join(", ")}`,
//           },
//         ],
//         response_format: zodResponseFormat(
//           GroceryItemBatchClassification,
//           "grocery_classifications"
//         ),
//       });

//       const response = completion.choices[0].message;

//       if (response.refusal || !response.content) {
//         console.error("Model refusal:", response.refusal);
//         continue; // Skip this batch and move to the next
//       }

//       const parsedContent = JSON.parse(response.content);
//       const classifications = parsedContent.grocery_classifications;

//       if (classifications && classifications.length > 0) {
//         const updates = classifications
//           .map((classification: { itemName: string; sectionName: string }) => {
//             const item = items.find(
//               (item) => item.name === classification.itemName
//             );
//             const sectionId = sectionMap.get(classification.sectionName);
//             if (item && sectionId) {
//               return prisma.commonGroceryItem.update({
//                 where: { id: item.id },
//                 data: { sectionId: sectionId },
//               });
//             }
//             return null;
//           })
//           .filter(Boolean);

//         // Perform database updates
//         await prisma.$transaction(updates);

//         totalClassified += updates.length;
//         console.log(
//           `Classified and updated ${updates.length} items in this batch.`
//         );
//       } else {
//         console.error(
//           "No classifications returned from the model for this batch"
//         );
//       }
//     } catch (error) {
//       console.error(
//         `Error processing batch starting at offset ${processedItems}:`,
//         error
//       );
//     }

//     processedItems += items.length;
//     console.log(`Processed ${processedItems} out of ${totalItems} items`);
//   }

//   console.log(
//     `Classification complete. Total items classified: ${totalClassified}`
//   );
//   return { totalItems, totalClassified };
// }
