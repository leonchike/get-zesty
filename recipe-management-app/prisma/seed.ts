import { PrismaClient, Prisma } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

interface OpenFoodFactsProduct {
  product_name: string;
  categories: string;
}

const sectionMap = new Map([
  ["Alcohol", "clzgiwx0f0000vs1c9ac3zi5n"],
  ["Bakery & Bread", "clzgiwx2v0001vs1c215ntf6u"],
  ["Baking", "clzgiwx4l0002vs1c5s7lc0ux"],
  ["Beverages", "clzgiwx610003vs1cuvzi62om"],
  ["Breakfast & Cereal", "clzgiwx7t0004vs1cr6g5n857"],
  ["Candy", "clzgiwx9g0005vs1c12gxwq2x"],
  ["Coffee", "clzgiwxb50006vs1cu9558ayb"],
  ["Dairy & Eggs", "clzgiwxcs0007vs1c5h86rl2l"],
  ["Deli", "clzgiwxef0008vs1czjojgt5b"],
  ["Fresh Produce", "clzgiwxfy0009vs1cxh1y06jk"],
  ["Frozen", "clzgiwxhi000avs1clpthiu5d"],
  ["Meat & Seafood", "clzgiwxjh000bvs1cah9j5akl"],
  ["Pantry", "clzgiwxky000cvs1cm9kxje86"],
  ["Snacks", "clzgiwxmi000dvs1c04szg333"],
  ["Spices", "clzw65r8v000008ma8lhx8uf9"],
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProducts(
  page: number,
  pageSize: number
): Promise<OpenFoodFactsProduct[]> {
  await sleep(1000); // Wait for 10 seconds before each request
  const response = await axios.get(
    "https://world.openfoodfacts.org/cgi/search.pl",
    {
      params: {
        action: "process",
        sort_by: "unique_scans_n",
        page_size: pageSize,
        page: page,
        json: 1,
        tagtype_0: "languages",
        tag_contains_0: "contains",
        tag_0: "en",
        tagtype_1: "countries",
        tag_contains_1: "contains",
        tag_1: "united-states",
      },
    }
  );
  return response.data.products;
}

function cleanProductName(name: string): string {
  return name
    .split(",")[0]
    .split("-")[0]
    .trim()
    .replace(/\(.*?\)/g, "")
    .replace(/[0-9]+\s*([a-zA-Z]+)$/, "")
    .toLowerCase()
    .trim();
}

function categorizeProduct(categories: string): string {
  const categoryList = categories.toLowerCase().split(",");
  if (
    categoryList.some((cat) =>
      ["fruits", "vegetables", "produce"].includes(cat)
    )
  )
    return "Fresh Produce";
  if (categoryList.some((cat) => ["dairy", "milk", "eggs"].includes(cat)))
    return "Dairy & Eggs";
  if (categoryList.some((cat) => ["meats", "seafood", "fish"].includes(cat)))
    return "Meat & Seafood";
  if (categoryList.some((cat) => ["breads", "bakery"].includes(cat)))
    return "Bakery & Bread";
  if (categoryList.some((cat) => ["frozen"].includes(cat))) return "Frozen";
  if (categoryList.some((cat) => ["beverages", "drinks"].includes(cat)))
    return "Beverages";
  if (categoryList.some((cat) => ["snacks", "chips", "crackers"].includes(cat)))
    return "Snacks";
  if (categoryList.some((cat) => ["breakfast", "cereal"].includes(cat)))
    return "Breakfast & Cereal";
  if (categoryList.some((cat) => ["alcohol", "wine", "beer"].includes(cat)))
    return "Alcohol";
  if (categoryList.some((cat) => ["baking"].includes(cat))) return "Baking";
  if (categoryList.some((cat) => ["candy", "sweets"].includes(cat)))
    return "Candy";
  if (categoryList.some((cat) => ["coffee", "tea"].includes(cat)))
    return "Coffee";
  if (categoryList.some((cat) => ["deli"].includes(cat))) return "Deli";
  if (
    categoryList.some((cat) => ["spices", "herbs", "seasonings"].includes(cat))
  )
    return "Spices";
  return "Pantry";
}

async function populateCommonGroceryItems() {
  const pageSize = 1000;
  let page = 674;
  const processedItems = new Set<string>();
  let batchInserts: Prisma.CommonGroceryItemCreateManyInput[] = [];
  const batchSize = 1000;

  // Tracking variables
  let totalProcessed = 0;
  let skippedNoSection = 0;
  let skippedDuplicate = 0;

  while (true) {
    console.log(`Fetching page ${page}...`);
    const products = await fetchProducts(page, pageSize);
    if (products.length === 0) break;

    for (const product of products) {
      if (!product.product_name) continue;
      totalProcessed++;

      const cleanName = cleanProductName(product.product_name);
      const category = categorizeProduct(product.categories || "");

      // Skip if the category doesn't exist in our sections
      if (!sectionMap.has(category)) {
        skippedNoSection++;
        continue;
      }

      // Avoid duplicates
      if (processedItems.has(cleanName)) {
        skippedDuplicate++;
        continue;
      }

      processedItems.add(cleanName);
      const sectionId = sectionMap.get(category);
      if (sectionId) {
        batchInserts.push({
          name: cleanName,
          sectionId: sectionId,
        });
      }

      // If we've reached the batch size, execute the batch
      if (batchInserts.length >= batchSize) {
        await prisma.commonGroceryItem.createMany({
          data: batchInserts,
          skipDuplicates: true,
        });
        console.log(`Inserted batch of ${batchSize} items`);
        batchInserts = [];
      }
    }

    console.log(`Processed ${processedItems.size} unique items so far.`);
    page++;

    // Stop after processing over 100,000 unique items
    if (processedItems.size >= 1000000) break;
  }

  // Insert any remaining items
  if (batchInserts.length > 0) {
    await prisma.commonGroceryItem.createMany({
      data: batchInserts,
      skipDuplicates: true,
    });
    console.log(`Inserted final batch of ${batchInserts.length} items`);
  }

  // Print summary
  console.log("\nSummary:");
  console.log(`Total records processed: ${totalProcessed}`);
  console.log(
    `Records skipped due to no matching section: ${skippedNoSection}`
  );
  console.log(`Records skipped due to duplicates: ${skippedDuplicate}`);
  console.log(`Total records inserted: ${processedItems.size}`);

  console.log("Finished populating CommonGroceryItem table.");
}

populateCommonGroceryItems()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// async function fetchProducts(
//   page: number,
//   pageSize: number
// ): Promise<OpenFoodFactsProduct[]> {
//   const response = await axios.get(
//     "https://world.openfoodfacts.org/cgi/search.pl",
//     {
//       params: {
//         action: "process",
//         sort_by: "unique_scans_n",
//         page_size: pageSize,
//         page: page,
//         json: 1,
//         tagtype_0: "languages",
//         tag_contains_0: "contains",
//         tag_0: "en",
//         tagtype_1: "countries",
//         tag_contains_1: "contains",
//         tag_1: "united-states",
//       },
//     }
//   );
//   return response.data.products;
// }

// function cleanProductName(name: string): string {
//   return name
//     .split(",")[0]
//     .split("-")[0]
//     .trim()
//     .replace(/\(.*?\)/g, "")
//     .replace(/[0-9]+\s*([a-zA-Z]+)$/, "")
//     .toLowerCase()
//     .trim();
// }

// function categorizeProduct(categories: string): string {
//   const categoryList = categories.toLowerCase().split(",");
//   if (
//     categoryList.some((cat) =>
//       ["fruits", "vegetables", "produce"].includes(cat)
//     )
//   )
//     return "Fresh Produce";
//   if (categoryList.some((cat) => ["dairy", "milk", "eggs"].includes(cat)))
//     return "Dairy & Eggs";
//   if (categoryList.some((cat) => ["meats", "seafood", "fish"].includes(cat)))
//     return "Meat & Seafood";
//   if (categoryList.some((cat) => ["breads", "bakery"].includes(cat)))
//     return "Bakery & Bread";
//   if (categoryList.some((cat) => ["frozen"].includes(cat))) return "Frozen";
//   if (categoryList.some((cat) => ["beverages", "drinks"].includes(cat)))
//     return "Beverages";
//   if (categoryList.some((cat) => ["snacks", "chips", "crackers"].includes(cat)))
//     return "Snacks";
//   if (categoryList.some((cat) => ["breakfast", "cereal"].includes(cat)))
//     return "Breakfast & Cereal";
//   if (categoryList.some((cat) => ["alcohol", "wine", "beer"].includes(cat)))
//     return "Alcohol";
//   if (categoryList.some((cat) => ["baking"].includes(cat))) return "Baking";
//   if (categoryList.some((cat) => ["candy", "sweets"].includes(cat)))
//     return "Candy";
//   if (categoryList.some((cat) => ["coffee", "tea"].includes(cat)))
//     return "Coffee";
//   if (categoryList.some((cat) => ["deli"].includes(cat))) return "Deli";
//   return "Pantry";
// }

// async function populateCommonGroceryItems() {
//   const pageSize = 1000;
//   let page = 1;
//   const processedItems = new Set<string>();
//   let batchInserts: Prisma.CommonGroceryItemCreateManyInput[] = [];
//   const batchSize = 1000;

//   // Tracking variables
//   let totalProcessed = 0;
//   let skippedNoSection = 0;
//   let skippedDuplicate = 0;

//   while (true) {
//     console.log(`Fetching page ${page}...`);
//     const products = await fetchProducts(page, pageSize);
//     if (products.length === 0) break;

//     for (const product of products) {
//       if (!product.product_name) continue;
//       totalProcessed++;

//       const cleanName = cleanProductName(product.product_name.toLowerCase());
//       const category = categorizeProduct(product.categories || "");

//       // Skip if the category doesn't exist in our sections
//       if (!sectionMap.has(category)) {
//         skippedNoSection++;
//         continue;
//       }

//       // Avoid duplicates
//       if (processedItems.has(cleanName)) {
//         skippedDuplicate++;
//         continue;
//       }

//       processedItems.add(cleanName);
//       const sectionId = sectionMap.get(category);
//       if (sectionId) {
//         batchInserts.push({
//           name: cleanName,
//           sectionId: sectionId,
//         });
//       }

//       // If we've reached the batch size, execute the batch
//       if (batchInserts.length >= batchSize) {
//         await prisma.commonGroceryItem.createMany({
//           data: batchInserts,
//           skipDuplicates: true,
//         });
//         console.log(`Inserted batch of ${batchSize} items`);
//         batchInserts = [];
//       }
//     }

//     console.log(`Processed ${processedItems.size} unique items so far.`);
//     page++;

//     // Optional: stop after processing a certain number of unique items
//     if (processedItems.size >= 1000000) break;
//   }

//   // Insert any remaining items
//   if (batchInserts.length > 0) {
//     await prisma.commonGroceryItem.createMany({
//       data: batchInserts,
//       skipDuplicates: true,
//     });
//     console.log(`Inserted final batch of ${batchInserts.length} items`);
//   }

//   // Print summary
//   console.log("\nSummary:");
//   console.log(`Total records processed: ${totalProcessed}`);
//   console.log(
//     `Records skipped due to no matching section: ${skippedNoSection}`
//   );
//   console.log(`Records skipped due to duplicates: ${skippedDuplicate}`);
//   console.log(`Total records inserted: ${processedItems.size}`);

//   console.log("Finished populating CommonGroceryItem table.");
// }

// populateCommonGroceryItems()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
