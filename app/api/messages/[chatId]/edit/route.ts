// app/api/messages/[messageId]/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
export async function PUT(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    const { messageId } = params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true },
    });

    if (!message || message.chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Error updating message" },
      { status: 500 }
    );
  }
}
