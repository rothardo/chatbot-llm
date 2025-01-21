// utils.ts
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { loadQAStuffChain } from "langchain/chains";
import { Pinecone } from "@pinecone-database/pinecone";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Ollama } from "@langchain/community/llms/ollama";
import { timeout, OLLAMA_CONFIG } from "@/config";

// Initialize embeddings with proper configuration
const embeddings = new OllamaEmbeddings({
  model: OLLAMA_CONFIG.model,
  baseUrl: OLLAMA_CONFIG.baseUrl,
});

// Helper function to clean metadata
const cleanMetadata = (
  metadata: Record<string, any>
): Record<string, string | number | boolean | string[]> => {
  const cleaned: Record<string, string | number | boolean | string[]> = {};

  // Only keep essential metadata fields and ensure correct formats
  if (metadata.source) {
    cleaned.source = String(metadata.source);
  }
  if (metadata.pdf) {
    cleaned.pdf = Boolean(metadata.pdf);
  }
  if (metadata.page) {
    cleaned.page = Number(metadata.page);
  }
  if (metadata.filename) {
    cleaned.filename = String(metadata.filename);
  }

  return cleaned;
};

// Query Pinecone and LLM
export const queryPineconeVectorStoreAndQueryLLM = async (
  client: Pinecone,
  indexName: string,
  question: string
) => {
  console.log("Querying Pinecone vector store...");

  const index = client.index(indexName);

  try {
    // Create query embedding
    const queryEmbedding = await embeddings.embedQuery(question);

    // Query Pinecone
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
    });

    console.log(`Found ${queryResponse.matches.length} matches...`);

    if (queryResponse.matches.length) {
      // Initialize LLM with configuration
      const llm = new Ollama({
        model: OLLAMA_CONFIG.model,
        baseUrl: OLLAMA_CONFIG.baseUrl,
      });

      const chain = loadQAStuffChain(llm);

      const docs = queryResponse.matches.map(
        (match) =>
          new Document({
            pageContent: String(match.metadata?.pageContent || ""),
            metadata: cleanMetadata(match.metadata || {}),
          })
      );

      const result = await chain.call({
        input_documents: docs,
        question: question,
      });

      return result.text;
    } else {
      return "I couldn't find enough relevant information to answer your question.";
    }
  } catch (error) {
    console.error("Error in query:", error);
    throw error;
  }
};

// Create Pinecone Index
export const createPineconeIndex = async (
  client: Pinecone,
  indexName: string,
  vectorDimension: number
) => {
  console.log(`Checking "${indexName}"...`);

  try {
    const existingIndexes = await client.listIndexes();

    const indexExists = existingIndexes.indexes?.find(
      (index) => index.name === indexName
    );

    if (!indexExists) {
      console.log(`Creating "${indexName}"...`);
      await client.createIndex({
        name: indexName,
        dimension: vectorDimension,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });

      console.log(
        `Creating index.... please wait for it to finish initializing.`
      );
      await new Promise((resolve) => setTimeout(resolve, timeout));
    } else {
      console.log(`"${indexName}" already exists.`);
    }
  } catch (error) {
    console.error("Error managing Pinecone index:", error);
    throw error;
  }
};

// Update Pinecone Index
export const updatePinecone = async (
  client: Pinecone,
  indexName: string,
  docs: Document[]
) => {
  console.log("Retrieving Pinecone index...");

  try {
    const index = client.index(indexName);

    for (const doc of docs) {
      console.log(`Processing document: ${doc.metadata.source}`);

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
      });

      const text = String(doc.pageContent);
      const chunks = await textSplitter.createDocuments([text]);
      console.log(`Split into ${chunks.length} chunks`);

      const embeddingsArrays = await embeddings.embedDocuments(
        chunks.map((chunk) => String(chunk.pageContent))
      );

      const records = chunks.map((chunk, i) => ({
        id: `${doc.metadata.source}_${i}_${Date.now()}`,
        values: embeddingsArrays[i],
        metadata: {
          ...cleanMetadata(chunk.metadata),
          pageContent: String(chunk.pageContent),
          source: String(doc.metadata.source),
        },
      }));

      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(
          `Uploaded batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
            records.length / batchSize
          )}`
        );
      }

      console.log(`Added ${chunks.length} vectors to Pinecone`);
    }
  } catch (error) {
    console.error("Error updating Pinecone:", error);
    throw error;
  }
};
