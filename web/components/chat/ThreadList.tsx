"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatDateRelative, getInitials } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Plus, Search, Archive, MoreVertical, Pin, Trash2 } from "lucide-react";
import { ThreadWithMessages } from "../../types";

// Props type
export interface ThreadListProps {
  threads: ThreadWithMessages[];
  currentWorkspaceId: string;
  onCreateThread?: () => void;
  onSearch?: (query: string) => void;
}

// Thread item component
export function ThreadItem({
  thread,
  isActive,
  isSelected,
}: {
  thread: ThreadWithMessages;
  isActive: boolean;
  isSelected: boolean;
}) {
  const lastMessage = thread.lastMessage || thread.messages?.[0];
  const isGroup = !!thread.groupId;
  const avatarChar = isGroup 
    ? thread.group?.emoji || "👥"
    : thread.agent?.emoji || "🤖";
  const avatarColor = isGroup 
    ? thread.group?.color || "#FF7A29"
    : thread.agent?.color || "#FF7A29";
  
  const displayName = isGroup 
    ? thread.group?.name || "Grupo"
    : thread.agent?.name || "Agente";
  
  const lastMessageText = lastMessage?.content?.slice(0, 50) || "Nuevo chat";
  const lastMessageTime = lastMessage?.createdAt ? formatDateRelative(lastMessage.createdAt) : "-";
  
  return (
    <Link
      href={`/chat/${thread.id}`}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-savvy-beige/50",
        isSelected && "bg-savvy-orange/10",
        isActive && "bg-savvy-orange/20"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12" style={{ backgroundColor: avatarColor }}>
          <AvatarFallback className="text-lg font-bold text-white">
            {avatarChar}
          </AvatarFallback>
        </Avatar>
        {thread.unreadCount > 0 && (
          <Badge 
            variant="savvy" 
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] p-0.5 flex items-center justify-center text-xs font-bold"
          >
            {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
          </Badge>
        )}
      </div>
      
      {/* Thread info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">
              {displayName}
            </span>
            {thread.pinned && (
              <Pin className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {lastMessageTime}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {lastMessageText}
        </p>
      </div>
    </Link>
  );
}

// Main ThreadList component
export function ThreadList({ threads, currentWorkspaceId, onCreateThread }: ThreadListProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredThreads, setFilteredThreads] = useState(threads);
  
  // Filter threads based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredThreads(threads);
      return;
    }
    
    const filtered = threads.filter((thread) => {
      const displayName = thread.group?.name || thread.agent?.name || "";
      const lastMessage = thread.lastMessage?.content || thread.messages?.[0]?.content || "";
      
      return (
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    
    setFilteredThreads(filtered);
  }, [searchQuery, threads]);
  
  // Get active thread ID from URL
  const activeThreadId = pathname?.split("/")[2];
  
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Chats</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onCreateThread}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Nuevo chat</span>
        </Button>
      </div>
      
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          {filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={activeThreadId === thread.id}
                isSelected={false}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay chats</p>
              <p className="text-sm mt-1">Crea un nuevo chat para empezar</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-2 border-t border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2"
        >
          <Archive className="h-4 w-4" />
          <span>Archivados</span>
        </Button>
      </div>
    </div>
  );
}

export default ThreadList;
