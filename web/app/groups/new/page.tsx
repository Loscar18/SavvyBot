"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Checkbox } from "../../../components/ui/checkbox";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { useAuth } from "../../../hooks/useAuth";

export default function NewGroupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    emoji: "👥",
    mode: "todos",
    agentIds: [] as string[],
  });
  const [agents, setAgents] = useState<any[]>([]);
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
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAgentToggle = (agentId: string) => {
    setFormData((prev) => ({
      ...prev,
      agentIds: prev.agentIds.includes(agentId)
        ? prev.agentIds.filter((id) => id !== agentId)
        : [...prev.agentIds, agentId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (formData.name.trim() === "") {
        throw new Error("El nombre es obligatorio");
      }
      
      if (formData.agentIds.length === 0) {
        throw new Error("Debes seleccionar al menos un agente");
      }

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear grupo");
      }

      router.push("/groups");
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
        <h1 className="text-3xl font-bold">Crear nuevo grupo</h1>
        <p className="text-muted-foreground">
          Crea un grupo de agentes que puedan colaborar juntos
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuración del grupo</CardTitle>
          <CardDescription>
            Configura las propiedades básicas de tu grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del grupo</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Equipo de desarrollo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                name="emoji"
                value={formData.emoji}
                onChange={handleChange}
                placeholder="👥"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Modo de colaboración</Label>
              <Select
                value={formData.mode}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, mode: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div>
                      <p className="font-medium">Todos responden</p>
                      <p className="text-sm text-muted-foreground">
                        Cada agente etiquetado responde individualmente
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="relevo">
                    <div>
                      <p className="font-medium">Relevo</p>
                      <p className="text-sm text-muted-foreground">
                        Un agente coordinador delega y sintetiza
                      </p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seleccionar agentes</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Selecciona los agentes que formarán parte de este grupo
              </p>
              {agents.length === 0 ? (
                <Alert variant="info">
                  <AlertDescription>
                    No tienes agentes creados. <Button variant="link" asChild>
                      <a href="/agents/new">Crea uno primero</a>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={formData.agentIds.includes(agent.id)}
                        onCheckedChange={() => handleAgentToggle(agent.id)}
                      />
                      <label htmlFor={`agent-${agent.id}`} className="flex items-center space-x-2 cursor-pointer">
                        <span className="text-xl">{agent.emoji}</span>
                        <span>{agent.name}</span>
                        <span className="text-sm text-muted-foreground">({agent.role})</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CardFooter className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => router.push("/groups")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-savvy-orange hover:bg-savvy-orange/90"
                disabled={saving || formData.agentIds.length === 0}
              >
                {saving ? <LoadingSpinner className="h-4 w-4" /> : "Crear grupo"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
