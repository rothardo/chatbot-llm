// components/ChatComponent.tsx
"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@prisma/client";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { Button } from "./button";
import { ChatSidebar } from "./ChatSidebar";
import { useSession } from "next-auth/react";
import { ChatHeader } from "@/components/chat-header";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  async function createIndexAndEmbeddings() {
    try {
      const result = await fetch("/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: currentChat,
        }),
      });
      const json = await result.json();
      console.log("result: ", json);
      alert("Embeddings created successfully!");
    } catch (err) {
      console.log("err:", err);
      alert("Error creating embeddings");
    }
  }

  async function sendQuery(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;

    setLoading(true);
    setStreamingContent("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input,
          chatId: currentChat,
          role: "user",
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: input,
          createdAt: new Date(),
          chatId: currentChat,
        } as Message,
      ]);

      const response = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          chatId: currentChat,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedContent += chunk;
        setStreamingContent(accumulatedContent);
      }

      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: accumulatedContent,
          chatId: currentChat,
          role: "assistant",
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: accumulatedContent,
          createdAt: new Date(),
          chatId: currentChat,
        } as Message,
      ]);

      setInput("");
    } catch (err) {
      console.log("err:", err);
      alert("Error sending message");
    } finally {
      setLoading(false);
      setStreamingContent("");
    }
  }

  const createNewChat = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      console.log("Chat created:", data);
      setCurrentChat(data.id);
      setShowUpload(true);
      setMessages([]);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Error creating new chat");
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {session?.user?.id && (
        <ChatSidebar
          userId={session.user.id}
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
          onNewChat={createNewChat}
        />
      )}

      <div className="flex-1 flex flex-col">
        <ChatHeader />

        {!currentChat ? (
          <div className="flex-1 flex items-center justify-center">
            <Button
              onClick={createNewChat}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Start New Chat
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role !== "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex-1 max-w-[80%] p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback>
                        {session?.user?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {streamingContent && (
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-[80%] p-4 rounded-lg bg-muted">
                    <p className="text-sm whitespace-pre-wrap">
                      {streamingContent}
                      <span className="animate-pulse">▋</span>
                    </p>
                  </div>
                </div>
              )}

              {loading && !streamingContent && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showUpload && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <input
                    type="file"
                    className="flex-1"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("chatId", currentChat);

                        try {
                          await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });

                          await createIndexAndEmbeddings();
                          setShowUpload(false);
                        } catch (error) {
                          console.error("Error:", error);
                          alert("Error uploading file");
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <form onSubmit={sendQuery} className="p-4 border-t">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 bg-background"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  rightIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
