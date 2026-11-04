"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Plus, Bot, Search, MoreVertical, Play, Pause, Edit, Trash2 } from "lucide-react";
import { Agent, User, Workspace } from "../../types";
import { useAuth } from "../../hooks/useAuth";

// Mock data
const mockAgents: Agent[] = [
  {
    id: "agent-1",
    workspaceId: "workspace-1",
    name: "Vector 🧭",
    emoji: "🧭",
    color: "#FF7A29",
    role: "Asistente de estudios",
    personality: "Analítico y detallado",
    instructions: "Ayuda con preguntas de estudio y análisis de información.",
    autonomy: 2,
    modelBaseUrl: "https://api.grok.com",
    modelName: "grok",
    modelKeyCiphertext: "",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "agent-2",
    workspaceId: "workspace-1",
    name: "Scout 🔎",
    emoji: "🔎",
    color: "#4A90E2",
    role: "Investigador web",
    personality: "Curioso y persistente",
    instructions: "Busca y resume información de internet.",
    autonomy: 2,
    modelBaseUrl: "https://api.grok.com",
    modelName: "grok",
    modelKeyCiphertext: "",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "agent-3",
    workspaceId: "workspace-1",
    name: "Faro 📬",
    emoji: "📬",
    color: "#50C878",
    role: "Organizador de correo",
    personality: "Organizado y eficiente",
    instructions: "Clasifica y organiza correos electrónicos.",
    autonomy: 2,
    modelBaseUrl: "https://api.grok.com",
    modelName: "grok",
    modelKeyCiphertext: "",
    status: "paused",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const autonomyLabels: Record<number, string> = {
  1: "Nivel 1 - Todo con aprobación",
  2: "Nivel 2 - Lectura libre + escritura con aprobación",
  3: "Nivel 3 - Ejecución libre",
};

export default function AgentsPage() {
  const router = useRouter();
  const { user, workspace } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const mockUser: User = user || {
    id: "user-1",
    email: "demo@savvybot.ai",
    name: "Usuario Demo",
    workspaceId: "workspace-1",
    role: "owner",
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkspace: Workspace = workspace || {
    id: "workspace-1",
    name: "Mi Espacio de Trabajo",
    slug: "demo-workspace",
    plan: "pro",
    timezone: "Europe/Madrid",
    theme: "light",
    language: "es",
    billingEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Load agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        // In production, fetch from API
        setAgents(mockAgents);
        setFilteredAgents(mockAgents);
      } catch (error) {
        console.error("Error loading agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

  // Filter agents
  useEffect(() => {
    if (!searchQuery) {
      setFilteredAgents(agents);
      return;
    }

    const filtered = agents.filter((agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.personality || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredAgents(filtered);
  }, [searchQuery, agents]);

  const toggleAgentStatus = useCallback((agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? { ...agent, status: agent.status === "active" ? "paused" : "active" }
          : agent
      )
    );
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="text-xs">Activo</Badge>;
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
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agentes</h1>
            <p className="text-muted-foreground">
              Crea y gestiona tus agentes de IA
            </p>
          </div>
          <Button variant="savvy" onClick={() => router.push("/agents/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Agente
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar agentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        {/* Agents grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No hay agentes</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer agente para empezar
              </p>
              <Button variant="savvy" onClick={() => router.push("/agents/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Agente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <Card
                key={agent.id}
                className="hover:shadow-soft-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/agents/${agent.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10" style={{ backgroundColor: agent.color }}>
                        <AvatarFallback className="text-lg font-bold text-white">
                          {agent.emoji}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription>{agent.role}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(agent.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAgentStatus(agent.id);
                        }}
                        className="h-8 w-8"
                      >
                        {agent.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.personality}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-2">
                      <Badge variant="outline" className="text-xs">
                        Autonomía: N{agent.autonomy}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {agent.modelName || "grok"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {agents.filter((a) => a.status === "active").length}
                </p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {agents.filter((a) => a.status === "paused").length}
                </p>
                <p className="text-xs text-muted-foreground">Pausados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {agents.filter((a) => a.autonomy === 3).length}
                </p>
                <p className="text-xs text-muted-foreground">Nivel 3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
