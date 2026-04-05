import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const prisma = new PrismaClient();

async function main() {
  // Fetch all sections and store them in memory
  const sections = await prisma.grocerySection.findMany();
  const sectionMap = new Map(
    sections.map((section) => [section.name, section.id])
  );

  // Read products and seed CommonGroceryItem table
  const processedItems = new Set();
  let batchInserts: Prisma.CommonGroceryItemCreateManyInput[] = [];
  const batchSize = 100000; // Adjust this based on your needs and database limitations

  // Tracking variables
  let totalProcessed = 0;
  let skippedNoDepartment = 0;
  let skippedNoSection = 0;
  let skippedDuplicate = 0;

  await new Promise<void>((resolve) => {
    fs.createReadStream(path.join(__dirname, "walmart_dataset.csv"))
      .pipe(csv({ separator: "," }))
      .on("data", (data) => {
        totalProcessed++;
        const productName = data.PRODUCT_NAME.trim();
        const department = data.DEPARTMENT.trim();

        // Skip if no department or if the department doesn't exist in our sections
        if (!department) {
          skippedNoDepartment++;
          return;
        }
        if (!sectionMap.has(department)) {
          skippedNoSection++;
          return;
        }

        // Avoid duplicates
        const key = `${productName}|${department}`;
        if (processedItems.has(key)) {
          skippedDuplicate++;
          return;
        }

        processedItems.add(key);
        const sectionId = sectionMap.get(department);
        if (sectionId) {
          batchInserts.push({
            name: productName,
            sectionId: sectionId,
          });
        }

        // If we've reached the batch size, execute the batch
        if (batchInserts.length >= batchSize) {
          prisma.commonGroceryItem
            .createMany({
              data: batchInserts,
              skipDuplicates: true,
            })
            .then(() => {
              console.log(`Inserted batch of ${batchSize} items`);
              batchInserts = [];
            })
            .catch(console.error);
        }
      })
      .on("end", async () => {
        // Insert any remaining items
        if (batchInserts.length > 0) {
          await prisma.commonGroceryItem
            .createMany({
              data: batchInserts,
              skipDuplicates: true,
            })
            .catch(console.error);
          console.log(`Inserted final batch of ${batchInserts.length} items`);
        }
        console.log("CommonGroceryItem data insertion completed.");

        // Print summary
        console.log("\nSummary:");
        console.log(`Total records processed: ${totalProcessed}`);
        console.log(
          `Records skipped due to no department: ${skippedNoDepartment}`
        );
        console.log(
          `Records skipped due to no matching section: ${skippedNoSection}`
        );
        console.log(`Records skipped due to duplicates: ${skippedDuplicate}`);
        console.log(`Total records inserted: ${processedItems.size}`);

        resolve();
      });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
