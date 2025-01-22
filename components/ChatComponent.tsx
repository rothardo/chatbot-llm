"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggles";
import { ChatMessage } from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

const Header = ({ onNewChat }: { onNewChat: () => void }) => (
  <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 border-b bg-white dark:bg-gray-900 dark:border-gray-800">
    <div className="flex items-center space-x-4">
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-3 py-1 text-sm rounded-md text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200"
      >
        <Plus size={16} />
        New Chat
      </button>
    </div>
    <div className="flex items-center space-x-4">
      <ThemeToggle />
      <button
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
      >
        Sign Out
      </button>
    </div>
  </header>
);

const LoadingIndicator = () => (
  <div className="px-4 py-8 w-full bg-gray-50 dark:bg-gray-800/50">
    <div className="max-w-3xl mx-auto flex items-center space-x-4">
      <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
      <p className="text-gray-500 dark:text-gray-400">AI is thinking...</p>
    </div>
  </div>
);

const MessageInput = ({
  input,
  setInput,
  handleSubmit,
  isLoading,
}: {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) => (
  <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 p-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  </div>
);

export default function ChatComponent({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let assistantMessage: Message = {
        id: Date.now().toString(),
        content: "",
        role: "assistant",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(5);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                assistantMessage.content += parsed.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "I apologize, but I encountered an error. Please try again.",
          role: "assistant",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <Header onNewChat={() => setMessages([])} />
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
