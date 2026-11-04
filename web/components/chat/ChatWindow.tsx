"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { ChevronLeft, MoreVertical, RefreshCw, AlertCircle } from "lucide-react";
import { Thread, Message, Agent, Group, Approval } from "../../types";

// Chat window props
export interface ChatWindowProps {
  thread: Thread;
  messages: Message[];
  agent?: Agent;
  group?: Group;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isLoading: boolean;
  isStreaming: boolean;
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  onApproval: (approvalId: string, decision: "approved" | "rejected", reason?: string) => Promise<void>;
  onClose?: () => void;
  onRefresh?: () => void;
  className?: string;
}

// Empty state component
function EmptyState({
  agent,
  group,
  onNewMessage,
}: {
  agent?: Agent;
  group?: Group;
  onNewMessage?: () => void;
}) {
  const isGroup = !!group;
  const displayName = isGroup ? group?.name || "Grupo" : agent?.name || "Agente";
  const emoji = isGroup ? group?.emoji || "🌅" : agent?.emoji || "🤖";
  const description = isGroup 
    ? group?.description || "Chat de grupo con múltiples agentes"
    : agent?.role || "Agente de IA personalizado";

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{displayName}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button variant="savvy" onClick={onNewMessage}>
        Enviar primer mensaje
      </Button>
    </div>
  );
}

// Typing indicator for agent
function AgentTypingIndicator({ agent }: { agent?: Agent }) {
  const agentName = agent?.name || "Agente";

  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <div className="flex gap-1">
        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm text-muted-foreground">{agentName} está escribiendo...</span>
    </div>
  );
}

// Chat header component
function ChatHeader({
  thread,
  agent,
  group,
  isLoading,
  onClose,
  onRefresh,
}: {
  thread: Thread;
  agent?: Agent;
  group?: Group;
  isLoading: boolean;
  onClose?: () => void;
  onRefresh?: () => void;
}) {
  const isGroup = !!group;
  const displayName = isGroup ? group?.name || "Grupo" : agent?.name || "Agente";
  const emoji = isGroup ? group?.emoji || "🌅" : agent?.emoji || "🤖";
  const status = agent?.status || "active";

  const statusConfig = {
    active: { label: "En línea", color: "text-green-600" },
    paused: { label: "Pausado", color: "text-orange-600" },
    error: { label: "Error", color: "text-red-600" },
    working: { label: "Trabajando", color: "text-blue-600" },
  };

  const agentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-foreground">{displayName}</h3>
            {isGroup ? (
              <p className="text-xs text-muted-foreground">
                {group?.members?.length || 0} miembros · Modo {group?.mode === "todos" ? "Todos" : "Relevo"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                <span className={cn("font-medium", agentStatus.color)}>
                  {agentStatus.label}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isLoading && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Main ChatWindow component
export function ChatWindow({
  thread,
  messages,
  agent,
  group,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isLoading,
  isStreaming,
  onSendMessage,
  onApproval,
  onClose,
  onRefresh,
  className,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [approvals, setApprovals] = useState<Record<string, Approval>>({});
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, shouldScrollToBottom]);

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let lastScrollTop = container.scrollTop;
    let wasAtBottom = true;

    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
      
      if (atBottom && !wasAtBottom) {
        setShouldScrollToBottom(true);
      } else if (!atBottom && wasAtBottom) {
        setShouldScrollToBottom(false);
      }
      
      wasAtBottom = atBottom;
      lastScrollTop = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && e.ctrlKey) {
        setShouldScrollToBottom(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle approval decisions
  const handleApproval = useCallback(
    async (approvalId: string, decision: "approved" | "rejected", reason?: string) => {
      try {
        await onApproval(approvalId, decision, reason);
        setApprovals((prev) => ({
          ...prev,
          [approvalId]: {
            ...prev[approvalId],
            status: decision,
            decidedAt: new Date(),
            decisionReason: reason,
          },
        }));
      } catch (error) {
        console.error("Error handling approval:", error);
      }
    },
    [onApproval]
  );

  // Check if thread is empty
  const isEmpty = messages.length === 0;

  // Get agent for each message
  const getAgentForMessage = (msg: Message) => {
    if (msg.agentId && msg.agentId === agent?.id) {
      return agent;
    }
    // For group chats, find the agent in group members
    if (group && msg.agentId) {
      // This would need to be enhanced with actual group member data
      return undefined;
    }
    return agent;
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <ChatHeader
        thread={thread}
        agent={agent}
        group={group}
        isLoading={isLoading}
        onClose={onClose}
        onRefresh={onRefresh}
      />

      {/* Messages area */}
      <ScrollArea 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isEmpty ? (
          <EmptyState agent={agent} group={group} />
        ) : (
          <div className="space-y-4">
            {/* Messages */}
            {messages.map((message) => {
              const isUser = message.authorType === "user";
              const msgAgent = getAgentForMessage(message);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  agent={msgAgent}
                  userName={isUser ? currentUserName : undefined}
                  userAvatar={isUser ? currentUserAvatar : undefined}
                  isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                  onApproval={handleApproval}
                  showTimestamp={true}
                />
              );
            })}

            {/* Typing indicator */}
            {isStreaming && (
              <AgentTypingIndicator agent={agent} />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        <ChatInput
          onSend={onSendMessage}
          isLoading={isLoading || isStreaming}
          placeholder={`Escribir mensaje a ${agent?.name || group?.name || "..."}`}
          disabled={isLoading || isStreaming}
        />
      </div>
    </div>
  );
}

export default ChatWindow;
