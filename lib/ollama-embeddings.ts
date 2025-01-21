// lib/ollama-embeddings.ts
import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";

interface OllamaEmbeddingsParams extends EmbeddingsParams {
  baseUrl?: string;
  model?: string;
}

export class OllamaEmbeddings extends Embeddings {
  private apiUrl: string;
  private model: string;

  constructor(config: OllamaEmbeddingsParams = {}) {
    super(config); // Pass the config to the parent class constructor
    this.apiUrl = config.baseUrl || "http://localhost:11434";
    this.model = config.model || "mistral";
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await fetch(`${this.apiUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    const result = await response.json();
    return result.embedding;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map((text) => this.embedQuery(text))
    );
    return embeddings;
  }
}
