"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Plus, Clock, Search, MoreVertical, Brain, Globe, User2, Edit, Trash2 } from "lucide-react";
import { Memory, User, Workspace, Agent } from "../../types";
import { useAuth } from "../../hooks/useAuth";

const mockMemories: Memory[] = [
  {
    id: "mem-1",
    workspaceId: "workspace-1",
    agentId: null,
    scope: "global",
    type: "fact",
    text: "El usuario prefiere respuestas en español",
    sourceThreadId: null,
    sourceMessageId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mem-2",
    workspaceId: "workspace-1",
    agentId: "agent-1",
    scope: "agent",
    type: "instruction",
    text: "Siempre verificar datos antes de responder",
    sourceThreadId: "thread-1",
    sourceMessageId: "msg-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mem-3",
    workspaceId: "workspace-1",
    agentId: "agent-1",
    scope: "agent",
    type: "note",
    text: "El usuario está interesado en inteligencia artificial y machine learning",
    sourceThreadId: "thread-2",
    sourceMessageId: "msg-3",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAgents: Agent[] = [
  {
    id: "agent-1",
    workspaceId: "workspace-1",
    name: "Vector 🧭",
    emoji: "🧭",
    color: "#FF7A29",
    role: "Asistente de estudios",
    personality: "Analítico",
    instructions: "",
    autonomy: 2,
    modelBaseUrl: "https://api.grok.com",
    modelName: "grok",
    modelKeyCiphertext: "",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function MemoryPage() {
  const router = useRouter();
  const { user, workspace } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setMemories(mockMemories);
        setAgents(mockAgents);
        setFilteredMemories(mockMemories);
      } catch (error) {
        console.error("Error loading memories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter memories
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMemories(memories);
      return;
    }

    const filtered = memories.filter((memory) =>
      memory.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredMemories(filtered);
  }, [searchQuery, memories]);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : "Agente desconocido";
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "global":
        return <Globe className="h-4 w-4" />;
      case "agent":
        return <User2 className="h-4 w-4" />;
      case "thread":
        return <Clock className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "note":
        return <Badge variant="savvy" className="text-xs">Nota</Badge>;
      case "fact":
        return <Badge variant="default" className="text-xs">Hecho</Badge>;
      case "instruction":
        return <Badge variant="info" className="text-xs">Instrucción</Badge>;
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
            <h1 className="text-2xl font-bold text-foreground">Memoria</h1>
            <p className="text-muted-foreground">
              Contexto y conocimiento persistente
            </p>
          </div>
          <Button variant="savvy" onClick={() => router.push("/memory/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Entrada
          </Button>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{memories.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {memories.filter((m) => m.scope === "global").length}
                </p>
                <p className="text-xs text-muted-foreground">Global</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {memories.filter((m) => m.scope === "agent").length}
                </p>
                <p className="text-xs text-muted-foreground">Por Agente</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {memories.filter((m) => m.scope === "thread").length}
                </p>
                <p className="text-xs text-muted-foreground">Por Hilo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar en memoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        {/* Memories list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
          </div>
        ) : filteredMemories.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No hay entradas de memoria</h3>
              <p className="text-muted-foreground mb-4">
                La memoria se llena automáticamente a medida que usas los agentes
              </p>
              <Button variant="savvy" onClick={() => router.push("/memory/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Entrada
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMemories.map((memory) => (
              <Card
                key={memory.id}
                className="hover:shadow-soft-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getScopeIcon(memory.scope)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {memory.scope === "global" ? "Global" : getAgentName(memory.agentId) || "Desconocido"}
                        </CardTitle>
                        <CardDescription>
                          {new Date(memory.createdAt).toLocaleString("es-ES")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(memory.type)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{memory.text}</p>
                  {memory.sourceThreadId && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Fuente: Hilo {memory.sourceThreadId}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
