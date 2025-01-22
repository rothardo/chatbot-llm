export interface OllamaEmbeddings {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

interface OllamaConfig {
  model: string;
  baseUrl: string;
}

export class OllamaEmbeddings implements OllamaEmbeddings {
  private model: string;
  private baseUrl: string;

  constructor(config: OllamaConfig) {
    this.model = config.model;
    this.baseUrl = config.baseUrl;
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt: text }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedQuery(text)));
  }
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = "http://localhost:11434";
    this.model = "mistral";
  }

  async generateStreamingResponse(
    prompt: string,
    context: string = ""
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: `${context}\n\nQuestion: ${prompt}\n\nAnswer:`,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    async function* streamGenerator() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  yield parsed.response;
                }
              } catch (e) {
                console.error("Error parsing chunk:", e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    return streamGenerator();
  }
}

export const ollamaService = new OllamaService();
