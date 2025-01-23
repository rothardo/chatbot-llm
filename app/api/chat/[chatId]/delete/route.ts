// app/api/chat/[chatId]/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!params?.chatId) {
      return NextResponse.json({ error: "Chat ID required" }, { status: 400 });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    await prisma.chat.delete({
      where: { id: params.chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting chat:", error.message);
    }
    return NextResponse.json({ error: "Error deleting chat" }, { status: 500 });
  }
}
