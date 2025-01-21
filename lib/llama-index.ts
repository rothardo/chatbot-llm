import { VectorStoreIndex, SimpleDirectoryReader, ServiceContext, Document } from "llamaindex/core";
import { PGVectorStore } from "llamaindex/postgressql";
import { pool } from "./db-config";

export class LlamaIndexService {
  private vectorStore: PGVectorStore;
  private serviceContext: ServiceContext;

  constructor() {
    this.vectorStore = new PGVectorStore({
      pool,
      tableName: "Document",
      embeddingDimension: 384,
    });

    this.serviceContext = ServiceContext.fromDefaults({
      embedModel: {
        modelType: "local",
        modelPath: "http://localhost:11434/api/embeddings",
      },
      llm: {
        model: "mistral",
        baseURL: "http://localhost:11434/api",
      },
    });
  }

  async addDocuments(docs: Document[]): Promise<void> {
    const index = await VectorStoreIndex.fromDocuments(docs, {
      vectorStore: this.vectorStore,
      serviceContext: this.serviceContext,
    });
    await index.insert(docs);
  }

  async queryDocuments(query: string): Promise<string> {
    const index = await VectorStoreIndex.fromVectorStore(
      this.vectorStore,
      this.serviceContext
    );
    
    const queryEngine = index.asQueryEngine();
    const response = await queryEngine.query(query);
    return response.response;
  }

  async streamingQuery(query: string): AsyncGenerator<string> {
    const index = await VectorStoreIndex.fromVectorStore(
      this.vectorStore,
      this.serviceContext
    );
    
    const queryEngine = index.asQueryEngine({
      streaming: true,
    });
    
    const response = await queryEngine.query(query);
    return response.responseGenerator;
  }
}