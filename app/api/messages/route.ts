// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { content, chatId, role } = body;

    // Validate required fields
    if (!content || !chatId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        chatId,
        role,
        createdAt: new Date(), // Explicitly set creation time
      },
      // Include any related data you might need
      include: {
        chat: true,
      },
    });

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error("Error saving message:", error);

    // Handle specific error types if needed
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Error saving message", success: false },
      { status: 500 }
    );
  }
}
