"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { ChevronRight, MessageSquare } from "lucide-react";

interface Thread {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: Date;
  unread: boolean;
  agent?: { id: string; name: string; emoji: string; color: string };
  group?: { id: string; name: string; emoji: string; color: string };
}

interface RecentThreadsProps {
  threads: Thread[];
}

export function RecentThreads({ threads }: RecentThreadsProps) {
  const router = useRouter();

  const displayThreads = threads.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Hilos Recientes</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/chat")}
          className="text-xs h-6"
        >
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        {displayThreads.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay hilos recientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayThreads.map((thread) => {
              const isGroup = !!thread.group;
              const displayName = isGroup ? thread.group?.name : thread.agent?.name || "Agente";
              const emoji = isGroup ? thread.group?.emoji : thread.agent?.emoji || "🤖";
              const color = isGroup ? thread.group?.color : thread.agent?.color || "#FF7A29";
              const lastMessageTime = new Date(thread.lastMessageAt).toLocaleString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  key={thread.id}
                  onClick={() => router.push(`/chat/${thread.id}`)}
                  className="w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left flex items-center gap-3"
                >
                  <Avatar className="h-9 w-9" style={{ backgroundColor: color }}>
                    <AvatarFallback className="text-sm font-bold text-white">
                      {emoji}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{displayName}</span>
                      {thread.unread && (
                        <Badge variant="savvy" className="text-xs min-w-[16px] h-[16px] p-0.5">
                          •
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{thread.title}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{lastMessageTime}</div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentThreads;
