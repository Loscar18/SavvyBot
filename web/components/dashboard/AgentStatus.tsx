"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Bot, Clock, MoreVertical } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: "active" | "paused" | "error" | "working";
  lastActivity: string;
}

interface AgentStatusProps {
  agents: Agent[];
}

export function AgentStatus({ agents }: AgentStatusProps) {
  const displayAgents = agents.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="text-xs">En línea</Badge>;
      case "working":
        return <Badge variant="savvy" className="text-xs">Trabajando</Badge>;
      case "paused":
        return <Badge variant="secondary" className="text-xs">Pausado</Badge>;
      case "error":
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Desconocido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Estado de Agentes</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {displayAgents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay agentes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9" style={{ backgroundColor: agent.color }}>
                  <AvatarFallback className="text-sm font-bold text-white">
                    {agent.emoji}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{agent.name}</span>
                    {getStatusBadge(agent.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{agent.lastActivity}</p>
                </div>
                <Clock className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentStatus;
