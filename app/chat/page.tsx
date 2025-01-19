// app/chat/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ChatComponent from "@/components/ChatComponent";

export default async function ChatPage() {
  const session = await getServerSession();

  // If not logged in, redirect to sign in
  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex h-screen">
      <ChatComponent userId={session.user.id} />
    </div>
  );
}
