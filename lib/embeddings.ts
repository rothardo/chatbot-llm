import { OllamaEmbeddings } from "./ollama";

export class EmbeddingService {
  private embeddings: OllamaEmbeddings;

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: "mistral",
      baseUrl: "http://localhost:11434",
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.embeddings.embedDocuments(texts);
      return embeddings;
    } catch (error) {
      console.error("Batch embedding generation failed:", error);
      throw error;
    }
  }
}

export const embeddingService = new EmbeddingService();
