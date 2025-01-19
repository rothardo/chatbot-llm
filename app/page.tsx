// app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession();

  // If not logged in, redirect to sign in
  if (!session) {
    redirect("/signin");
  }

  // If logged in, redirect to chat
  redirect("/chat");
}
