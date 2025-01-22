import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ChatComponent from "@/components/ChatComponent";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex h-screen">
      <ChatComponent userId={session.user.id} />
    </div>
  );
}
