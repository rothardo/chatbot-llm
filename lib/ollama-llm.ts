// lib/ollama-llm.ts
import { LLM, BaseLLMParams } from "@langchain/core/language_models/llms";

interface OllamaLLMParams extends BaseLLMParams {
  baseUrl?: string;
  model?: string;
}

export class OllamaLLM extends LLM {
  private apiUrl: string;
  private model: string;

  constructor(config: OllamaLLMParams = {}) {
    super(config); // Pass the config to the parent class constructor
    this.apiUrl = config.baseUrl || "http://localhost:11434";
    this.model = config.model || "mistral";
  }

  _llmType(): string {
    return "ollama";
  }

  async _call(prompt: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
      }),
    });

    const result = await response.json();
    return result.response;
  }
}
