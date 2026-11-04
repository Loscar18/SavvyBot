# SavvyBot v1.1

## 🌊 El WhatsApp de los agentes de IA

SavvyBot es una plataforma **multi-tenant**, **production-ready** y **comercializable** que te permite crear, personalizar y agrupar agentes de IA como si fuera WhatsApp. Cada usuario tiene su propio espacio de trabajo aislado donde puede gestionar agentes, chats, grupos, integraciones y rutinas.

## 🚀 Características Principales

### ✅ Multi-tenant con Aislamiento Total
- Cada usuario = un workspace completamente aislado
- **Row-Level Security (RLS)** en PostgreSQL
- Ninguna consulta cruza workspaces
- Datos 100% separados entre usuarios

### ✅ BYOK - Trae tu propia clave
- **Cero coste** para la plataforma
- Cada usuario configura su propia clave LLM (xAI, OpenAI, Anthropic, etc.)
- Las claves se guardan **cifradas (AES-256-GCM)** en la base de datos
- Sin clave configurada: modo demo con respuestas de plantilla

### ✅ Chat WhatsApp-like
- Interfaz familiar con burbujas de chat
- Typing indicators en tiempo real
- **Streaming SSE** para respuestas palabra a palabra
- Historial de conversaciones
- Búsqueda de chats

### ✅ Agentes Inteligentes
- CRUD completo de agentes sin tocar código
- Personalización: nombre, emoji, color, rol, personalidad
- **System prompt** editable con plantilla por defecto
- **Niveles de autonomía (N1, N2, N3)**
- Estado: online/trabajando/pausado
- Modelos LLM personalizados por agente

### ✅ Motor de Turnos
- Procesamiento asíncrono con **BullMQ + Redis**
- Máximo **15 pasos** por turno
- Loop agéntico: piensa → tool → observa → repite
- **Streaming SSE** al chat
- Eventos de actividad por cada tool usada

### ✅ Sistema de Aprobaciones
- **N1**: Todo requiere aprobación
- **N2**: Lectura libre, escritura con aprobación
- **N3**: Ejecución libre (excepto acciones irreversibles)
- Tarjetas de aprobación en el chat
- **Auditoría persistente** de todas las decisiones
- Acciones irreversibles (comprar/borrar) SIEMPRE requieren aprobación

### ✅ Memoria Persistente
- Notas por agente + hechos globales del workspace
- **Auto-resumen** tras cada tarea
- Editable en UI
- Sin credenciales jamás

### ✅ Skills
- CRUD por agente
- Objetivo, pasos, entradas/salidas, errores conocidos
- Botón "convertir el último trabajo en skill"

### ✅ Grupos de Agentes
- Creación como un grupo de WhatsApp
- Modos: **Todos** (cada miembro responde) o **Relevo** (coordinador delega)
- Chat de grupo con avatares por agente
- Silenciar miembros
- Mencionar agentes (@Vector hazlo tú)

### ✅ Integraciones

#### 🔗 Composio OAuth
- Catálogo de apps: Google Calendar, Gmail, Drive, Slack, GitHub, Notion, LinkedIn, Twitter/X
- OAuth **in-app** (sin tocar archivos de configuración)
- La clave API de Composio la configura el propietario de la plataforma

#### 🤖 MCP Servers
- Formulario con nombre, transporte (URL http/sse remoto)
- **tools/list** en vivo al guardar
- Estado de conexión con recheck automático
- Sin stdio en SaaS

#### 🌐 APIs Personalizadas
- Nombre, baseUrl, auth (bearer/header/query/none)
- Clave pegada en el formulario (cifrada en BD)
- Endpoints definidos en la UI
- Cada endpoint se convierte en tool para los agentes
- **Proxy server-side** para que las claves nunca viajen al cliente

#### 🔐 Matriz de Permisos
- Por agente: lectura libre / escritura con aprobación / bloqueada
- Selector rápido en la creación de grupos
- El agente solo recibe en el LLM las herramientas permitidas

### ✅ Rutinas
- Triggers: diarios, semanales, por horas, manuales, cron
- Asignables a agente o grupo
- Autonomía propia
- Interruptor on/off
- Log de ejecuciones
- **Auto-pausa** tras 2 fallos seguidos + notificación
- Horario silencioso configurable

### ✅ Notificaciones
- Web (toast)
- Push (Android)
- Eventos: aprobación pendiente, tarea terminada, rutina ejecutada

### ✅ Dashboard
- Estadísticas: agentes activos, hilos, integraciones, actividad
- Gráfica de actividad con **recharts**
- Panel de uso (turnos, tokens, herramientas)
- Avisos al 80% de uso

### ✅ Ajustes
- Exportar/importar configuración del workspace en JSON (sin secretos)
- Zona horaria
- Tema (claro/oscuro/sistema)
- Idioma
- BYOK: configuración de clave LLM
- Composio: configuración de clave API
- Stripe: configuración opcional
- Borrado de cuenta con los datos

### ✅ Android App
- **Capacitor** wrapper sobre la web app
- Misma base de código
- Notificaciones push
- Navegación móvil adaptada (bottom nav, hilos a pantalla completa)
- **GitHub Actions** para compilar APK
- Distribución vía GitHub Releases

## 🏗️ Stack Técnico

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes premium)
- **Recharts** (gráficas)
- **React Query** (gestión de estado server-side)

### Backend
- **Next.js API Routes**
- **Node.js**
- **Drizzle ORM**
- **PostgreSQL** (con RLS)
- **Redis + BullMQ** (colas)
- **JWT + refresh tokens** (auth)
- **Bcrypt** (hashing de contraseñas)

### Integraciones
- **Composio** (@composio/core)
- **MCP** (@modelcontextprotocol/sdk)
- **Stripe** (opcional)

### DevOps
- **Docker Compose**
- **GitHub Actions** (CI/CD + APK)
- **Capacitor** (Android)

## 📁 Estructura del Proyecto

```
savvybot/
├── web/                    # Aplicación Next.js
│   ├── app/               # App Router
│   │   ├── (main)/        # Layout principal
│   │   │   └── layout.tsx
│   │   ├── api/           # API Routes
│   │   │   ├── auth/      # Autenticación
│   │   │   ├── chat/      # Chat con SSE
│   │   │   └── ...
│   │   ├── agents/        # Gestión de agentes
│   │   ├── chat/          # Chat principal
│   │   ├── dashboard/     # Dashboard
│   │   ├── groups/        # Grupos
│   │   ├── integrations/  # Integraciones
│   │   ├── memory/        # Memoria
│   │   ├── routines/      # Rutinas
│   │   ├── settings/      # Ajustes
│   │   ├── skills/        # Skills
│   │   └── auth/          # Autenticación
│   ├── components/        # Componentes React
│   │   ├── chat/          # Componentes de chat
│   │   ├── dashboard/     # Componentes de dashboard
│   │   ├── layout/        # Layout components
│   │   ├── ui/            # shadcn/ui components
│   │   └── common/        # Componentes comunes
│   ├── hooks/             # React hooks
│   ├── lib/               # Librerías
│   │   ├── agents/        # Motor de agentes
│   │   ├── auth/          # Autenticación
│   │   ├── config.ts      # Configuración
│   │   ├── crypto/        # Cifrado
│   │   ├── db/            # Base de datos
│   │   ├── integrations/  # Integraciones
│   │   ├── queue/         # Colas
│   │   └── utils/         # Utilidades
│   ├── types/             # TypeScript types
│   ├── public/            # Assets estáticos
│   └── scripts/           # Scripts (migrate, seed)
├── worker/                # Worker BullMQ
│   ├── src/               # Código fuente
│   │   └── index.ts       # Procesamiento de jobs
│   └── Dockerfile
├── docker/                # Configuración Docker
│   └── postgres/          # Inicialización PostgreSQL
├── docker-compose.yml     # Docker Compose
├── package.json
├── README.md
└── DESPLIEGUE-GRATIS.md
```

## 🚀 Despliegue

### Requisitos
- **Docker** y **Docker Compose**
- **Node.js 18+** (para desarrollo)
- **PostgreSQL** (o Neon para 0€)
- **Redis** (o Upstash para 0€)

### Variables de Entorno

Crea un archivo `.env` en `/web`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/savvybot"

# Redis
REDIS_URL="redis://localhost:6379"

# Encryption (genera con: openssl rand -hex 32)
ENCRYPTION_KEY="tu_clave_de_cifrado_de_64_caracteres"

# Next.js
NEXTAUTH_SECRET="tu_secreto_para_nextauth"
NEXTAUTH_URL="http://localhost:3000"

# Opcional - Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Opcional - Composio (para el propietario de la plataforma)
COMPOSIO_API_KEY="tu_clave_de_composio"
```

### Docker Compose

```bash
# Iniciar todos los servicios
cd /workspace/savvybot
docker compose up -d

# Detener
 docker compose down
```

El sistema estará disponible en:
- **Web**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:5050 (user: admin@admin.com, pass: root)

### Migraciones y Seed

```bash
# Ejecutar migraciones
cd web
npm run db:migrate

# Insertar datos de demo
npm run db:seed
```

### Despliegue en Producción

Ver [DESPLIEGUE-GRATIS.md](./DESPLIEGUE-GRATIS.md) para instrucciones detalladas de despliegue en:
- **Oracle Cloud Free Tier** (0€/mes)
- **Neon** (PostgreSQL gratis)
- **Upstash** (Redis gratis)
- **Render** o **Fly.io** (alternativas)

## 📱 App Android

### Configuración

```bash
# Instalar Capacitor
cd web
npx cap add android

# Sincronizar
npx cap sync

# Abrir en Android Studio (opcional)
npx cap open android
```

### Compilar APK

El workflow de GitHub Actions (`.github/workflows/apk.yml`) compila automáticamente el APK al hacer push de una etiqueta:

```bash
# Crear etiqueta
git tag v1.0.0
git push origin v1.0.0
```

El APK se publicará en **GitHub Releases** listo para descargar.

### GitHub Actions Workflow

```yaml
name: Build APK

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      
      - name: Install dependencies
        run: |
          cd web
          npm ci
      
      - name: Build Next.js
        run: |
          cd web
          npm run build
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      
      - name: Install Capacitor
        run: |
          cd web
          npm install -g @capacitor/cli @capacitor/core
          npx cap add android
          npx cap sync
      
      - name: Build APK
        run: |
          cd web/android
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: savvybot-apk
          path: web/android/app/build/outputs/apk/release/*.apk
      
      - name: Publish Release
        uses: softprops/action-gh-release@v1
        with:
          files: web/android/app/build/outputs/apk/release/*.apk
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 🔐 Seguridad

### ✅ Lo que HACEMOS
- Todas las claves se cifran con **AES-256-GCM** antes de guardar en BD
- **Row-Level Security** en PostgreSQL para aislamiento multi-tenant
- Validación de inputs con **Zod** en cada endpoint
- Manejo de errores estructurados (nunca exponemos secrets)
- **JWT + refresh tokens** con expiración
- Rate limiting por workspace
- Logs estructurados sin información sensible

### ❌ Lo que NUNCA hacemos
- Guardar claves en texto plano
- Exponer claves en el cliente
- Mostrar claves en logs
- Incluir claves en JSON exportado
- Usar credenciales hardcodeadas
- Saltarnos el sistema de permisos

### 🛡️ Cifrado

Todas las claves se cifran usando AES-256-GCM:

```typescript
import { encrypt, decrypt } from "../lib/crypto";

// Cifrar
const ciphertext = encrypt("mi_clave_secreta", process.env.ENCRYPTION_KEY!);

// Descifrar
const plaintext = decrypt(ciphertext, process.env.ENCRYPTION_KEY!);
```

## 📊 Modelo de Datos

### Tablas Principales

```
┌─────────────────────┐
│       workspaces      │
├─────────────────────┤
│ id (PK)              │
│ name                 │
│ slug                 │
│ plan                 │
│ timezone             │
│ theme                │
│ language             │
│ billingEnabled       │
│ stripeCustomerId     │
│ settingsCiphertext   │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│         users         │
├─────────────────────┤
│ id (PK)              │
│ email                │
│ passwordHash         │
│ name                 │
│ workspaceId (FK)     │
│ role (owner/admin)   │
│ emailVerified        │
│ twoFactorEnabled     │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│        agents        │
├─────────────────────┤
│ id (PK)              │
│ workspaceId (FK)     │
│ name                 │
│ emoji                │
│ color                │
│ role                 │
│ personality          │
│ instructions         │
│ autonomy (1-3)       │
│ modelBaseUrl         │
│ modelName            │
│ modelKeyCiphertext   │
│ status               │
│ lastActivityAt       │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│        groups        │
├─────────────────────┤
│ id (PK)              │
│ workspaceId (FK)     │
│ name                 │
│ emoji                │
│ color                │
│ mode (todos/relevo)  │
│ coordinatorId (FK)   │
│ description          │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      group_members   │
├─────────────────────┤
│ id (PK)              │
│ groupId (FK)         │
│ agentId (FK)         │
│ muted                │
│ joinedAt             │
└─────────────────────┘

┌─────────────────────┐
│        threads       │
├─────────────────────┤
│ id (PK)              │
│ workspaceId (FK)     │
│ title                │
│ agentId (FK)         │
│ groupId (FK)         │
│ archived             │
│ pinned               │
│ lastMessageAt        │
│ unreadCount          │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       messages       │
├─────────────────────┤
│ id (PK)              │
│ threadId (FK)        │
│ authorType           │
│ authorId             │
│ agentId              │
│ content              │
│ modelUsed            │
│ approvalId           │
│ isStreaming          │
│ streamCompleted      │
│ toolCallId           │
│ metadata             │
│ createdAt            │
│ updatedAt            │
└─────────────────────┘

┌─────────────────────┐
│       memories       │
├─────────────────────┤
│ id (PK)              │
│ workspaceId (FK)     │
│ agentId (FK)         │
│ scope (global/agent) │
│ type (note/fact)     │
│ text                 │
│ sourceThreadId       │
│ sourceMessageId      │
│ createdAt            │
│ updatedAt            │
└─────────────────────┘

┌─────────────────────┐
│        skills        │
├─────────────────────┤
│ id (PK)              │
│ agentId (FK)         │
│ name                 │
│ goal                 │
│ steps                │
│ inputs               │
│ outputs              │
│ knownErrors          │
│ lastUsedAt           │
│ usageCount           │
│ createdAt            │
│ updatedAt            │
└─────────────────────┘

┌─────────────────────┐
│       routines       │
├─────────────────────┤
│ id (PK)              │
│ workspaceId (FK)     │
│ name                 │
│ description          │
│ targetType           │
│ targetId             │
│ triggerType          │
│ triggerValue         │
│ action               │
│ autonomy             │
│ enabled              │
│ lastRunAt            │
│ nextRunAt            │
│ consecutiveFailures │
│ quietHoursEnabled    │
│ quietHoursStart      │
│ quietHoursEnd        │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     routine_logs     │
├─────────────────────┤
│ id (PK)              │
│ routineId (FK)       │
│ status               │
│ summary              │
│ error                │
│ startedAt            │
│ finishedAt           │
│ createdAt            │
└─────────────────────┘

┌─────────────────────┐
│     integrations     │
├─────────────────────┤
│ id (PK)              │
│ workspaceId (FK)     │
│ kind (composio/mcp)  │
│ providerName         │
│ displayName          │
│ description          │
│ configCiphertext     │
│ status               │
│ errorMessage         │
│ lastCheckedAt        │
│ connectedAccountId    │
│ mcpType              │
│ mcpUrl               │
│ metadata             │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     api_endpoints    │
├─────────────────────┤
│ id (PK)              │
│ integrationId (FK)   │
│ method               │
│ path                 │
│ description          │
│ toolName             │
│ toolDescription      │
│ parametersSchema     │
│ createdAt            │
│ updatedAt            │
└─────────────────────┘

┌─────────────────────┐
│   tool_permissions   │
├─────────────────────┤
│ id (PK)              │
│ agentId (FK)         │
│ integrationId (FK)   │
│ toolName             │
│ scope (read/write)   │
│ createdAt            │
│ updatedAt            │
└─────────────────────┘

┌─────────────────────┐
│      approvals       │
├─────────────────────┤
│ id (PK)              │
│ threadId (FK)        │
│ workspaceId (FK)     │
│ agentId (FK)         │
│ toolName             │
│ payload              │
│ status               │
│ decidedBy            │
│ decidedAt            │
│ decisionReason       │
│ jobId                │
│ createdAt            │
│ updatedAt            │
└─────────────────────┘

┌─────────────────────┐
│         jobs         │
├─────────────────────┤
│ id (PK)              │
│ workspaceId (FK)     │
│ agentId (FK)         │
│ threadId (FK)        │
│ type                 │
│ status               │
│ data                 │
│ result               │
│ error                │
│ priority             │
│ attempts             │
│ maxAttempts          │
│ startedAt            │
│ completedAt          │
│ failedAt             │
│ createdAt            │
│ updatedAt            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      job_steps       │
├─────────────────────┤
│ id (PK)              │
│ jobId (FK)           │
│ stepNumber           │
│ type                 │
│ action               │
│ toolName             │
│ payload              │
│ result               │
│ error                │
│ status               │
│ createdAt            │
└─────────────────────┘
```

## 🎯 Criterios de Aceptación

### ✅ Multi-tenant
- [x] Dos cuentas distintas no ven NADA la una de la otra
- [x] Row-Level Security en PostgreSQL
- [x] workspaceId en todas las tablas

### ✅ Agentes Funcionales
- [x] Crear agente con personalización completa
- [x] Niveles de autonomía (N1, N2, N3)
- [x] Motor de turnos con 15 pasos
- [x] Streaming SSE en chat

### ✅ Integraciones
- [x] Composio OAuth in-app
- [x] MCP server connection (http/sse)
- [x] APIs personalizadas con cifrado de claves
- [x] Matriz de permisos por agente/tool

### ✅ Chat
- [x] Interfaz WhatsApp-like
- [x] Burbujas de chat
- [x] Typing indicators
- [x] Streaming palabra a palabra

### ✅ Grupos
- [x] Creación de grupos
- [x] Modos todos/relevo
- [x] Chat de grupo con múltiples agentes

### ✅ Rutinas y Skills
- [x] Creación de rutinas con triggers
- [x] CRUD de skills
- [x] Conversión de tareas a skills

### ✅ Notificaciones
- [x] Notificaciones web (toast)
- [x] Sistema de notificaciones push (Android)

### ✅ Despliegue
- [x] docker compose up + seed = producto navegable
- [x] APK compila con las instrucciones dadas
- [x] Guía de despliegue 0€/mes

### ✅ Seguridad
- [x] Ninguna clave/secret aparece nunca en el cliente
- [x] Ninguna clave/secret aparece en logs
- [x] Ninguna clave/secret en JSON exportado
- [x] Todas las claves cifradas (AES-256-GCM)

## 📖 Documentación

- [README.md](./README.md) - Este documento
- [DESPLIEGUE-GRATIS.md](./DESPLIEGUE-GRATIS.md) - Guía de despliegue 0€/mes
- [Arquitectura](#🏗️-stack-técnico) - Stack técnico
- [Modelo de Datos](#📊-modelo-de-datos) - Esquema de base de datos

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es **propietario** y de código cerrado. Todos los derechos reservados.

## 📞 Soporte

Para soporte, contacta con el equipo de SavvyBot:
- Email: soporte@savvybot.ai
- GitHub: https://github.com/Loscar18/SavvyBot

---

**SavvyBot v1.1** - Construido con ❤️ para la era de la IA
