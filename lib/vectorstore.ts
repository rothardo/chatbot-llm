import { PrismaClient } from "@prisma/client";
import { embeddingService } from "./embeddings";

const prisma = new PrismaClient();

export interface DocumentInput {
  content: string;
  metadata?: Record<string, any>;
}

export class VectorStoreService {
  async addDocument(content: string, metadata: Record<string, any> = {}) {
    try {
      const embedding = await embeddingService.generateEmbedding(content);

      return await prisma.$executeRaw`
        INSERT INTO "Document" (
          id,
          content,
          embedding,
          metadata,
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          ${content},
          ${embedding}::vector,
          ${metadata}::jsonb,
          NOW(),
          NOW()
        )
      `;
    } catch (error) {
      console.error("Error storing document:", error);
      throw error;
    }
  }

  async similaritySearch(
    query: string,
    limit: number = 3,
    similarityThreshold: number = 0.7
  ) {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await prisma.$queryRaw`
        SELECT 
          id, 
          content, 
          metadata,
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "Document"
        WHERE 1 - (embedding <=> ${queryEmbedding}::vector) > ${similarityThreshold}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;

      return results as Array<{
        id: string;
        content: string;
        metadata: Record<string, any>;
        similarity: number;
      }>;
    } catch (error) {
      console.error("Error in similarity search:", error);
      throw error;
    }
  }

  async addDocuments(documents: DocumentInput[]) {
    for (const doc of documents) {
      await this.addDocument(doc.content, doc.metadata);
    }
  }
}

export const vectorStore = new VectorStoreService();
