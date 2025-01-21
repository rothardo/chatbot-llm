export const OLLAMA_BASE_URL = "http://localhost:11434";
export const OLLAMA_MODEL = "mistral";

export const OLLAMA_OPTIONS = {
  baseUrl: OLLAMA_BASE_URL,
  model: OLLAMA_MODEL,
  requestOptions: {
    useMmap: true,
    numThread: 6,
    numGpu: 1,
  },
};