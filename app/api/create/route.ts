// app/api/create/route.ts
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createPineconeIndex, updatePinecone } from "@/utils";
import { indexName, VECTOR_DIMENSIONS, PINECONE_CONFIG } from "@/config";

export async function POST() {
  const loader = new DirectoryLoader("./documents", {
    ".txt": (path) => new TextLoader(path),
    ".md": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
  });

  try {
    const docs = await loader.load();

    const client = new Pinecone(PINECONE_CONFIG);

    await createPineconeIndex(client, indexName, VECTOR_DIMENSIONS);
    await updatePinecone(client, indexName, docs);

    return NextResponse.json({
      data: "Successfully created index and loaded data into Pinecone",
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      {
        error: "Failed to process documents",
      },
      { status: 500 }
    );
  }
}
