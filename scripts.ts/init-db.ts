// scripts/init-db.ts
import { prisma } from "../lib/prisma";
import { storeDocument } from "../lib/vectorstore";

async function initDB() {
  const documents = ["Sample document 1", "Sample document 2"];

  for (const doc of documents) {
    await storeDocument(doc);
  }
}

initDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
