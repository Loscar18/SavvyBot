"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";

export default function NewIntegrationPage() {
  const router = useRouter();
  const [integrationType, setIntegrationType] = useState<"composio" | "mcp" | "api">("composio");
  const [formData, setFormData] = useState({
    providerName: "",
    displayName: "",
    description: "",
    mcpUrl: "",
    mcpType: "http",
    apiBaseUrl: "",
    apiAuthType: "none",
    apiKey: "",
  });
  const [composioApps, setComposioApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (integrationType === "composio") {
      fetchComposioApps();
    }
  }, [integrationType]);

  const fetchComposioApps = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/composio/apps");
      const data = await response.json();
      if (response.ok) {
        setComposioApps(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching Composio apps:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate required fields based on integration type
      if (integrationType === "composio") {
        if (!formData.providerName) {
          throw new Error("Debes seleccionar una app de Composio");
        }
      } else if (integrationType === "mcp") {
        if (!formData.mcpUrl) {
          throw new Error("La URL del MCP es obligatoria");
        }
      } else if (integrationType === "api") {
        if (!formData.apiBaseUrl) {
          throw new Error("La URL base de la API es obligatoria");
        }
      }

      const config: Record<string, any> = {};
      
      if (integrationType === "mcp") {
        config.url = formData.mcpUrl;
        config.type = formData.mcpType;
      } else if (integrationType === "api") {
        config.baseUrl = formData.apiBaseUrl;
        config.authType = formData.apiAuthType;
        if (formData.apiKey) {
          config.apiKey = formData.apiKey;
        }
      }

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: integrationType,
          providerName: formData.providerName || integrationType,
          displayName: formData.displayName || formData.providerName,
          description: formData.description,
          config,
          mcpType: formData.mcpType as any,
          mcpUrl: formData.mcpUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear integración");
      }

      router.push("/integrations");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva integración</h1>
        <p className="text-muted-foreground">
          Conecta herramientas externas para que tus agentes puedan usarlas
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tipo de integración</CardTitle>
          <CardDescription>
            Elige qué tipo de integración quieres crear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={integrationType} onValueChange={(v) => setIntegrationType(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="composio">Composio</TabsTrigger>
              <TabsTrigger value="mcp">MCP</TabsTrigger>
              <TabsTrigger value="api">API Personalizada</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Composio Integration */}
            <TabsContent value="composio">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="providerName">App de Composio</Label>
                  <Select
                    value={formData.providerName}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, providerName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una app" />
                    </SelectTrigger>
                    <SelectContent>
                      {composioApps.map((app) => (
                        <SelectItem key={app.id} value={app.name}>
                          <div className="flex items-center space-x-2">
                            {app.icon && <span>{app.icon}</span>}
                            <span>{app.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {composioApps.length === 0 && (
                        <SelectItem value="" disabled>
                          No se encontraron apps de Composio
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre para mostrar (opcional)</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Mi Google Drive"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Conexión a mi cuenta personal de Google Drive"
                  />
                </div>
              </div>
            </TabsContent>

            {/* MCP Integration */}
            <TabsContent value="mcp">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mcpUrl">URL del servidor MCP</Label>
                  <Input
                    id="mcpUrl"
                    name="mcpUrl"
                    value={formData.mcpUrl}
                    onChange={handleChange}
                    placeholder="https://mcp-server.example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mcpType">Tipo de transporte</Label>
                  <Select
                    value={formData.mcpType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, mcpType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre para mostrar (opcional)</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Mi servidor MCP"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Custom API Integration */}
            <TabsContent value="api">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiBaseUrl">URL base de la API</Label>
                  <Input
                    id="apiBaseUrl"
                    name="apiBaseUrl"
                    value={formData.apiBaseUrl}
                    onChange={handleChange}
                    placeholder="https://api.example.com/v1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiAuthType">Tipo de autenticación</Label>
                  <Select
                    value={formData.apiAuthType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, apiAuthType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="header">Header personalizado</SelectItem>
                      <SelectItem value="query">Query parameter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.apiAuthType !== "none" && (
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Clave de API / Token</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={handleChange}
                      placeholder="Tu clave de API"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre para mostrar (opcional)</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Mi API personalizada"
                  />
                </div>
              </div>
            </TabsContent>

            <CardFooter className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => router.push("/integrations")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-savvy-orange hover:bg-savvy-orange/90"
                disabled={saving}
              >
                {saving ? <LoadingSpinner className="h-4 w-4" /> : "Crear integración"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
