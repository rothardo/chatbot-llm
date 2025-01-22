// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
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

    const formData = await req.formData();
    console.log("formData:", formData);
    const file = formData.get("file") as File;
    console.log("file:", file);
    const chatId = formData.get("chatId") as string;
    console.log("chatId:", chatId);
    // Validate inputs
    if (!file || !chatId) {
      return NextResponse.json(
        { error: "File and chatId are required" },
        { status: 400 }
      );
    }

    // Get chat folder name
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat?.folder) {
      return NextResponse.json(
        { error: "Chat folder not found" },
        { status: 404 }
      );
    }

    // Create folder if it doesn't exist
    const folderPath = join(process.cwd(), "documents", chat.folder);
    await mkdir(folderPath, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(folderPath, file.name);
    await writeFile(filePath, new Uint8Array(buffer));

    // Save file record in database
    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        path: filePath,
        size: buffer.length,
        type: file.type,
        chatId: chatId,
      },
    });

    // Get the base URL for API calls
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "";
    const baseUrl = `${protocol}://${host}`;

    // Trigger embedding creation in the background
    try {
      await fetch(`${baseUrl}/api/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
    } catch (embedError) {
      console.error("Error triggering embeddings:", embedError);
      // Continue execution even if embedding fails
    }

    return NextResponse.json({
      success: true,
      file: fileRecord,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Error uploading file", success: false },
      { status: 500 }
    );
  }
}
