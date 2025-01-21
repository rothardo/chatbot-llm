// app/api/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { queryPineconeVectorStoreAndQueryLLM } from "@/utils";
import { indexName, PINECONE_CONFIG } from "@/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const client = new Pinecone(PINECONE_CONFIG);

    const text = await queryPineconeVectorStoreAndQueryLLM(
      client,
      indexName,
      body
    );

    return NextResponse.json({ data: text });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      {
        error: "Failed to process query",
      },
      { status: 500 }
    );
  }
}
