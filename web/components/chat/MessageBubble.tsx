"use client";

import { useState, useEffect, useRef } from "react";
import { cn, formatDateTime, getInitials } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Check, Clock, X, AlertCircle, Loader2, Code, FileText, Image as ImageIcon } from "lucide-react";
import { Message, Approval, Agent, Tool } from "../../types";

// Message bubble props
export interface MessageBubbleProps {
  message: Message;
  agent?: Agent;
  userName?: string;
  userAvatar?: string;
  isStreaming?: boolean;
  onApproval?: (approvalId: string, decision: "approved" | "rejected", reason?: string) => void;
  showTimestamp?: boolean;
}

// Approval card component
export function ApprovalCard({
  approval,
  onDecision,
}: {
  approval: Approval;
  onDecision: (decision: "approved" | "rejected", reason?: string) => void;
}) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onDecision("approved", reason);
    setDecision("approved");
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    await onDecision("rejected", reason);
    setDecision("rejected");
    setIsSubmitting(false);
  };

  if (decision) {
    return (
      <Card className="p-4 border-l-4 border-l-green-500 bg-green-50/50">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600" />
          <span className="font-medium">
            {decision === "approved" ? "Aprobado" : "Rechazado"}
          </span>
          {reason && <span className="text-muted-foreground">: {reason}</span>}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/50">
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-800">Aprobación requerida</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {approval.toolName} quiere realizar una acción irreversible:
            </p>
            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
              {JSON.stringify(approval.payload, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="space-y-2">
          <textarea
            placeholder="Razón (opcional)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 text-sm border border-input rounded-lg resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={isSubmitting}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Rechazar
          </Button>
          <Button
            variant="savvy"
            size="sm"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="gap-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Aprobar
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Tool call display component
export function ToolCallDisplay({
  tool,
  payload,
  result,
  status,
}: {
  tool: string;
  payload?: any;
  result?: any;
  status: "pending" | "success" | "failed";
}) {
  const statusConfig = {
    pending: { icon: Clock, color: "text-orange-600", label: "Ejecutando..." },
    success: { icon: Check, color: "text-green-600", label: "Éxito" },
    failed: { icon: X, color: "text-red-600", label: "Error" },
  };

  const Icon = statusConfig[status].icon;

  return (
    <Card className="p-3 bg-muted/50">
      <div className="flex items-start gap-2">
        <Code className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-primary">{tool}</span>
            <Badge variant={status === "success" ? "default" : status === "failed" ? "destructive" : "secondary"}>
              {statusConfig[status].label}
            </Badge>
          </div>
          {payload && (
            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
          {result && status === "success" && (
            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}

// File attachment display
export function FileAttachment({
  file,
  onDownload,
}: {
  file: { name: string; size: number; mimeType?: string; url?: string };
  onDownload?: () => void;
}) {
  const getFileIcon = () => {
    if (file.mimeType?.startsWith("image/")) return ImageIcon;
    if (file.mimeType?.startsWith("application/pdf")) return FileText;
    return FileText;
  };

  const Icon = getFileIcon();
  const fileSize = formatFileSize(file.size);

  return (
    <Card className="p-3 bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={onDownload}>
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">{fileSize}</p>
        </div>
      </div>
    </Card>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

// Main MessageBubble component
export function MessageBubble({
  message,
  agent,
  userName = "Tú",
  userAvatar,
  isStreaming = false,
  onApproval,
  showTimestamp = true,
}: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  // Auto-scroll to bottom when message changes
  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [message.id]);

  // Determine message type and styling
  const isUserMessage = message.authorType === "user";
  const isAgentMessage = message.authorType === "agent";
  const isSystemMessage = message.authorType === "system";

  // Get agent display info
  const agentName = agent?.name || "Agente";
  const agentEmoji = agent?.emoji || "🤖";
  const agentColor = agent?.color || "#FF7A29";

  // Get timestamp
  const timestamp = formatDateTime(message.createdAt);

  // Check if content is long
  const isLongContent = message.content?.length > 500;
  const displayContent = isLongContent && !showFullContent
    ? message.content?.slice(0, 500) + "..."
    : message.content;

  // Handle approval if this message has one
  const handleApprovalDecision = (decision: "approved" | "rejected", reason?: string) => {
    if (message.approvalId && onApproval) {
      onApproval(message.approvalId, decision, reason);
    }
  };

  return (
    <div 
      ref={bubbleRef}
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUserMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar - only for agent/system messages */}
      {!isUserMessage && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8" style={{ backgroundColor: agentColor }}>
            <AvatarFallback className="text-sm font-bold text-white">
              {agentEmoji}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message content */}
      <div 
        className={cn(
          "flex flex-col gap-1",
          isUserMessage ? "items-end" : "items-start"
        )}
      >
        {/* Author name - for agent messages */}
        {isAgentMessage && (
          <span className="text-xs font-medium text-muted-foreground px-2">
            {agentName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3",
            isUserMessage 
              ? "bg-savvy-orange text-white rounded-br-sm"
              : isSystemMessage
                ? "bg-muted text-muted-foreground text-center text-sm"
                : "bg-card border border-border text-foreground rounded-bl-sm",
            isStreaming && "opacity-80"
          )}
        >
          {/* Content */}
          <div className="whitespace-pre-wrap break-words">
            {displayContent}
          </div>

          {/* Show more/less for long content */}
          {isLongContent && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className={cn(
                "text-xs font-medium mt-2",
                isUserMessage ? "text-orange-100" : "text-muted-foreground"
              )}
            >
              {showFullContent ? "Mostrar menos" : "Mostrar más"}
            </button>
          )}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 mt-2">
              <TypingIndicator />
            </div>
          )}

          {/* Approval card */}
          {message.approvalId && onApproval && (
            <div className="mt-3">
              <ApprovalCard
                approval={{ 
                  id: message.approvalId,
                  threadId: message.threadId,
                  workspaceId: "",
                  agentId: agent?.id,
                  toolName: "Herramienta",
                  payload: {},
                  status: "pending",
                  createdAt: new Date(),
                }}
                onDecision={handleApprovalDecision}
              />
            </div>
          )}

          {/* Tool call display */}
          {message.toolCallId && (
            <div className="mt-3">
              <ToolCallDisplay
                tool="Herramienta"
                payload={{}}
                status="pending"
              />
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <span 
            className={cn(
              "text-xs text-muted-foreground px-2",
              isUserMessage ? "text-right" : "text-left"
            )}
          >
            {timestamp}
          </span>
        )}
      </div>

      {/* User avatar - only for user messages */}
      {isUserMessage && userAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm font-bold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
