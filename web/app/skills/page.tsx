"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Plus, Brain, Search, MoreVertical, Code, Target, List, AlertCircle } from "lucide-react";
import { Skill, User, Workspace, Agent } from "../../types";
import { useAuth } from "../../hooks/useAuth";

const mockSkills: Skill[] = [
  {
    id: "skill-1",
    agentId: "agent-1",
    name: "Analizar datos",
    goal: "Analizar datos estructurados y extraer insights",
    steps: [
      "Recopilar datos de las fuentes especificadas",
      "Limpiar y normalizar los datos",
      "Aplicar análisis estadístico",
      "Generar visualizaciones",
      "Extraer insights clave"
    ],
    inputs: {
      dataSource: "Fuente de datos (URL o archivo)",
      timeRange: "Rango de tiempo (opcional)"
    },
    outputs: {
      analysis: "Análisis completo",
      insights: "Insights clave",
      visualizations: "Visualizaciones generadas"
    },
    knownErrors: ["Datos incompletos", "Formato incorrecto"],
    lastUsedAt: new Date(),
    usageCount: 5,
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

export default function SkillsPage() {
  const router = useRouter();
  const { user, workspace } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
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
        setSkills(mockSkills);
        setAgents(mockAgents);
      } catch (error) {
        console.error("Error loading skills:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent ? `${agent.name}` : "Agente desconocido";
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Skills</h1>
            <p className="text-muted-foreground">
              Habilidades especializadas para tus agentes
            </p>
          </div>
          <Button variant="savvy" onClick={() => router.push("/skills/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Skill
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
                <p className="text-2xl font-bold">{skills.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {skills.filter((s) => s.usageCount > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">Usadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {skills.reduce((sum, s) => sum + s.usageCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Uso total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {agents.length}
                </p>
                <p className="text-xs text-muted-foreground">Agentes con skills</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
          </div>
        ) : skills.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No hay skills</h3>
              <p className="text-muted-foreground mb-4">
                Crea habilidades especializadas para tus agentes
              </p>
              <Button variant="savvy" onClick={() => router.push("/skills/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Skill
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {skills.map((skill) => (
              <Card
                key={skill.id}
                className="hover:shadow-soft-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{skill.name}</CardTitle>
                        <CardDescription>
                          {getAgentName(skill.agentId)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {skill.usageCount} usos
                      </Badge>
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
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Objetivo:</p>
                      <p className="text-sm text-muted-foreground">{skill.goal}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Pasos ({skill.steps?.length || 0}):</p>
                      <div className="flex flex-wrap gap-1">
                        {skill.steps?.slice(0, 3).map((step, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {index + 1}. {step}
                          </Badge>
                        ))}
                        {skill.steps && skill.steps.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{skill.steps.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>
                    {skill.knownErrors && skill.knownErrors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1 text-orange-600">
                          Errores conocidos:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {skill.knownErrors.map((error, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {error}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
