"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Plus, Code, Search, MoreVertical, Plug, Link2, Globe, Server } from "lucide-react";
import { Integration, User, Workspace } from "../../types";
import { useAuth } from "../../hooks/useAuth";

const mockIntegrations: Integration[] = [
  {
    id: "int-1",
    workspaceId: "workspace-1",
    kind: "composio",
    providerName: "Composio",
    displayName: "Composio Apps",
    description: "Integración con Google, Slack, GitHub, Notion y más",
    configCiphertext: "",
    status: "connected",
    connectedAccountId: "acc-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "int-2",
    workspaceId: "workspace-1",
    kind: "mcp",
    providerName: "MCP Server",
    displayName: "Mi MCP Server",
    description: "Servidor MCP personalizado",
    configCiphertext: "",
    status: "connected",
    mcpType: "http",
    mcpUrl: "https://mcp.example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const { user, workspace } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
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
        setIntegrations(mockIntegrations);
      } catch (error) {
        console.error("Error loading integrations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "composio":
        return <Code className="h-4 w-4" />;
      case "mcp":
        return <Server className="h-4 w-4" />;
      case "api":
        return <Globe className="h-4 w-4" />;
      default:
        return <Plug className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="default" className="text-xs">Conectado</Badge>;
      case "disconnected":
        return <Badge variant="secondary" className="text-xs">Desconectado</Badge>;
      case "error":
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      case "pending":
        return <Badge variant="savvy" className="text-xs">Pendiente</Badge>;
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
            <h1 className="text-2xl font-bold text-foreground">Integraciones</h1>
            <p className="text-muted-foreground">
              Conecta herramientas y servicios externos
            </p>
          </div>
          <Button variant="savvy" onClick={() => router.push("/integrations/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Integración
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
                <p className="text-2xl font-bold">{integrations.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter((i) => i.status === "connected").length}
                </p>
                <p className="text-xs text-muted-foreground">Conectadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {integrations.filter((i) => i.kind === "composio").length}
                </p>
                <p className="text-xs text-muted-foreground">Composio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {integrations.filter((i) => i.kind === "mcp" || i.kind === "api").length}
                </p>
                <p className="text-xs text-muted-foreground">Personalizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-soft-lg transition-shadow"
            onClick={() => router.push("/integrations/new?kind=composio")}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Code className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Composio</CardTitle>
                <CardDescription>Conecta con apps populares</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Google, Slack, GitHub, Notion, Gmail, Drive, y más
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-soft-lg transition-shadow"
            onClick={() => router.push("/integrations/new?kind=mcp")}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>MCP Server</CardTitle>
                <CardDescription>Conecta servidores MCP</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                HTTP, SSE, o servidores personalizados
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-soft-lg transition-shadow"
            onClick={() => router.push("/integrations/new?kind=api")}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>API Personalizada</CardTitle>
                <CardDescription>Conecta cualquier API REST</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define endpoints y autenticación
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integrations list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
          </div>
        ) : integrations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No hay integraciones</h3>
              <p className="text-muted-foreground mb-4">
                Conecta tu primera integración para dar superpoderes a tus agentes
              </p>
              <Button variant="savvy" onClick={() => router.push("/integrations/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Integración
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <h2 className="text-lg font-semibold">Todas las integraciones</h2>
            {integrations.map((integration) => (
              <Card
                key={integration.id}
                className="hover:shadow-soft-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getKindIcon(integration.kind)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {integration.displayName || integration.providerName}
                        </CardTitle>
                        <CardDescription>
                          {integration.description || "Sin descripción"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(integration.status)}
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {integration.kind === "composio" ? "Composio" : integration.kind === "mcp" ? "MCP" : "API"}
                    </Badge>
                    {integration.connectedAccountId && (
                      <Badge variant="outline" className="text-xs">
                        Cuenta conectada
                      </Badge>
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
