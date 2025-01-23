"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@prisma/client";
import { Bot, User, Send, Loader2, Paperclip, X } from "lucide-react";
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
  const [streamingContent, setStreamingContent] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // Fetch messages when chat is selected
  useEffect(() => {
    async function fetchMessages() {
      if (!currentChat) return;

      setLoadingMessages(true);
      try {
        const response = await fetch(`/api/messages/${currentChat}`);
        if (!response.ok) throw new Error("Failed to fetch messages");

        const data = await response.json();
        setMessages(data.messages);
        setInput(""); // Clear input when switching chats
      } catch (error) {
        console.error("Error fetching messages:", error);
        alert("Error loading chat messages");
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [currentChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

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
      setSelectedFile(null); // Clear the selected file after successful upload
      alert("File processed successfully!");
    } catch (err) {
      console.log("err:", err);
      alert("Error processing file");
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!currentChat) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", currentChat);

    try {
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      await createIndexAndEmbeddings();
    } catch (error) {
      console.error("Error:", error);
      alert("Error uploading file");
      setSelectedFile(null);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) throw new Error("Failed to update message");

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: newContent } : msg
        )
      );

      const message = messages.find((m) => m.id === messageId);
      if (message?.role === "user") {
        await sendQuery(new Event("submit") as any, newContent);
      }
    } catch (error) {
      console.error("Error updating message:", error);
      alert("Error updating message");
    } finally {
      setEditingMessageId(null);
      setEditingContent("");
    }
  };

  async function sendQuery(e: FormEvent, overrideInput?: string) {
    e.preventDefault();
    const queryInput = overrideInput || input;
    if (!queryInput.trim() || !currentChat) return;

    const currentInput = queryInput;
    setInput("");
    setLoading(true);
    setStreamingContent("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentInput,
          chatId: currentChat,
          role: "user",
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: currentInput,
          createdAt: new Date(),
          chatId: currentChat,
        } as Message,
      ]);

      const response = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentInput,
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
    } catch (err) {
      console.error("err:", err);
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
      setCurrentChat(data.id);
      setMessages([]);
      setInput("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Error creating new chat");
    }
  };

  const handleSetCurrentChat = (chatId: string | null) => {
    setCurrentChat(chatId);
    setStreamingContent("");
    setInput("");
    setSelectedFile(null);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {session?.user?.id && (
        <ChatSidebar
          userId={session.user.id}
          currentChat={currentChat}
          setCurrentChat={handleSetCurrentChat}
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
              {loadingMessages ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
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
                        {editingMessageId === message.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleEditMessage(message.id, editingContent);
                            }}
                          >
                            <textarea
                              value={editingContent}
                              onChange={(e) =>
                                setEditingContent(e.target.value)
                              }
                              className="w-full p-2 border rounded"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button type="submit">Save</Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingContent("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        {message.role === "user" && !editingMessageId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditingContent(message.content);
                            }}
                          >
                            Edit
                          </Button>
                        )}
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
                </>
              )}

              {loading && !streamingContent && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendQuery} className="p-4 border-t">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      handleFileUpload(file);
                    }
                  }}
                  className="hidden"
                  accept=".txt,.pdf,.md"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 bg-background"
                  disabled={loading || loadingMessages}
                />
                <Button
                  type="submit"
                  disabled={loading || loadingMessages || !input.trim()}
                  rightIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </div>
              {selectedFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Uploading: {selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
