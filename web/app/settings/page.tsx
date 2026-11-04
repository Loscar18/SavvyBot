"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { User, Settings, Bell, CreditCard, Key, Globe, Clock, Sun, Moon, Shield, HelpCircle, Save, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";
import { Workspace, User as UserType } from "../../types";

const mockWorkspace: Workspace = {
  id: "workspace-1",
  name: "Mi Espacio de Trabajo",
  slug: "demo-workspace",
  plan: "pro",
  timezone: "Europe/Madrid",
  theme: "light",
  language: "es",
  billingEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser: UserType = {
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

const timezones = [
  { value: "Europe/Madrid", label: "Europe/Madrid (UTC+1/UTC+2)" },
  { value: "UTC", label: "UTC" },
  { value: "America/Mexico_City", label: "America/Mexico_City (UTC-6)" },
  { value: "America/New_York", label: "America/New_York (UTC-5/UTC-4)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8/UTC-7)" },
];

const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const plans = [
  { value: "free", label: "Free", maxAgents: 1, maxIntegrations: 2, monthlyTurns: 50, price: 0 },
  { value: "pro", label: "Pro", maxAgents: 10, maxIntegrations: 100, monthlyTurns: 2000, price: 20 },
  { value: "team", label: "Team", maxAgents: 100, maxIntegrations: 1000, monthlyTurns: 10000, price: 100 },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, workspace } = useAuth();
  
  // Form state
  const [workspaceName, setWorkspaceName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [modelBaseUrl, setModelBaseUrl] = useState("");
  const [modelName, setModelName] = useState("grok");
  const [modelKey, setModelKey] = useState("");
  const [showModelKey, setShowModelKey] = useState(false);
  const [composioKey, setComposioKey] = useState("");
  const [showComposioKey, setShowComposioKey] = useState(false);
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [stripeKey, setStripeKey] = useState("");
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form
  useEffect(() => {
    const currentWorkspace = workspace || mockWorkspace;
    const currentUser = user || mockUser;
    
    setWorkspaceName(currentWorkspace.name);
    setTimezone(currentWorkspace.timezone);
    setLanguage(currentWorkspace.language);
    setTheme(currentWorkspace.theme as "light" | "dark" | "system" || "light");
    setBillingEnabled(currentWorkspace.billingEnabled);
  }, [workspace, user]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // In production, send to API
      console.log("Saving settings:", {
        workspaceName,
        timezone,
        language,
        theme,
        modelBaseUrl,
        modelName,
        modelKey,
        composioKey,
        billingEnabled,
        stripeKey,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "¡Éxito!",
        description: "Configuración guardada correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate usage
  const currentPlan = plans.find((p) => p.value === (workspace?.plan || mockWorkspace.plan)) || plans[0];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ajustes</h1>
          <p className="text-muted-foreground">
            Configura tu espacio de trabajo y preferencias
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workspace" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workspace">
              <Settings className="h-4 w-4 mr-2" />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="model">
              <Key className="h-4 w-4 mr-2" />
              Modelo LLM
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Globe className="h-4 w-4 mr-2" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Facturación
            </TabsTrigger>
          </TabsList>

          {/* Workspace Settings */}
          <TabsContent value="workspace">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Workspace</CardTitle>
                <CardDescription>
                  Configura la información básica de tu espacio de trabajo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Nombre del Workspace</Label>
                  <Input
                    id="workspaceName"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Mi Espacio de Trabajo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona zona horaria" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all",
                        theme === "light" 
                          ? "border-savvy-orange bg-savvy-orange/10" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setTheme("light")}
                    >
                      <CardContent className="text-center">
                        <Sun className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm">Claro</p>
                        {theme === "light" && (
                          <div className="h-2 w-2 bg-savvy-orange rounded-full mx-auto mt-2" />
                        )}
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all",
                        theme === "dark" 
                          ? "border-savvy-orange bg-savvy-orange/10" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setTheme("dark")}
                    >
                      <CardContent className="text-center">
                        <Moon className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm">Oscuro</p>
                        {theme === "dark" && (
                          <div className="h-2 w-2 bg-savvy-orange rounded-full mx-auto mt-2" />
                        )}
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all",
                        theme === "system" 
                          ? "border-savvy-orange bg-savvy-orange/10" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setTheme("system")}
                    >
                      <CardContent className="text-center">
                        <Settings className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm">Sistema</p>
                        {theme === "system" && (
                          <div className="h-2 w-2 bg-savvy-orange rounded-full mx-auto mt-2" />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Button
                  variant="savvy"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Uso del Mes</CardTitle>
                <CardDescription>
                  Estadísticas de uso para el plan actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {currentPlan.maxAgents}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Agentes máximos
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {currentPlan.maxIntegrations}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Integraciones máximas
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {currentPlan.monthlyTurns}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Turnos mensuales
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {currentPlan.price}€
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Precio mensual
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant={currentPlan.value === "free" ? "secondary" : currentPlan.value === "pro" ? "savvy" : "default"}>
                    Plan: {currentPlan.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Settings */}
          <TabsContent value="model">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Modelo LLM</CardTitle>
                <CardDescription>
                  Configura tu clave API y modelo por defecto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertTitle>BYOK - Trae tu propia clave</AlertTitle>
                  <AlertDescription>
                    SavvyBot nunca paga por llamadas a LLM. Configura tu propia clave API 
                    y todos tus agentes la usarán por defecto.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="modelName">Modelo por defecto</Label>
                  <Select value={modelName} onValueChange={setModelName}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grok">Grok (xAI) - Recomendado</SelectItem>
                      <SelectItem value="gpt-4">GPT-4 (OpenAI)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</SelectItem>
                      <SelectItem value="claude-3">Claude 3 (Anthropic)</SelectItem>
                      <SelectItem value="claude-2">Claude 2 (Anthropic)</SelectItem>
                      <SelectItem value="llama-3">Llama 3 (Meta)</SelectItem>
                      <SelectItem value="mistral-large">Mistral Large (Mistral)</SelectItem>
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
                  <Label htmlFor="modelKey">Clave API</Label>
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
                      {showModelKey ? <X className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta clave se guardará cifrada (AES-256-GCM) en la base de datos
                  </p>
                </div>

                <Button
                  variant="savvy"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Integraciones</CardTitle>
                <CardDescription>
                  Configura claves para integraciones globales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertTitle>Clave de Composio</AlertTitle>
                  <AlertDescription>
                    La clave de Composio la configura el propietario de la plataforma. 
                    Todos los usuarios podrán usar las apps de Composio.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="composioKey">Clave API de Composio</Label>
                  <div className="relative">
                    <Input
                      id="composioKey"
                      type={showComposioKey ? "text" : "password"}
                      value={composioKey}
                      onChange={(e) => setComposioKey(e.target.value)}
                      placeholder="Pega tu clave de Composio aquí"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowComposioKey(!showComposioKey)}
                      className="absolute right-1 top-1 h-6 w-6"
                    >
                      {showComposioKey ? <X className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta clave se guardará cifrada (AES-256-GCM) en la base de datos
                  </p>
                </div>

                <Button
                  variant="savvy"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Facturación</CardTitle>
                <CardDescription>
                  Configura Stripe para habilitar pagos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertTitle>Módulo opcional</AlertTitle>
                  <AlertDescription>
                    SavvyBot funciona al 100% sin facturación. Activa este módulo solo 
                    si quieres cobrar a tus usuarios.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="billingEnabled"
                      checked={billingEnabled}
                      onChange={(e) => setBillingEnabled(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="billingEnabled" className="font-normal">
                      Habilitar módulo de facturación
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Al activar, los usuarios podrán suscribirse a planes de pago
                  </p>
                </div>

                {billingEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="stripeKey">Clave secreta de Stripe</Label>
                      <div className="relative">
                        <Input
                          id="stripeKey"
                          type={showStripeKey ? "text" : "password"}
                          value={stripeKey}
                          onChange={(e) => setStripeKey(e.target.value)}
                          placeholder="Pega tu clave secreta de Stripe aquí"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowStripeKey(!showStripeKey)}
                          className="absolute right-1 top-1 h-6 w-6"
                        >
                          {showStripeKey ? <X className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Esta clave se guardará cifrada (AES-256-GCM) en la base de datos
                      </p>
                    </div>

                    <Alert variant="info">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Webhook de Stripe</AlertTitle>
                      <AlertDescription>
                        Configura el webhook de Stripe en: /api/webhooks/stripe
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                <Button
                  variant="savvy"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Info icon for Alert
function Info({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
