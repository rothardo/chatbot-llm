import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const user = await getUserSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Here you'll integrate with Ollama
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral",
        prompt: message,
      }),
    });

    const data = await response.json();

    // Store the conversation in the database
    const chat = await prisma.chat.create({
      data: {
        userId: user.id,
        messages: {
          create: [
            {
              content: message,
              role: "user",
            },
            {
              content: data.response,
              role: "assistant",
            },
          ],
        },
      },
    });

    return NextResponse.json({ response: data.response });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}