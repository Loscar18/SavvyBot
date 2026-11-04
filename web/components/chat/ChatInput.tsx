"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Paperclip, Send, Smile, Mic, Code, Image as ImageIcon, FileText, X } from "lucide-react";

// Chat input props
export interface ChatInputProps {
  onSend: (content: string, files?: File[]) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  autoFocus?: boolean;
}

// File preview component
function FilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const getFileIcon = () => {
    if (file.type.startsWith("image/")) return ImageIcon;
    if (file.type.startsWith("application/pdf")) return FileText;
    if (file.type.startsWith("text/")) return Code;
    return FileText;
  };

  const Icon = getFileIcon();
  const fileSize = formatFileSize(file.size);

  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{fileSize}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-6 w-6"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Command suggestion component
function CommandSuggestion({
  command,
  description,
  onSelect,
}: {
  command: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer rounded"
      onClick={onSelect}
    >
      <Code className="h-4 w-4 text-muted-foreground" />
      <div>
        <span className="font-mono text-sm">{command}</span>
        <span className="text-xs text-muted-foreground ml-2">{description}</span>
      </div>
    </div>
  );
}

// Main ChatInput component
export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Escribe un mensaje...",
  disabled = false,
  className,
  maxLength = 10000,
  autoFocus = true,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle command selection
  const handleCommandSelect = (command: string) => {
    setContent((prev) => prev + command + " ");
    setShowCommands(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Available commands
  const commands = [
    { command: "/autonomia 1", description: "Nivel 1 - Todo con aprobación" },
    { command: "/autonomia 2", description: "Nivel 2 - Lectura libre + escritura con aprobación" },
    { command: "/autonomia 3", description: "Nivel 3 - Ejecución libre (excepto acciones irreversibles)" },
    { command: "/memoria", description: "Mostrar memoria del agente" },
    { command: "/skills", description: "Listar skills del agente" },
    { command: "/herramientas", description: "Listar herramientas disponibles" },
    { command: "/ayuda", description: "Mostrar ayuda" },
    { command: "/nuevo", description: "Crear nuevo chat" },
    { command: "/archivar", description: "Archivar este chat" },
  ];

  // Handle key down
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle command suggestions
    if (e.key === "/" && e.target instanceof HTMLTextAreaElement) {
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = e.target.value.substring(0, cursorPos);
      const lastSpace = textBeforeCursor.lastIndexOf(" ");
      const currentWord = textBeforeCursor.substring(lastSpace + 1);
      
      if (currentWord === "/" || currentWord === "") {
        setShowCommands(true);
      }
    } else if (e.key === "Escape") {
      setShowCommands(false);
    } else if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle send
  const handleSend = async () => {
    if (content.trim() === "" && files.length === 0) return;
    if (disabled || isLoading) return;

    const trimmedContent = content.trim();
    setContent("");
    setFiles([]);
    setShowCommands(false);

    try {
      await onSend(trimmedContent, files);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const newFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) {
          newFiles.push(file);
        }
      }
    }

    if (newFiles.length > 0) {
      e.preventDefault();
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Check character limit
  const isAtLimit = content.length >= maxLength;
  const remainingChars = maxLength - content.length;

  return (
    <div className={cn("relative", className)}>
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {files.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}

      {/* Command suggestions */}
      {showCommands && content.endsWith("/") && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {commands.map((cmd) => (
            <CommandSuggestion
              key={cmd.command}
              command={cmd.command}
              description={cmd.description}
              onSelect={() => handleCommandSelect(cmd.command)}
            />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 border border-input rounded-2xl p-2 bg-background">
        {/* File attachment button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => document.getElementById("file-input")?.click()}
          disabled={disabled || isLoading}
          className="h-8 w-8"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Hidden file input */}
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.txt,.json,.csv"
        />

        {/* Emoji button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || isLoading}
          className="h-8 w-8"
        >
          <Smile className="h-4 w-4" />
        </Button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          maxLength={maxLength}
          className="flex-1 resize-none border-none bg-transparent p-2 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[200px]"
          rows={1}
        />

        {/* Character counter */}
        {isAtLimit && (
          <span className="text-xs text-destructive pb-2">{remainingChars}</span>
        )}

        {/* Send button */}
        <Button
          variant="savvy"
          size="icon"
          onClick={handleSend}
          disabled={disabled || isLoading || (content.trim() === "" && files.length === 0)}
          className="h-8 w-8 flex-shrink-0"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Quick commands hint */}
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Presiona <kbd className="px-1 bg-muted rounded text-xs">/</kbd> para comandos rápidos
      </div>
    </div>
  );
}

// Fix for the RefreshCw import
import { RefreshCw } from "lucide-react";

export default ChatInput;
