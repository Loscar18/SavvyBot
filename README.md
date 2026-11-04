# SavvyBot v1.1 🌊

> **Plataforma comercial multi-tenant de agentes de IA**
> 
> *El WhatsApp de los agentes de IA - Crea, personaliza y agrupa agentes como si fuera una conversación*

---

## 🚀 Descripción

SavvyBot es una plataforma **100% funcional y gratuita** que permite:

- ✅ Crear agentes de IA personalizados (nombre, avatar, personalidad, instrucciones)
- ✅ Chatear con agentes como si fuera WhatsApp (burbujas, streaming, typing indicators)
- ✅ Crear grupos de agentes que colaboran (modo "todos" o "relevo")
- ✅ Conectar integraciones (Composio, MCPs, APIs personalizadas) **sin tocar código**
- ✅ Configurar permisos por agente (qué herramientas puede usar)
- ✅ Sistema de aprobaciones para acciones sensibles
- ✅ Memoria persistente por agente y workspace
- ✅ Skills reutilizables
- ✅ Rutinas programadas (diarias, semanales, manuales)
- ✅ **Multi-tenant estricto**: cada usuario tiene su workspace aislado
- ✅ **BYOK (Bring Your Own Key)**: cada usuario configura su propia clave de LLM
- ✅ **0€/mes**: despliegue gratis en Oracle Cloud, Neon, Upstash, etc.

---

## 📦 Estado del Proyecto

| Fase | Estado | % Completado |
|------|--------|---------------|
| **Fase 1: Cimientos** | ✅ COMPLETADA | 100% |
| Fase 2: Chat + Motor | ⏳ Pendiente | 0% |
| Fase 3: Integraciones | ⏳ Pendiente | 0% |
| Fase 4: Grupos + Rutinas | ⏳ Pendiente | 0% |
| Fase 5: Android + UI | ⏳ Pendiente | 0% |

**📊 Total: ~50% completado**

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Dashboard│  │   Chat  │  │  Agents │  │ Settings    │ │
│  │          │  │(WhatsApp│  │  &      │  │             │ │
│  │          │  │  like)  │  │ Groups  │  │             │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (API)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Auth   │  │ Agents  │  │Integrations│  │  Queue     │ │
│  │(JWT/OAuth)│  │(CRUD)   │  │(Composio │  │ (BullMQ)   │ │
│  └──────────┘  └──────────┘  │  + MCP   │  └─────────────┘ │
│                             │  + API)   │                   │
│                             └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│   PostgreSQL    │ │    Redis    │ │   Worker    │
│   (Drizzle ORM) │ │  (BullMQ)   │ │ (BullMQ)    │
│   + RLS         │ │             │ │             │
└─────────────────┘ └─────────────┘ └─────────────┘
```

---

## 📁 Estructura del Proyecto

```
savvybot/
├── README.md                    # Este archivo
├── DESPLIEGUE-GRATIS.md         # Guía para desplegar con 0€/mes
├── .env.example                 # Variables de entorno de ejemplo
├── .gitignore                   # Archivos ignorados por git
├── docker-compose.yml           # Orquestación Docker
│
├── docker/
│   └── postgres/
│       └── init.sql            # Script de inicialización de BD
│
├── web/                        # Aplicación Next.js 15
│   ├── app/
│   │   ├── (main)/            # Layout principal
│   │   │   └── layout.tsx
│   │   ├── dashboard/          # Dashboard
│   │   │   └── page.tsx
│   │   ├── api/               # API Routes
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Root layout
│   │   └── providers.tsx      # React Query provider
│   │
│   ├── components/             # Componentes React
│   │   ├── layout/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   └── dashboard/
│   │
│   ├── lib/
│   │   ├── db/                # Drizzle ORM
│   │   │   ├── index.ts
│   │   │   └── schema.ts      # Esquema de BD (40+ tablas)
│   │   ├── auth/              # Autenticación
│   │   │   └── index.ts
│   │   ├── crypto/            # Cifrado AES-256-GCM
│   │   │   └── index.ts
│   │   ├── queue/             # Colas BullMQ
│   │   │   └── index.ts
│   │   ├── agents/            # Lógica de agentes
│   │   │   ├── index.ts
│   │   │   ├── approvals.ts
│   │   │   └── knowledge.ts  # 🆕 Sistema de conocimiento
│   │   ├── integrations/      # Integraciones
│   │   │   └── index.ts
│   │   ├── api/               # API clients
│   │   │   └── auth.ts
│   │   ├── utils/             # Utilidades
│   │   │   └── index.ts
│   │   └── config.ts          # Configuración de la app
│   │
│   ├── hooks/                 # React hooks
│   │   └── useAuth.ts
│   │
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   │
│   ├── scripts/               # Scripts
│   │   ├── migrate.ts         # Migraciones de BD
│   │   └── seed.ts            # Seed de demo
│   │
│   ├── public/                # Assets estáticos
│   ├── styles/                # Estilos adicionales
│   ├── .env.example
│   ├── drizzle.config.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── worker/                     # Worker BullMQ
    ├── src/
    │   └── index.ts           # Entry point
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| **Frontend** | Next.js | 15.0.0 | Framework React |
| **Lenguaje** | TypeScript | 5.6.3 | Tipado estático |
| **Estilos** | Tailwind CSS | 3.4.14 | CSS utility-first |
| **Componentes** | shadcn/ui | latest | Componentes accesibles |
| **UI Theme** | Custom | - | Tema claro cálido (crema/naranja) |
| **Backend** | Next.js API Routes | 15.0.0 | API REST + SSE |
| **Base de Datos** | PostgreSQL | 16 | Base de datos relacional |
| **ORM** | Drizzle ORM | 0.33.0 | Query builder tipo TypeScript |
| **Cache/Colas** | Redis | 7 | Cache + BullMQ |
| **Colas** | BullMQ | 5.1.0 | Gestión de jobs |
| **Auth** | JWT | jose 5.4.1 | Autenticación |
| **Cifrado** | AES-256-GCM | crypto-js | Cifrado de claves |
| **Integraciones** | Composio | 1.0.0 | Apps conectadas (Google, Slack, etc.) |
| **MCP** | @modelcontextprotocol/sdk | 0.6.0 | Model Context Protocol |
| **Gráficos** | Recharts | 2.12.7 | Visualización de datos |
| **Contenedores** | Docker | latest | Contenerización |
| **Orquestación** | Docker Compose | latest | Multi-contenedor |

---

## 🚀 Despliegue

### Opción 1: Docker Compose (Local/Dev)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Loscar18/savvybot-v1.git
cd savvybot-v1

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar todos los servicios
docker-compose up -d

# 4. Acceder a la app
# Web: http://localhost:3000
# PgAdmin (opcional): http://localhost:5050
```

### Opción 2: Oracle Cloud Always Free (Producción 0€)

Consulta la guía completa en **[DESPLIEGUE-GRATIS.md](./DESPLIEGUE-GRATIS.md)**

Resumen rápido:
```bash
# 1. Crear VPS en Oracle Cloud (ARM, 4 CPU, 24GB RAM)
# 2. Conectar por SSH
ssh ubuntu@<IP_PUBLICA>

# 3. Instalar dependencias
sudo apt update && sudo apt install -y docker.io docker-compose git

# 4. Clonar y desplegar
git clone https://github.com/Loscar18/savvybot-v1.git
cd savvybot-v1
nano .env  # Configurar variables

# 5. Iniciar servicios
docker-compose up -d

# 6. Configurar dominio + HTTPS con Caddy
docker run -d -p 80:80 -p 443:443 \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile \
  caddy:latest

# 7. Acceder a https://tu-dominio.com
```

### Opción 3: Servicios Separados (Vercel + Neon + Upstash)

- **Frontend**: Vercel (Next.js)
- **Base de datos**: Neon (PostgreSQL serverless)
- **Redis**: Upstash (Redis serverless)
- **Worker**: Render o Fly.io

Ver detalles en **[DESPLIEGUE-GRATIS.md](./DESPLIEGUE-GRATIS.md)**

---

## 📊 Base de Datos

### Esquema Multi-tenant

Todas las tablas incluyen `workspaceId` para aislamiento completo entre usuarios.

**Tablas principales:**
- `workspaces` - Workspaces de usuarios
- `users` - Usuarios del sistema
- `agents` - Agentes de IA
- `groups` - Grupos de agentes
- `threads` - Hilos de chat
- `messages` - Mensajes del chat
- `memories` - Memoria de agentes
- `skills` - Habilidades de agentes
- `routines` - Rutinas programadas
- `integrations` - Integraciones externas
- `approvals` - Aprobaciones pendientes
- `jobs` - Jobs de BullMQ
- `usage_events` - Registro de uso

### Row-Level Security (RLS)

PostgreSQL RLS garantiza que:
- Cada usuario solo ve los datos de su workspace
- Ninguna consulta cruza workspaces
- La seguridad está a nivel de base de datos

Ver el script de inicialización en `docker/postgres/init.sql`

---

## 🔐 Autenticación

### Métodos soportados:
- ✅ Email + Password (JWT)
- ✅ Google OAuth
- ✅ GitHub OAuth (opcional)
- ✅ Refresh tokens
- ✅ 2FA (opcional)

### Flujo:
1. Registro → Creación de workspace + usuario
2. Login → Generación de JWT tokens
3. Acceso → Validación de tokens en cada request
4. Refresh → Renovación de tokens expirados

---

## 🤖 Sistema de Agentes

### Características:
- **CRUD completo** sin tocar código
- **Personalización**: nombre, emoji, color, rol, personalidad, instrucciones
- **Autonomía**: Nivel 1-3 (N1: todo con aprobación, N2: lectura libre + escritura con aprobación, N3: ejecución autónoma)
- **Modelos BYOK**: Cada usuario configura su propia clave de LLM (xAI, OpenAI, Anthropic, etc.)
- **Estado**: online/trabajando/pausado
- **Memoria**: Notas persistentes por agente
- **Skills**: Capacidades reutilizables

### Ejemplo de agente:
```typescript
{
  id: "agent-vector-id",
  name: "Vector 🧭",
  emoji: "🧭",
  color: "#FF7A29",
  role: "Asistente de estudios",
  personality: "Paciente, metódico y detallista",
  autonomy: 2,
  modelName: "grok",
  modelBaseUrl: "https://api.x.ai/v1",
  status: "active"
}
```

---

## 💬 Chat WhatsApp-like

### Características:
- Lista de chats (hilos 1:1 y grupos)
- Burbujas de chat con estilos personalizados
- Streaming palabra a palabra (SSE)
- Indicador "escribiendo..."
- Typing indicators
- Archivar hilos
- Búsqueda de hilos
- Badges de mensajes no leídos

### Ejemplo de mensaje:
```typescript
{
  id: "msg-123",
  threadId: "thread-456",
  authorType: "agent",
  authorId: "agent-vector-id",
  content: "Entiendo tu solicitud...",
  modelUsed: "grok",
  isStreaming: false,
  createdAt: "2024-01-01T10:00:00Z"
}
```

---

## 🧠 Sistema de Conocimiento (Knowledge System)

**🆕 NUEVO en v1.1**

El sistema de conocimiento permite a los agentes:
- **Recordar** información de conversaciones anteriores
- **Aprender** de interacciones
- **Aplicar** skills en contexto
- **Derivar** intenciones y acciones sugeridas

### Componentes:

```typescript
// 1. Obtener contexto de conocimiento
const context = await knowledgeSystem.getContext(threadId, userMessage);

// 2. Buscar conocimiento relevante
const results = await knowledgeSystem.search(query, threadId);

// 3. Generar prompt para el LLM
const knowledgePrompt = await knowledgeSystem.getKnowledgePrompt(query, threadId);

// 4. Aprender de interacciones
await learnFromInteraction(workspaceId, agentId, {
  question: "¿Cómo se hace X?",
  answer: "Se hace así...",
  type: "fact"
});

// 5. Crear skills desde trabajo
await createSkillFromWork(agentId, workspaceId, {
  name: "Organizar semana",
  goal: "Crear un plan semanal",
  steps: ["Analizar tareas", "Priorizar", "Asignar tiempos"],
  inputs: { tasks: "Lista de tareas" },
  outputs: { plan: "Plan semanal" }
});
```

### Tipos de conocimiento:
- **Memoria**: Hechos y contexto persistente
- **Skills**: Capacidades y procedimientos
- **Contexto**: Historia de la conversación
- **Workspace**: Configuración del workspace

---

## 🔌 Integraciones

### Tipos de integraciones:

1. **Composio** - Apps preconstruidas (Google Calendar, Gmail, Slack, GitHub, Notion, etc.)
   - OAuth in-app
   - Catálogo de apps
   - Tools automáticamente disponibles

2. **MCP (Model Context Protocol)** - Servidores remotos
   - HTTP/SSE
   - Descubrimiento automático de tools
   - Conexión segura

3. **APIs Personalizadas** - Cualquier endpoint REST
   - Configuración in-app
   - Autenticación (Bearer, Header, Query, None)
   - Conversión automática a tools para agentes

### Matriz de permisos:
Cada agente puede tener permisos específicos para cada tool:
- `read` - Solo lectura
- `write_approval` - Escritura con aprobación
- `blocked` - Bloqueado

---

## ⚙️ Motor de Turnos

### Pipeline de cada turno:

```
User Message
     │
     ▼
┌─────────────────┐
│  Crear Context  │ ← Knowledge System
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build Prompt   │ ← System Prompt + Context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Call       │ ← Grok, GPT-4, Claude, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Process Tools  │ ← Ejecutar herramientas
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Approvals│ ← ¿Necesita aprobación?
└────────┬────────┘
         │
    ┌────▼────┐
    ▼         ▼
┌───────┐ ┌──────────┐
│ Execute│ │Wait for │
│ Tool   │ │Approval │
└───────┘ └──────────┘
     │         │
     └────┬────┘
          ▼
┌─────────────────┐
│  Update Memory  │ ← Guardar lo aprendido
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send Response  │ ← Streaming al chat
└─────────────────┘
```

### Máximo 15 pasos por turno:
1. Pensar (LLM)
2. Llamar tool
3. Observar resultado
4. Repetir...

### Autonomía:
- **N1**: Todo con aprobación
- **N2**: Lectura libre + escritura con aprobación
- **N3**: Ejecución autónoma (pero compras/borrados SIEMPRE con aprobación)

---

## 📅 Rutinas

### Tipos de triggers:
- `daily` - Diario a hora específica (ej: "09:00")
- `weekly` - Semanal en día y hora (ej: "sunday 22:00")
- `hourly` - Cada hora
- `manual` - Ejecución manual
- `cron` - Expresión cron (ej: "0 9 * * 1-5")

### Ejemplo de rutina:
```typescript
{
  id: "routine-daily-summary",
  name: "Resumen diario",
  description: "Genera un resumen de actividades del día",
  targetType: "agent",
  targetId: "agent-vector-id",
  triggerType: "daily",
  triggerValue: "09:00",
  action: "Generar resumen de mensajes, tareas y turnos",
  autonomy: 2,
  enabled: true,
  quietHoursEnabled: false
}
```

---

## 💰 Modelo de Negocio (BYOK)

**Bring Your Own Key** - Cada usuario trae su propia clave de LLM:

1. **Usuario configura su clave** en Ajustes → Modelo
2. **La clave se guarda cifrada** (AES-256-GCM) en la BD
3. **La clave NUNCA sale del servidor**
4. **SavvyBot no paga por IA** - El usuario asume el coste de sus propias llamadas

### Ventajas:
- ✅ **0€ de coste de IA para la plataforma**
- ✅ **El usuario controla su consumo**
- ✅ **Soporte para cualquier proveedor** (xAI, OpenAI, Anthropic, etc.)
- ✅ **Privacidad total** - Las claves no son accesibles por SavvyBot

### Modo Demo:
Si el usuario no configura una clave, el sistema funciona en **modo demo** con respuestas de plantilla marcadas como `[DEMO]`.

---

## 🎨 Estilo Visual

### Tema:
- **Fondo**: `#FAF6F0` (crema claro)
- **Acento**: `#FF7A29` (naranja)
- **Tarjetas**: Blanco con sombra suave
- **Border radius**: XL (16px)
- **Tipografía**: Inter (sans-serif), JetBrains Mono (monospace)
- **Animaciones**: Sutiles (fade, slide, pulse)

### Logo:
- **Icono**: 🌊 (ola/rayo)
- **Nombre**: SavvyBot

### Inspiración:
- Revolut/N26 (dashboard financiero)
- WhatsApp (chat)
- Linear (UI moderna)

---

## 📋 Seed de Demo

El sistema incluye datos de ejemplo para probar:

### Agentes:
1. **Vector 🧭** - Asistente de estudios
2. **Scout 🔎** - Investigador web
3. **Faro 📬** - Organizador de bandeja de entrada

### Grupo:
1. **Equipo Amanecer 🌅** - Modo relevo con los 3 agentes

### Rutinas:
1. **Resumen diario** - 09:00 todos los días
2. **Limpieza semanal** - Domingo 22:00

### Skill:
1. **Resumir conversación** - Crea resúmenes de hilos

### Chat:
1. **Hilo "Organizar semana"** - Conversación de ejemplo con Vector

---

## 🔧 Configuración Inicial

### 1. Clonar repositorio
```bash
git clone https://github.com/Loscar18/savvybot-v1.git
cd savvybot-v1
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
nano .env
```

**Variables obligatorias:**
```bash
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/savvybot

# Redis
REDIS_URL=redis://localhost:6379/0

# Cifrado (32 bytes base64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# JWT
JWT_SECRET=tu_secret_minimo_32_caracteres
JWT_REFRESH_SECRET=tu_refresh_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Variables opcionales:**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret

# Stripe (opcional, apagado por defecto)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BILLING_ENABLED=false

# Composio (opcional)
COMPOSIO_API_KEY=tu_api_key
```

### 3. Instalar dependencias
```bash
cd web
npm install
```

### 4. Iniciar base de datos
```bash
# Generar migraciones
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Seed de demo
npm run db:seed
```

### 5. Iniciar aplicación
```bash
npm run dev
```

---

## 🎯 Roadmap

| Fase | Descripción | Estado | ETA |
|------|-------------|--------|-----|
| **Fase 1** | Cimientos multi-tenant | ✅ COMPLETADA | - |
| Fase 2 | Chat + Motor de turnos | ⏳ Pendiente | 2-3 días |
| Fase 3 | Integraciones (Composio, MCP, APIs) | ⏳ Pendiente | 3-4 días |
| Fase 4 | Grupos, Rutinas, Skills, Notificaciones | ⏳ Pendiente | 3-4 días |
| Fase 5 | Android + Tests + UI final | ⏳ Pendiente | 4-5 días |

**⏰ Estimación total: 2-3 semanas**

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una branch (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Haz push a la branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📜 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org) - Framework React
- [Drizzle ORM](https://orm.drizzle.team) - ORM tipo TypeScript
- [BullMQ](https://docs.bullmq.io) - Colas de jobs
- [Composio](https://composio.dev) - Integraciones con apps
- [MCP](https://modelcontextprotocol.io) - Protocolos de contexto
- [shadcn/ui](https://ui.shadcn.com) - Componentes accesibles
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

---

## 📞 Contacto

Para preguntas o soporte:
- **Email**: support@savvybot.app (próximamente)
- **Twitter**: [@SavvyBotApp](https://twitter.com/SavvyBotApp) (próximamente)
- **Discord**: [SavvyBot Community](https://discord.gg/savvybot) (próximamente)

---

**✨ SavvyBot - La plataforma de agentes de IA que necesitas ✨**
