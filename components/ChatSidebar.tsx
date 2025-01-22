import { useState, useEffect } from "react";
import { Button } from "./button";
import { Plus, MessageSquare } from "lucide-react";
import { Chat } from "@prisma/client";

interface ChatSidebarProps {
  userId: string;
  currentChat: string | null;
  setCurrentChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  userId,
  currentChat,
  setCurrentChat,
  onNewChat,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`/api/chats?userId=${userId}`);
        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [userId]);

  return (
    <div className="w-64 bg-background border-r border-border p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Chats</h2>
        <Button
          onClick={onNewChat}
          size="sm"
          className="w-8 h-8 p-0"
          variant="ghost"
          leftIcon={<Plus className="h-4 w-4" />}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center text-muted-foreground mt-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No chats yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => setCurrentChat(chat.id)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-colors
                  flex items-center space-x-2
                  ${
                    currentChat === chat.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-foreground"
                  }
                `}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="truncate">
                  {chat.name || `Chat ${chat.id.slice(0, 8)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
