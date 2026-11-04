"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Switch } from "../../../components/ui/switch";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";

export default function NewRoutinePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    targetType: "agent",
    targetId: "",
    triggerType: "daily",
    triggerValue: "09:00",
    action: "",
    autonomy: 2,
    enabled: true,
    description: "",
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, groupsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/groups"),
      ]);
      const agentsData = await agentsRes.json();
      const groupsData = await groupsRes.json();
      
      if (agentsRes.ok) setAgents(agentsData.data);
      if (groupsRes.ok) setGroups(groupsData.data);
    } catch (err) {
      console.error("Error fetching data:", err);
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
      if (!formData.targetId) {
        throw new Error("Debes seleccionar un agente o grupo");
      }
      if (!formData.action) {
        throw new Error("La acción es obligatoria");
      }

      // Format trigger value based on type
      let triggerValue = formData.triggerValue;
      if (formData.triggerType === "daily") {
        triggerValue = `${triggerValue}:00`; // Ensure it's in HH:mm format
      } else if (formData.triggerType === "weekly") {
        // Expecting format like "monday-09:00"
        if (!triggerValue.includes("-")) {
          triggerValue = `monday-${triggerValue}:00`;
        }
      }

      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          triggerValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear rutina");
      }

      router.push("/routines");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const triggerExamples = {
    daily: "09:00 (formato HH:mm)",
    weekly: "monday-09:00 (día-hora)",
    hourly: "9 (cada X horas)",
    manual: "N/A",
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
        <h1 className="text-3xl font-bold">Nueva rutina</h1>
        <p className="text-muted-foreground">
          Crea una rutina automatizada para tus agentes
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuración de la rutina</CardTitle>
          <CardDescription>
            Define cuándo y cómo se ejecutará la rutina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetType">Destinatario</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, targetType: value as any, targetId: "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona destinatario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="group">Grupo</SelectItem>
                  <SelectItem value="workspace">Todo el workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetId">
                {formData.targetType === "agent" ? "Agente" : formData.targetType === "group" ? "Grupo" : "Workspace"}
              </Label>
              {formData.targetType === "agent" ? (
                <Select
                  value={formData.targetId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, targetId: value }))}
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
                          <span className="text-sm text-muted-foreground">({agent.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : formData.targetType === "group" ? (
                <Select
                  value={formData.targetId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, targetId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center space-x-2">
                          <span>{group.emoji}</span>
                          <span>{group.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value="Todo el workspace" readOnly />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="triggerType">Tipo de disparador</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, triggerType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="hourly">Cada X horas</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="triggerValue">Valor del disparador</Label>
                <Input
                  id="triggerValue"
                  name="triggerValue"
                  value={formData.triggerValue}
                  onChange={handleChange}
                  placeholder={triggerExamples[formData.triggerType as keyof typeof triggerExamples]}
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: {triggerExamples[formData.triggerType as keyof typeof triggerExamples]}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Acción a ejecutar</Label>
              <Input
                id="action"
                name="action"
                value={formData.action}
                onChange={handleChange}
                placeholder="Ej: Resumir emails del día, Limpiar archivos temporales, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autonomy">Nivel de autonomía</Label>
                <Select
                  value={formData.autonomy.toString()}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, autonomy: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nivel 1 - Todo requiere aprobación</SelectItem>
                    <SelectItem value="2">Nivel 2 - Lectura libre, escritura con aprobación</SelectItem>
                    <SelectItem value="3">Nivel 3 - Ejecuta y reporta (excepto acciones irreversibles)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-center">
                <Label htmlFor="enabled">Habilitada</Label>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción detallada de lo que hace esta rutina"
              />
            </div>

            <CardFooter className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => router.push("/routines")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-savvy-orange hover:bg-savvy-orange/90"
                disabled={saving || !formData.targetId || !formData.action}
              >
                {saving ? <LoadingSpinner className="h-4 w-4" /> : "Crear rutina"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
