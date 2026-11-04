// Application configuration for SavvyBot

import { Plan } from "../types";

// ============================================
// APP CONFIGURATION
// ============================================

export const APP_CONFIG = {
  // App metadata
  name: "SavvyBot",
  version: "1.1.0",
  description: "Plataforma comercial multi-tenant de agentes de IA",
  icon: "🌊",
  logo: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
  },
  
  // URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Environment
  env: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
  
  // Default settings
  defaultTimezone: "Europe/Madrid",
  defaultLanguage: "es",
  defaultTheme: "light",
  
  // Session settings
  session: {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    sessionExpiry: 30, // days
  },
  
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // File upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
    ],
  },
  
  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // Streaming
  streaming: {
    chunkSize: 1024,
    maxChunks: 100,
    timeout: 30000, // 30 seconds
  },
  
  // Agent execution
  agent: {
    maxSteps: 15,
    maxRetries: 3,
    timeout: 60000, // 60 seconds
    thinkTimeout: 10000, // 10 seconds
    toolTimeout: 15000, // 15 seconds
  },
  
  // Billing
  billing: {
    enabled: process.env.BILLING_ENABLED === "true",
    currency: "EUR",
    freePlan: "free",
  },
  
  // Features
  features: {
    auth: {
      emailPassword: true,
      googleOAuth: true,
      githubOAuth: false,
      twoFactor: true,
    },
    integrations: {
      composio: true,
      mcp: true,
      customApi: true,
    },
    notifications: {
      email: true,
      push: true,
      desktop: true,
    },
    analytics: true,
    auditLog: true,
  },
};

// ============================================
// DEFAULT PLANS
// ============================================

export const DEFAULT_PLANS: Plan[] = [
  {
    id: "free-plan-id",
    code: "free",
    name: "Free",
    description: "Plan gratuito para empezar",
    maxAgents: 1,
    maxIntegrations: 2,
    monthlyTurns: 50,
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "1 agente",
      "2 integraciones",
      "50 turnos/mes",
      "Chat básico",
      "Memoria limitada",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "pro-plan-id",
    code: "pro",
    name: "Pro",
    description: "Plan profesional para uso intensivo",
    maxAgents: 10,
    maxIntegrations: 50,
    monthlyTurns: 2000,
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      "Hasta 10 agentes",
      "Integraciones ilimitadas",
      "2.000 turnos/mes",
      "Rutinas programadas",
      "Grupos de agentes",
      "Prioridad en colas",
      "Soporte prioritario",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "team-plan-id",
    code: "team",
    name: "Team",
    description: "Plan para equipos colaborativos",
    maxAgents: 50,
    maxIntegrations: 100,
    monthlyTurns: 10000,
    priceMonthly: 99,
    priceYearly: 990,
    features: [
      "Hasta 50 agentes",
      "Integraciones ilimitadas",
      "10.000 turnos/mes",
      "Agentes compartidos",
      "Roles de equipo",
      "Colaboración en tiempo real",
      "Soporte 24/7",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================
// DEFAULT AGENTS FOR SEED
// ============================================

export const DEFAULT_AGENTS = [
  {
    name: "Vector 🧭",
    emoji: "🧭",
    color: "#FF7A29",
    role: "Asistente de estudios",
    personality: "Paciente, metódico y detallista. Le encanta explicar conceptos complejos de forma sencilla.",
    autonomy: 2,
    modelName: "grok",
    instructions: `
Eres Vector, asistente de estudios siempre activo.
Tu rol es ayudar a los estudiantes a entender conceptos, resolver problemas y organizar su aprendizaje.
- Explica los conceptos de forma clara y con ejemplos prácticos.
- Ayuda a crear planes de estudio efectivos.
- Proporciona recursos útiles y ejercicios prácticos.
- Sé paciente y alienta al estudiante.
- Si no estás seguro de algo, di que lo investigarás.
`,
  },
  {
    name: "Scout 🔎",
    emoji: "🔎",
    color: "#4A90E2",
    role: "Investigador web",
    personality: "Curioso, rápido y exhaustivo. Le encanta buscar información y encontrar respuestas.",
    autonomy: 2,
    modelName: "grok",
    instructions: `
Eres Scout, investigador web siempre activo.
Tu rol es buscar información, verificar datos y proporcionar respuestas precisas.
- Busca información en múltiples fuentes.
- Verifica la precisión de los datos encontrados.
- Proporciona fuentes y referencias.
- Sé crítico con la información.
- Si no encuentras una respuesta clara, indícalo.
`,
  },
  {
    name: "Faro 📬",
    emoji: "📬",
    color: "#7ED321",
    role: "Organizador de bandeja de entrada",
    personality: "Organizado, eficiente y proactivo. Le encanta mantener las cosas en orden.",
    autonomy: 2,
    modelName: "grok",
    instructions: `
Eres Faro, organizador de bandeja de entrada siempre activo.
Tu rol es ayudar a gestionar correos electrónicos, organizar tareas y mantener la bandeja de entrada limpia.
- Clasifica y prioriza correos electrónicos.
- Crea resúmenes de conversaciones.
- Sugiere respuestas rápidas.
- Ayuda a organizar tareas relacionadas con los correos.
- Sé proactivo en la organización.
`,
  },
];

// ============================================
// DEFAULT GROUP FOR SEED
// ============================================

export const DEFAULT_GROUP = {
  name: "Equipo Amanecer 🌅",
  emoji: "🌅",
  color: "#BD10E0",
  mode: "relevo" as const,
  description: "Equipo de agentes que trabajan en modo relevo para tareas complejas",
};

// ============================================
// DEFAULT ROUTINES FOR SEED
// ============================================

export const DEFAULT_ROUTINES = [
  {
    name: "Resumen diario",
    description: "Genera un resumen de todas las actividades del día",
    targetType: "agent" as const,
    triggerType: "daily" as const,
    triggerValue: "09:00",
    action: "Generar resumen diario de actividades, mensajes y tareas completadas",
    autonomy: 2,
    enabled: true,
    quietHoursEnabled: false,
  },
  {
    name: "Limpieza semanal",
    description: "Limpia archivos temporales y organiza la memoria",
    targetType: "agent" as const,
    triggerType: "weekly" as const,
    triggerValue: "sunday 22:00",
    action: "Eliminar archivos temporales, organizar memoria y optimizar el almacenamiento",
    autonomy: 2,
    enabled: true,
    quietHoursEnabled: false,
  },
];

// ============================================
// DEFAULT SKILL FOR SEED
// ============================================

export const DEFAULT_SKILL = {
  name: "Resumir conversación",
  goal: "Crear un resumen claro y conciso de una conversación",
  steps: [
    "Leer todos los mensajes de la conversación",
    "Identificar los puntos principales",
    "Organizar los puntos por orden de importancia",
    "Crear un resumen coherente",
    "Verificar que no se haya omitido información importante",
  ],
  inputs: {
    threadId: "ID del hilo de conversación",
    maxLength: "Longitud máxima del resumen (opcional)",
  },
  outputs: {
    summary: "Resumen de la conversación",
    keyPoints: "Puntos clave identificados",
  },
  knownErrors: [
    "Puede omitir detalles importantes si el resumen es demasiado corto",
    "Puede incluir información irrelevante si no se filtra correctamente",
  ],
};

// ============================================
// DEFAULT INTEGRATIONS FOR SEED
// ============================================

export const DEFAULT_INTEGRATIONS = [
  {
    kind: "composio" as const,
    providerName: "google_calendar",
    displayName: "Google Calendar",
    description: "Integración con Google Calendar para gestionar eventos",
    config: {
      appId: "google_calendar",
      connectedAt: new Date().toISOString(),
    },
    status: "connected" as const,
  },
];

// ============================================
// MESSAGES FOR SEED
// ============================================

export const DEFAULT_MESSAGES = [
  {
    content: "Hola, ¿qué tal estás? Me gustaría que me ayudarás a organizar mi semana.",
    authorType: "user" as const,
  },
  {
    content: "¡Hola! Claro que sí. Para ayudarte a organizar tu semana, necesito saber qué tareas tienes pendientes y cuáles son tus prioridades. ¿Podrías contarme más?",
    authorType: "agent" as const,
    modelUsed: "grok",
  },
  {
    content: "Tengo varias reuniones, algunos correos que responder y un informe que terminar.",
    authorType: "user" as const,
  },
  {
    content: "Perfecto. Vamos a organizar esto. Primero, ¿cuántas reuniones tienes y en qué días? También necesito saber las fechas límite para el informe y los correos.",
    authorType: "agent" as const,
    modelUsed: "grok",
  },
];

// ============================================
// THEME CONFIGURATION
// ============================================

export const THEME_CONFIG = {
  light: {
    background: "#FAF6F0", // Cream
    foreground: "#1a1a1a",
    card: "#ffffff",
    cardForeground: "#1a1a1a",
    primary: "#FF7A29", // Orange
    primaryForeground: "#ffffff",
    secondary: "#F5E6D3", // Beige
    secondaryForeground: "#1a1a1a",
    muted: "#D4C4A8", // Warm gray
    mutedForeground: "#666666",
    accent: "#FF7A29",
    accentForeground: "#ffffff",
    destructive: "#D0021B",
    destructiveForeground: "#ffffff",
    border: "#E5E5E5",
    input: "#E5E5E5",
    ring: "#FF7A29",
    radius: "16px",
    shadow: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
  },
  dark: {
    background: "#1a1a1a",
    foreground: "#f5f5f5",
    card: "#2a2a2a",
    cardForeground: "#f5f5f5",
    primary: "#FF7A29",
    primaryForeground: "#ffffff",
    secondary: "#3a3a3a",
    secondaryForeground: "#f5f5f5",
    muted: "#5a5a5a",
    mutedForeground: "#999999",
    accent: "#FF7A29",
    accentForeground: "#ffffff",
    destructive: "#D0021B",
    destructiveForeground: "#ffffff",
    border: "#404040",
    input: "#404040",
    ring: "#FF7A29",
    radius: "16px",
    shadow: "0 2px 15px -3px rgba(0, 0, 0, 0.3)",
  },
};

// ============================================
// MODEL CONFIGURATION
// ============================================

export const MODEL_CONFIG = {
  default: {
    name: "grok",
    baseUrl: "https://api.x.ai/v1",
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
  },
  supported: [
    {
      id: "grok",
      name: "Grok",
      provider: "xAI",
      baseUrl: "https://api.x.ai/v1",
      maxTokens: 8192,
      supportsStreaming: true,
      supportsTools: true,
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      maxTokens: 16384,
      supportsStreaming: true,
      supportsTools: true,
    },
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      maxTokens: 8192,
      supportsStreaming: true,
      supportsTools: true,
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      maxTokens: 4096,
      supportsStreaming: true,
      supportsTools: true,
    },
    {
      id: "claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      maxTokens: 4096,
      supportsStreaming: true,
      supportsTools: true,
    },
    {
      id: "claude-3-haiku",
      name: "Claude 3 Haiku",
      provider: "Anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      maxTokens: 2048,
      supportsStreaming: true,
      supportsTools: true,
    },
    {
      id: "llama-3.1-70b",
      name: "Llama 3.1 70B",
      provider: "Meta",
      baseUrl: "https://api.llama.ai/v1",
      maxTokens: 8192,
      supportsStreaming: true,
      supportsTools: false,
    },
    {
      id: "mistral-large",
      name: "Mistral Large",
      provider: "Mistral AI",
      baseUrl: "https://api.mistral.ai/v1",
      maxTokens: 8192,
      supportsStreaming: true,
      supportsTools: true,
    },
  ],
};

// ============================================
// COMPOSIO APP CATALOG
// ============================================

export const COMPOSIO_APP_CATALOG = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Gestiona eventos y calendarios de Google",
    category: "Productividad",
    icon: "📅",
    tools: [
      "create_event",
      "list_events",
      "update_event",
      "delete_event",
      "get_calendar",
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Envía y recibe correos electrónicos",
    category: "Comunicación",
    icon: "📧",
    tools: [
      "send_email",
      "list_emails",
      "get_email",
      "delete_email",
      "create_draft",
    ],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Gestiona archivos en Google Drive",
    category: "Almacenamiento",
    icon: "💾",
    tools: [
      "create_file",
      "list_files",
      "get_file",
      "update_file",
      "delete_file",
    ],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Envía mensajes y gestiona canales de Slack",
    category: "Comunicación",
    icon: "💬",
    tools: [
      "post_message",
      "list_channels",
      "get_channel_history",
      "get_user",
    ],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Gestiona repositorios y issues de GitHub",
    category: "Desarrollo",
    icon: "🐙",
    tools: [
      "create_issue",
      "list_issues",
      "get_issue",
      "update_issue",
      "create_pull_request",
    ],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Gestiona páginas y bases de datos de Notion",
    category: "Productividad",
    icon: "📝",
    tools: [
      "create_page",
      "list_pages",
      "get_page",
      "update_page",
      "search",
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Gestiona conexiones y publicaciones de LinkedIn",
    category: "Redes Sociales",
    icon: "🔗",
    tools: [
      "create_post",
      "get_profile",
      "list_connections",
    ],
  },
  {
    id: "twitter",
    name: "Twitter/X",
    description: "Gestiona tweets y timeline de Twitter",
    category: "Redes Sociales",
    icon: "🐦",
    tools: [
      "create_tweet",
      "get_tweet",
      "list_tweets",
      "get_user",
    ],
  },
];

// ============================================
// EXPORT
// ============================================

export default {
  APP_CONFIG,
  DEFAULT_PLANS,
  DEFAULT_AGENTS,
  DEFAULT_GROUP,
  DEFAULT_ROUTINES,
  DEFAULT_SKILL,
  DEFAULT_INTEGRATIONS,
  DEFAULT_MESSAGES,
  THEME_CONFIG,
  MODEL_CONFIG,
  COMPOSIO_APP_CATALOG,
};
