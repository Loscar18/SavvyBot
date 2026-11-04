"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Plus, Users, Search, MoreVertical, Play, Pause, Edit, Trash2 } from "lucide-react";
import { Group, User, Workspace, Agent } from "../../types";
import { useAuth } from "../../hooks/useAuth";

const mockGroups: Group[] = [
  {
    id: "group-1",
    workspaceId: "workspace-1",
    name: "Equipo Amanecer 🌅",
    emoji: "🌅",
    color: "#FF7A29",
    mode: "relevo",
    coordinatorId: "agent-1",
    description: "Equipo de agentes para tareas diarias",
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

export default function GroupsPage() {
  const router = useRouter();
  const { user, workspace } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setGroups(mockGroups);
        setAgents(mockAgents);
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "todos":
        return <Badge variant="savvy" className="text-xs">Todos responden</Badge>;
      case "relevo":
        return <Badge variant="default" className="text-xs">Modo relevo</Badge>;
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
            <h1 className="text-2xl font-bold text-foreground">Grupos de Agentes</h1>
            <p className="text-muted-foreground">
              Crea equipos de agentes que colaboren juntos
            </p>
          </div>
          <Button variant="savvy" onClick={() => router.push("/groups/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Grupo
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
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {groups.filter((g) => g.mode === "todos").length}
                </p>
                <p className="text-xs text-muted-foreground">Modo Todos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {groups.filter((g) => g.mode === "relevo").length}
                </p>
                <p className="text-xs text-muted-foreground">Modo Relevo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {agents.length}
                </p>
                <p className="text-xs text-muted-foreground">Agentes disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
          </div>
        ) : groups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No hay grupos</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer grupo para que tus agentes colaboren
              </p>
              <Button variant="savvy" onClick={() => router.push("/groups/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
              const coordinator = agents.find((a) => a.id === group.coordinatorId);
              return (
                <Card
                  key={group.id}
                  className="hover:shadow-soft-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/groups/${group.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10" style={{ backgroundColor: group.color }}>
                          <AvatarFallback className="text-lg font-bold text-white">
                            {group.emoji}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription>{group.description || "Sin descripción"}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getModeBadge(group.mode)}
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
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {group.mode === "relevo" && coordinator ? (
                          <>Coordinador: {coordinator.name}</>
                        ) : (
                          "Todos los miembros pueden responder"
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-2">
                        <Badge variant="outline" className="text-xs">
                          {agents.filter((a) => a.id === group.coordinatorId || true).length} miembros
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
