"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { ChevronLeft, Bot, Sparkles, Shield, Target, Brain, Settings, Eye, EyeOff } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../hooks/useAuth";

// Autonomy level descriptions
const autonomyDescriptions = {
  1: {
    title: "Nivel 1 - Supervisado",
    description: "Todo requiere aprobación humana. El agente solo sugiere acciones.",
    color: "text-orange-600",
    badge: "default",
  },
  2: {
    title: "Nivel 2 - Equilibrado (Recomendado)",
    description: "Puede leer información libremente. Acciones de escritura requieren aprobación.",
    color: "text-green-600",
    badge: "savvy",
  },
  3: {
    title: "Nivel 3 - Autónomo",
    description: "Puede ejecutar acciones libremente, excepto compras, borrados y comunicaciones a terceros.",
    color: "text-blue-600",
    badge: "secondary",
  },
};

// Personality presets
const personalityPresets = [
  {
    id: "analytical",
    name: "Analítico",
    description: "Preciso, detallado, enfocado en datos",
    value: "Soy preciso y analítico. Prefiero datos y hechos sobre opiniones. Me enfoco en la exactitud y la lógica.",
  },
  {
    id: "creative",
    name: "Creativo",
    description: "Innovador, fuera de lo común, generador de ideas",
    value: "Soy creativo y pensante fuera de la caja. Genero ideas innovadoras y soluciones originales.",
  },
  {
    id: "friendly",
    name: "Amigable",
    description: "Cálido, empático, fácil de hablar",
    value: "Soy amigable y empático. Me comunico de manera cálida y accesible, como un compañero de equipo.",
  },
  {
    id: "professional",
    name: "Profesional",
    description: "Formal, estructurado, orientado a resultados",
    value: "Soy profesional y orientado a resultados. Me comunico de manera clara y estructurada.",
  },
  {
    id: "concise",
    name: "Conciso",
    description: "Directo, sin rodeos, al grano",
    value: "Soy directo y conciso. Voy al grano sin rodeos innecesarios.",
  },
];

// Role suggestions
const roleSuggestions = [
  "Asistente general",
  "Asistente de estudios",
  "Investigador web",
  "Organizador de correo",
  "Analista de datos",
  "Traductor",
  "Creador de contenido",
  "Asesor técnico",
  "Planificador de proyectos",
  "Especialista en marketing",
];

// Default system prompt template
const DEFAULT_SYSTEM_PROMPT = `Eres {{name}}, agente de IA siempre activo de {{owner}}.
Rol: {{role}}.
Trabajas como un compañero, no como un chat: las tareas se llevan de principio a fin
con tus herramientas reales y vuelves solo con el trabajo hecho o cuando hace falta
una decisión humana.
- Español, tono cercano y directo, sin paja.
- Consulta memoria y skills antes de cada tarea.
- Autonomía: nivel {{autonomy}}.
- Efectos externos/irreversibles (enviar/publicar/comprar/borrar): SIEMPRE aprobación.
- Entrega: resultado + qué hiciste + qué verificaste + siguiente paso.
- Honestidad radical: no inventas éxito ni datos.`;

export default function NewAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, workspace } = useAuth();
  
  // Form state
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🤖");
  const [color, setColor] = useState("#FF7A29");
  const [role, setRole] = useState("");
  const [personality, setPersonality] = useState("");
  const [instructions, setInstructions] = useState("");
  const [autonomy, setAutonomy] = useState<1 | 2 | 3>(2);
  const [modelName, setModelName] = useState("grok");
  const [modelBaseUrl, setModelBaseUrl] = useState("");
  const [modelKey, setModelKey] = useState("");
  const [showModelKey, setShowModelKey] = useState(false);
  const [useWorkspaceKey, setUseWorkspaceKey] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPersonalityPresets, setShowPersonalityPresets] = useState(false);

  // Generate preview
  const preview = (
    <span className="text-xl">
      <span className="text-2xl">{emoji}</span> {name || "Nuevo Agente"}
    </span>
  );

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del agente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!role.trim()) {
      toast({
        title: "Error",
        description: "El rol del agente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, send to API
      console.log("Creating agent:", {
        name,
        emoji,
        color,
        role,
        personality,
        instructions,
        autonomy,
        modelName,
        modelBaseUrl,
        modelKey: useWorkspaceKey ? null : modelKey,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "¡Éxito!",
        description: `Agente "${name}" creado correctamente`,
      });

      router.push("/agents");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el agente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, emoji, color, role, personality, instructions, autonomy, modelName, modelBaseUrl, modelKey, useWorkspaceKey, toast, router]);

  // Apply personality preset
  const applyPersonalityPreset = useCallback((preset: typeof personalityPresets[0]) => {
    setPersonality(preset.value);
    setShowPersonalityPresets(false);
  }, []);

  // Generate default instructions
  const generateDefaultInstructions = useCallback(() => {
    const defaultInstructions = DEFAULT_SYSTEM_PROMPT
      .replace("{{name}}", name || "Agente")
      .replace("{{role}}", role || "Asistente")
      .replace("{{owner}}", user?.name || "el usuario")
      .replace("{{autonomy}}", autonomy.toString());
    setInstructions(defaultInstructions);
  }, [name, role, autonomy, user?.name]);

  // Model suggestions
  const modelSuggestions = [
    { value: "grok", label: "Grok (xAI) - Recomendado" },
    { value: "gpt-4", label: "GPT-4 (OpenAI)" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (OpenAI)" },
    { value: "claude-3", label: "Claude 3 (Anthropic)" },
    { value: "claude-2", label: "Claude 2 (Anthropic)" },
    { value: "llama-3", label: "Llama 3 (Meta)" },
    { value: "mistral-large", label: "Mistral Large (Mistral)" },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/agents")}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nuevo Agente</h1>
            <p className="text-muted-foreground">
              Crea un agente de IA personalizado
            </p>
          </div>
        </div>

        {/* Preview */}
        <Card className="bg-gradient-to-r from-savvy-cream to-savvy-beige border-2 border-savvy-orange">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-2">{emoji}</div>
            <h2 className="text-xl font-bold">{name || "Nuevo Agente"}</h2>
            <p className="text-muted-foreground">{role || "Define un rol"}</p>
            <Badge 
              variant={autonomyDescriptions[autonomy].badge as "default" | "savvy" | "secondary"}
              className="mt-2 text-sm"
            >
              Nivel {autonomy} - {autonomyDescriptions[autonomy].title}
            </Badge>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Bot className="h-5 w-5 inline mr-2" />
                Información Básica
              </CardTitle>
              <CardDescription>
                Configura la identidad y apariencia de tu agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Asistente de Marketing"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="🤖"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-10 p-0 border-0"
                    />
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#FF7A29"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <div className="relative">
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ej: Asistente de estudios, Investigador web"
                    list="role-suggestions"
                    required
                  />
                  <datalist id="role-suggestions">
                    {roleSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Sparkles className="h-5 w-5 inline mr-2" />
                Personalidad
              </CardTitle>
              <CardDescription>
                Define cómo se comportará y comunicará tu agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="personality">Descripción de personalidad</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPersonalityPresets(!showPersonalityPresets)}
                  >
                    {showPersonalityPresets ? "Ocultar plantillas" : "Ver plantillas"}
                  </Button>
                </div>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="Ej: Analítico, detallado, enfocado en datos"
                  rows={3}
                />
              </div>

              {/* Personality presets */}
              {showPersonalityPresets && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-muted rounded-lg">
                  {personalityPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPersonalityPreset(preset)}
                      className="text-left p-2 rounded hover:bg-background transition-colors"
                    >
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Target className="h-5 w-5 inline mr-2" />
                Instrucciones
              </CardTitle>
              <CardDescription>
                Instrucciones específicas para guiar el comportamiento del agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Define instrucciones personalizadas para el agente..."
                    rows={8}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateDefaultInstructions}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generar instrucciones por defecto
                </Button>
              </div>

              {/* Autonomy level */}
              <div className="space-y-2">
                <Label>Nivel de Autonomía *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((level) => {
                    const desc = autonomyDescriptions[level as 1 | 2 | 3];
                    return (
                      <Card
                        key={level}
                        className={cn(
                          "p-4 cursor-pointer transition-all",
                          autonomy === level 
                            ? "border-savvy-orange bg-savvy-orange/10" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setAutonomy(level as 1 | 2 | 3)}
                      >
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Nivel {level}</CardTitle>
                              <CardDescription className="text-sm">
                                {desc.title}
                              </CardDescription>
                            </div>
                            <div
                              className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                autonomy === level && "border-savvy-orange"
                              )}
                            >
                              {autonomy === level && (
                                <div className="h-2 w-2 bg-savvy-orange rounded-full" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {desc.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Settings className="h-5 w-5 inline mr-2" />
                Configuración del Modelo
              </CardTitle>
              <CardDescription>
                Configura qué modelo LLM usará el agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertTitle>BYOK - Trae tu propia clave</AlertTitle>
                <AlertDescription>
                  Configura tu clave API en Ajustes → Modelo para que todos tus agentes la usen. 
                  O puedes configurar una clave específica para este agente.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="modelName">Modelo</Label>
                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelSuggestions.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelBaseUrl">URL Base (opcional)</Label>
                <Input
                  id="modelBaseUrl"
                  value={modelBaseUrl}
                  onChange={(e) => setModelBaseUrl(e.target.value)}
                  placeholder="Ej: https://api.grok.com/v1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useWorkspaceKey"
                    checked={useWorkspaceKey}
                    onChange={(e) => setUseWorkspaceKey(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="useWorkspaceKey" className="font-normal">
                    Usar clave API del workspace
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Si no marcas esta opción, el agente usará una clave API específica
                </p>
              </div>

              {!useWorkspaceKey && (
                <div className="space-y-2">
                  <Label htmlFor="modelKey">Clave API específica</Label>
                  <div className="relative">
                    <Input
                      id="modelKey"
                      type={showModelKey ? "text" : "password"}
                      value={modelKey}
                      onChange={(e) => setModelKey(e.target.value)}
                      placeholder="Pega tu clave API aquí"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowModelKey(!showModelKey)}
                      className="absolute right-1 top-1 h-6 w-6"
                    >
                      {showModelKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/agents")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="savvy"
              disabled={isSubmitting || !name.trim() || !role.trim()}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Creando..." : "Crear Agente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
