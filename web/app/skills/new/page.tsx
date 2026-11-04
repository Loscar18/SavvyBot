"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";

export default function NewSkillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    steps: [] as string[],
    inputs: {} as Record<string, string>,
    outputs: {} as Record<string, string>,
    knownErrors: [] as string[],
    newStep: "",
    newInputKey: "",
    newInputValue: "",
    newOutputKey: "",
    newOutputValue: "",
    newError: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const addStep = () => {
    if (formData.newStep.trim()) {
      setFormData((prev) => ({
        ...prev,
        steps: [...prev.steps, prev.newStep],
        newStep: "",
      }));
    }
  };

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const addInput = () => {
    if (formData.newInputKey.trim() && formData.newInputValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        inputs: { ...prev.inputs, [prev.newInputKey]: prev.newInputValue },
        newInputKey: "",
        newInputValue: "",
      }));
    }
  };

  const removeInput = (key: string) => {
    const newInputs = { ...formData.inputs };
    delete newInputs[key];
    setFormData((prev) => ({ ...prev, inputs: newInputs }));
  };

  const addOutput = () => {
    if (formData.newOutputKey.trim() && formData.newOutputValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        outputs: { ...prev.outputs, [prev.newOutputKey]: prev.newOutputValue },
        newOutputKey: "",
        newOutputValue: "",
      }));
    }
  };

  const removeOutput = (key: string) => {
    const newOutputs = { ...formData.outputs };
    delete newOutputs[key];
    setFormData((prev) => ({ ...prev, outputs: newOutputs }));
  };

  const addKnownError = () => {
    if (formData.newError.trim()) {
      setFormData((prev) => ({
        ...prev,
        knownErrors: [...prev.knownErrors, prev.newError],
        newError: "",
      }));
    }
  };

  const removeKnownError = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      knownErrors: prev.knownErrors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!selectedAgentId) {
        throw new Error("Debes seleccionar un agente");
      }
      if (!formData.name.trim()) {
        throw new Error("El nombre es obligatorio");
      }
      if (!formData.goal.trim()) {
        throw new Error("El objetivo es obligatorio");
      }

      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          name: formData.name,
          goal: formData.goal,
          steps: formData.steps,
          inputs: formData.inputs,
          outputs: formData.outputs,
          knownErrors: formData.knownErrors,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear habilidad");
      }

      router.push(`/agents/${selectedAgentId}#skills`);
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
        <h1 className="text-3xl font-bold">Nueva habilidad</h1>
        <p className="text-muted-foreground">
          Define una habilidad reutilizable para tus agentes
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuración de la habilidad</CardTitle>
          <CardDescription>
            Define los detalles de la nueva habilidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Analizar informe financiero"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo</Label>
              <Textarea
                id="goal"
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                placeholder="Describe qué hace esta habilidad y cuál es su propósito"
                rows={3}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pasos</Label>
                <p className="text-sm text-muted-foreground">
                  Define los pasos que el agente debe seguir para ejecutar esta habilidad
                </p>
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <Input value={step} readOnly className="flex-1" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={formData.newStep}
                    onChange={(e) => setFormData((prev) => ({ ...prev, newStep: e.target.value }))}
                    placeholder="Nuevo paso"
                  />
                  <Button type="button" onClick={addStep}>
                    Añadir
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entradas</Label>
                  <p className="text-sm text-muted-foreground">
                    Datos que la habilidad necesita para funcionar
                  </p>
                  {Object.entries(formData.inputs).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Input value={key} readOnly className="w-1/3" />
                      <span>:</span>
                      <Input value={value} readOnly className="flex-1" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeInput(key)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={formData.newInputKey}
                      onChange={(e) => setFormData((prev) => ({ ...prev, newInputKey: e.target.value }))}
                      placeholder="Clave"
                      className="w-1/3"
                    />
                    <Input
                      value={formData.newInputValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, newInputValue: e.target.value }))}
                      placeholder="Valor"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addInput}>
                      Añadir
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Salidas</Label>
                  <p className="text-sm text-muted-foreground">
                    Resultados que la habilidad produce
                  </p>
                  {Object.entries(formData.outputs).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Input value={key} readOnly className="w-1/3" />
                      <span>:</span>
                      <Input value={value} readOnly className="flex-1" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeOutput(key)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={formData.newOutputKey}
                      onChange={(e) => setFormData((prev) => ({ ...prev, newOutputKey: e.target.value }))}
                      placeholder="Clave"
                      className="w-1/3"
                    />
                    <Input
                      value={formData.newOutputValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, newOutputValue: e.target.value }))}
                      placeholder="Valor"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addOutput}>
                      Añadir
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Errores conocidos</Label>
                <p className="text-sm text-muted-foreground">
                  Problemas comunes que pueden ocurrir y cómo manejarlos
                </p>
                {formData.knownErrors.map((error, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={error} readOnly className="flex-1" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeKnownError(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={formData.newError}
                    onChange={(e) => setFormData((prev) => ({ ...prev, newError: e.target.value }))}
                    placeholder="Nuevo error conocido"
                  />
                  <Button type="button" onClick={addKnownError}>
                    Añadir
                  </Button>
                </div>
              </div>
            </div>

            <CardFooter className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => router.push("/skills")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-savvy-orange hover:bg-savvy-orange/90"
                disabled={saving || !formData.name || !formData.goal}
              >
                {saving ? <LoadingSpinner className="h-4 w-4" /> : "Crear habilidad"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
