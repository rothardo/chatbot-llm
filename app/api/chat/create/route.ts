// app/api/chat/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create timestamp-based folder name
    const timestamp = Date.now();
    const folderName = `chat_${timestamp}`;

    // Create the directory first
    const dirPath = path.join(process.cwd(), "documents", folderName);
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (fsError) {
      console.error("Error creating directory:", fsError);
      return NextResponse.json(
        { error: "Failed to create chat directory" },
        { status: 500 }
      );
    }

    // Create chat with the same folder name
    const chat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        name: `Chat ${new Date().toLocaleString()}`,
        folder: folderName,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Failed to create chat" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: chat.id, folder: folderName });
  } catch (error) {
    // Proper error handling with type checking
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error creating chat:", errorMessage);

    return NextResponse.json({ error: "Error creating chat" }, { status: 500 });
  }
}
