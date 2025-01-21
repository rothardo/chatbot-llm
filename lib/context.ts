import { vectorStore } from "./vectorstore";
import { ollamaService } from "./ollama";

export async function getRelevantContext(query: string): Promise<string> {
  try {
    const similarDocs = await vectorStore.similaritySearch(query, 3, 0.7);
    return similarDocs.map((doc) => doc.content).join("\n\n");
  } catch (error) {
    console.error("Error getting context:", error);
    return "";
  }
}

export async function handleChat(query: string): Promise<string> {
  try {
    const context = await getRelevantContext(query);
    console.log("Context:", context);

    // Use the streaming response but collect it into a single string
    const responseGenerator = await ollamaService.generateStreamingResponse(
      query,
      context
    );

    let fullResponse = "";
    for await (const chunk of responseGenerator) {
      fullResponse += chunk;
    }

    return fullResponse;
  } catch (error) {
    console.error("Error handling chat:", error);
    return "I apologize, but I encountered an error processing your request.";
  }
}

// If you need non-streaming response
export async function handleChatNonStreaming(query: string): Promise<string> {
  try {
    const context = await getRelevantContext(query);
    console.log("Context:", context);

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: `${context}\n\nQuestion: ${query}\n\nAnswer:`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error handling chat:", error);
    return "I apologize, but I encountered an error processing your request.";
  }
}
