// app/api/create/route.ts
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createPineconeIndex, updatePinecone } from "@/utils";
import { indexName, VECTOR_DIMENSIONS, PINECONE_CONFIG } from "@/config";
import { prisma } from "@/lib/prisma";
import path from "path";

export async function POST(req: Request) {
  try {
    const { chatId } = await req.json();
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Get the chat's folder name from the database
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { folder: true },
    });

    if (!chat?.folder) {
      return NextResponse.json(
        { error: "Chat folder not found" },
        { status: 404 }
      );
    }

    const chatFolderPath = path.join(process.cwd(), "documents", chat.folder);

    const loader = new DirectoryLoader(chatFolderPath, {
      ".txt": (path) => new TextLoader(path),
      ".md": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path),
    });

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
