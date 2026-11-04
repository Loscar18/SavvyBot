"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Switch } from "../../../components/ui/switch";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";

export default function NewMemoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  
  const [formData, setFormData] = useState({
    text: "",
    type: "note" as "note" | "fact" | "instruction",
    scope: agentId ? "agent" : "global" as "global" | "agent",
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(agentId || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      const data = await response.json();
      if (response.ok) {
        setAgents(data.data);
        if (!agentId && data.data.length > 0) {
          setSelectedAgentId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.text.trim()) {
        throw new Error("El texto es obligatorio");
      }

      const finalAgentId = formData.scope === "agent" ? selectedAgentId : undefined;

      const response = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: formData.text,
          type: formData.type,
          scope: formData.scope,
          agentId: finalAgentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear memoria");
      }

      router.push("/memory");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva memoria</h1>
        <p className="text-muted-foreground">
          Añade información que tus agentes deben recordar
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuración de la memoria</CardTitle>
          <CardDescription>
            Define el contenido y contexto de la nueva memoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Nota</SelectItem>
                    <SelectItem value="fact">Hecho</SelectItem>
                    <SelectItem value="instruction">Instrucción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">Ámbito</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, scope: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona ámbito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (todos los agentes)</SelectItem>
                    <SelectItem value="agent">Específico de agente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.scope === "agent" && (
              <div className="space-y-2">
                <Label htmlFor="agentId">Agente</Label>
                <Select
                  value={selectedAgentId}
                  onValueChange={setSelectedAgentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center space-x-2">
                          <span>{agent.emoji}</span>
                          <span>{agent.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="text">Contenido</Label>
              <Textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder="Escribe el contenido de la memoria..."
                rows={10}
                required
              />
            </div>

            <CardFooter className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => router.push("/memory")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-savvy-orange hover:bg-savvy-orange/90"
                disabled={saving || !formData.text.trim()}
              >
                {saving ? <LoadingSpinner className="h-4 w-4" /> : "Crear memoria"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
