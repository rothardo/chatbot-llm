import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vectorStore } from "@/lib/vectorstore";
import { ollamaService } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const { message, userId } = await req.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    // Create chat and user message
    const chat = await prisma.chat.create({
      data: {
        userId,
        messages: {
          create: {
            content: message,
            role: "user",
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process in background
    (async () => {
      try {
        // Get relevant context
        const contextDocs = await vectorStore.similaritySearch(message);
        const context = contextDocs.map((doc) => doc.content).join("\n\n");

        // Generate streaming response
        const responseGenerator = await ollamaService.generateStreamingResponse(
          message,
          context
        );

        let fullResponse = "";
        for await (const chunk of responseGenerator) {
          fullResponse += chunk;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
          );
        }

        // Store complete response
        await prisma.message.create({
          data: {
            content: fullResponse,
            role: "assistant",
            chatId: chat.id,
          },
        });

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("Streaming error:", error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Streaming error occurred" })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
