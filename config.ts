// config.ts
export const indexName = "chatbot-llm-index";
export const timeout = 80000;

// Ollama's Mistral model uses 4096 dimensions for embeddings
export const VECTOR_DIMENSIONS = 4096;

export const OLLAMA_CONFIG = {
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: process.env.OLLAMA_MODEL || "mistral",
  requestOptions: {
    useMmap: true,
    numThread: 6,
    numGpu: 1,
  },
};

export const PINECONE_CONFIG = {
  apiKey: process.env.PINECONE_API_KEY!,
};
