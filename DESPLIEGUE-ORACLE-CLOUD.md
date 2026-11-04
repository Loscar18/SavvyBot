# 📦 Guía de Despliegue para SavvyBot en Oracle Cloud Free Tier

## 🎯 Introducción

Esta guía te llevará paso a paso a través del proceso de despliegue de **SavvyBot v1.1** en **Oracle Cloud Free Tier** con **coste 0€/mes**. SavvyBot es una plataforma multi-tenant de agentes de IA que funciona como WhatsApp para agentes.

### 📋 Requisitos Previos

- ✅ Cuenta de **Oracle Cloud** (gratis)
- ✅ Cuenta de **GitHub** (gratis)
- ✅ Dominio propio (opcional, pero recomendado)
- ✅ Conocimientos básicos de línea de comandos
- ✅ Docker y Docker Compose instalados localmente (para pruebas)

### ⏱️ Tiempo Estimado

- **30-60 minutos** para el despliegue completo
- **0€/mes** de coste (todo en capas gratuitas)

---

## 🚀 Paso 1: Configurar Oracle Cloud Free Tier

### 1.1 Crear una Cuenta de Oracle Cloud

1. Ve a [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)
2. Haz clic en **"Start for free"**
3. Completa el formulario de registro con:
   - Tu email
   - Número de teléfono (para verificación)
   - Datos de tarjeta de crédito (NO se cobrará, solo para verificación)
4. Una vez verificado, inicia sesión en el **Oracle Cloud Console**

> ⚠️ **Importante**: Oracle requiere una tarjeta de crédito para la verificación, pero **NO se cobrará nada** siempre que uses solo los recursos de la capa gratuita.

### 1.2 Verificar los Recursos Gratuitos Disponibles

En el **Oracle Cloud Console**, ve a:
- **Menu** → **Account Management** → **Billing & Cost Management** → **Free Tier**

Deberías ver:
- ✅ **Compute**: 4 núcleos ARM (AMD), 24 GB RAM (siempre gratis)
- ✅ **Storage**: 200 GB Block Volumes, 10 GB Object Storage
- ✅ **Networking**: 10 TB/mes de transferencia de datos
- ✅ **Database**: 2 bases de datos Autónomas (20 GB cada una)

### 1.3 Configurar la Región

SavvyBot funciona mejor en estas regiones con **Always Free ARM instances**:
- **Europa**: `eu-frankfurt-1` (Alemania) ✅ **Recomendada**
- **América**: `us-phoenix-1` (Arizona), `us-ashburn-1` (Virginia)
- **Asia**: `ap-tokyo-1` (Japón)

**Selecciona una región y quédate en ella para todo el despliegue.**

---

## 🖥️ Paso 2: Crear la Instancia de Computación (VM)

### 2.1 Crear una Instancia Always Free ARM

1. En el **Oracle Cloud Console**, ve a:
   - **Menu** → **Compute** → **Instances**
2. Haz clic en **"Create Instance"**
3. Configura los siguientes parámetros:

#### 📝 Configuración Básica

| Campo | Valor | Notas |
|-------|-------|-------|
| **Name** | `savvybot-server` | Nombre de la instancia |
| **Availability Domain** | Selecciona uno disponible | Ej: `AD-1` |
| **Image or Operating System** | **Canonical Ubuntu 22.04** | Sistema operativo |
| **Shape** | **VM.Standard.A1.Flex** | ✅ Always Free |
| **OCPUs** | **4** | Máximo permitido en Free Tier |
| **Memory (GB)** | **24** | Máximo permitido en Free Tier |
| **Networking** | **Create new virtual cloud network** | |

#### 💾 Configuración de Almacenamiento

| Campo | Valor | Notas |
|-------|-------|-------|
| **Boot Volume Size** | **50 GB** | Suficiente para el sistema |
| **Block Storage** | **200 GB** | ✅ Always Free (máximo) |

#### 🔑 Configuración de Claves SSH

1. **Opción A (Recomendada)**: Generar una nueva clave SSH
   - Haz clic en **"Generate a key pair for me"**
   - Descarga la clave privada (`ssh-key-YYYY-MM-DD.key`)
   - **Guarda este archivo en un lugar seguro**

2. **Opción B**: Usar una clave SSH existente
   - Haz clic en **"Upload public key file"**
   - Sube tu clave pública (`id_rsa.pub`)

#### 🔒 Configuración de Seguridad

| Campo | Valor | Notas |
|-------|-------|-------|
| **Firewall** | **Create new security list** | |
| **Ingress Rules** | Ver abajo | Permitir tráfico necesario |

**Reglas de Entrada (Ingress Rules) - MÍNIMO REQUERIDO:**

```
1. SSH (Port 22) - Source: 0.0.0.0/0
2. HTTP (Port 80) - Source: 0.0.0.0/0
3. HTTPS (Port 443) - Source: 0.0.0.0/0
4. Custom TCP (Port 3000) - Source: 0.0.0.0/0  # Next.js
5. Custom TCP (Port 8080) - Source: 0.0.0.0/0  # Alternativa
6. Custom TCP (Port 6379) - Source: 0.0.0.0/0  # Redis
7. Custom TCP (Port 5432) - Source: 0.0.0.0/0  # PostgreSQL
```

> ⚠️ **IMPORTANTE**: Para producción, **restringe las fuentes** a tu IP específica o usa una VPN. Para desarrollo, puedes dejar 0.0.0.0/0.

3. Haz clic en **"Create Instance"**

### 2.2 Esperar a que la Instancia se Cree

- La creación puede tardar **1-2 minutos**
- Cuando el estado cambie a **"Running"** (verde), la instancia está lista
- **Anota la IP Pública** de tu instancia (ej: `123.123.123.123`)

---

## 🐧 Paso 3: Configurar la Instancia Ubuntu

### 3.1 Conectarse por SSH

**En tu terminal local**, ejecuta:

```bash
# Si usaste la Opción A (clave generada por Oracle)
chmod 400 /ruta/a/tu/ssh-key-YYYY-MM-DD.key
ssh -i /ruta/a/tu/ssh-key-YYYY-MM-DD.key ubuntu@<IP_PÚBLICA>

# Si usaste la Opción B (tu propia clave)
ssh -i ~/.ssh/id_rsa ubuntu@<IP_PÚBLICA>
```

> ⚠️ **Importante**: Reemplaza `<IP_PÚBLICA>` con la IP de tu instancia.

### 3.2 Actualizar el Sistema

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
sudo apt install -y curl wget git unzip zip htop neofetch net-tools

# Reiniciar si es necesario
sudo reboot
```

### 3.3 Instalar Docker y Docker Compose

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sudo sh

# Agregar tu usuario al grupo docker
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version

# Salir y volver a entrar para aplicar los cambios de grupo
# O ejecutar:
newgrp docker
```

### 3.4 Instalar Node.js (opcional, para desarrollo)

```bash
# Instalar Node.js 20.x usando nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Verificar
node --version  # Debería mostrar v20.x.x
npm --version
```

### 3.5 Configurar el Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3000/tcp  # Next.js
sudo ufw allow 6379/tcp  # Redis
sudo ufw allow 5432/tcp  # PostgreSQL

# Habilitar el firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## 📁 Paso 4: Clonar el Repositorio de SavvyBot

### 4.1 Clonar el Código

```bash
# Clonar el repositorio
cd ~
git clone https://github.com/Loscar18/SavvyBot.git
cd SavvyBot

# Verificar la estructura
ls -la
```

### 4.2 Configurar las Variables de Entorno

```bash
# Crear el archivo .env
nano .env
```

**Pega el siguiente contenido (ajusta según sea necesario):**

```bash
# ============================================
# SavvyBot Environment Configuration
# ============================================

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/savvybot"

# Redis Configuration
REDIS_URL="redis://localhost:6379/0"

# Encryption Key (GENERA UNO NUEVO!)
# Usa: openssl rand -base64 32
ENCRYPTION_KEY="tu_clave_de_cifrado_base64_32_bytes_1234567890"

# Next.js Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Application Settings
NODE_ENV="production"
PORT=3000

# Optional: Stripe (deshabilitado por defecto)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PUBLISHABLE_KEY=""

# Optional: Composio API Key (para el propietario de la plataforma)
COMPOSIO_API_KEY=""

# Optional: Email Configuration (para registro de usuarios)
EMAIL_SMTP_HOST=""
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=""
EMAIL_SMTP_PASSWORD=""
EMAIL_FROM="noreply@savvybot.com"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"
```

**Genera una clave de cifrado segura:**

```bash
# Generar una clave de 32 bytes en base64
openssl rand -base64 32
```

**Copia el resultado y pégalo en `ENCRYPTION_KEY`.**

> ⚠️ **CRÍTICO**: **Nunca compartas esta clave**. Guárdala en un lugar seguro.

### 4.3 Configurar el Docker Compose

El archivo `docker-compose.yml` ya está configurado para producción. Verifica que tenga:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: savvybot
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/savvybot
      REDIS_URL: redis://redis:6379/0
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.worker
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/savvybot
      REDIS_URL: redis://redis:6379/0
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## 🚀 Paso 5: Desplegar SavvyBot

### 5.1 Iniciar los Contenedores

```bash
# Navegar al directorio del proyecto
cd ~/SavvyBot

# Crear y levantar los contenedores
docker compose up -d

# Ver el estado de los contenedores
docker compose ps
```

### 5.2 Verificar que Todo Funciona

```bash
# Ver los logs de la web
docker compose logs -f web

# Ver los logs del worker
docker compose logs -f worker

# Ver los logs de PostgreSQL
docker compose logs -f postgres

# Ver los logs de Redis
docker compose logs -f redis
```

### 5.3 Esperar a que la Base de Datos esté Lista

```bash
# Esperar unos minutos y verificar
sleep 60
docker compose exec postgres pg_isready -U postgres
```

### 5.4 Ejecutar las Migraciones y Seed

```bash
# Ejecutar migraciones
docker compose exec web npm run db:migrate

# Ejecutar seed (datos de demostración)
docker compose exec web npm run db:seed
```

### 5.5 Verificar el Seed

El seed crea:
- ✅ 3 agentes de demostración
- ✅ 1 grupo de agentes
- ✅ 2 rutinas
- ✅ 1 habilidad
- ✅ 1 hilo de chat de ejemplo

---

## 🌐 Paso 6: Configurar el Acceso Públic

### 6.1 Acceder a SavvyBot

Abre tu navegador y ve a:
```
http://<IP_PÚBLICA>:3000
```

Deberías ver:
- ✅ La página de inicio de SavvyBot
- ✅ El dashboard con los agentes de demostración
- ✅ La posibilidad de registrarte o iniciar sesión

### 6.2 Configurar un Dominio (Opcional pero Recomendado)

#### Opción A: Usar un Dominio Propio

1. **Comprar un dominio** (ej: `tudominio.com`) en:
   - [Namecheap](https://www.namecheap.com/) (~10€/año)
   - [Google Domains](https://domains.google/) (~12€/año)
   - [Porkbun](https://porkbun.com/) (~10€/año)

2. **Configurar DNS** para apuntar a tu IP de Oracle:
   - Añade un registro **A** con:
     - **Host**: `@` o `www`
     - **Value**: `<IP_PÚBLICA>`
     - **TTL**: Automático

3. **Esperar a que se propague** (puede tardar minutos u horas)

4. **Verificar** con:
   ```bash
   ping tudominio.com
   # Debería resolver a tu IP de Oracle
   ```

#### Opción B: Usar Oracle Cloud DNS (Gratis)

1. En el **Oracle Cloud Console**, ve a:
   - **Menu** → **Networking** → **DNS** → **Zones**
2. Haz clic en **"Create Zone"**
3. Configura:
   - **Zone Name**: `tudominio.com`
   - **Zone Type**: **Primary**
   - **Compartment**: El mismo que tu instancia
4. Añade un registro **A** con:
   - **Name**: `@`
   - **IP Address**: `<IP_PÚBLICA>`
   - **TTL**: 300
5. Configura los nameservers de tu dominio para apuntar a los de Oracle

### 6.3 Configurar HTTPS con Caddy (Proxy Inverso)

Para tener **HTTPS automático** (Let's Encrypt), vamos a usar **Caddy** como proxy inverso.

#### Instalar Caddy

```bash
# Instalar Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

#### Configurar Caddy

```bash
# Editar el archivo de configuración
sudo nano /etc/caddy/Caddyfile
```

**Configuración para SavvyBot:**

```caddy
# Si tienes dominio
tudominio.com, www.tudominio.com {
    reverse_proxy localhost:3000
}

# Si no tienes dominio (solo IP)
:80 {
    reverse_proxy localhost:3000
}
```

**Guardar y salir** (Ctrl+O, Enter, Ctrl+X)

#### Iniciar Caddy

```bash
# Iniciar Caddy
sudo systemctl start caddy

# Habilitar inicio automático
sudo systemctl enable caddy

# Verificar estado
sudo systemctl status caddy

# Ver logs
sudo journalctl -u caddy -f
```

#### Verificar HTTPS

Ahora puedes acceder a:
```
https://tudominio.com
# o
https://<IP_PÚBLICA>
```

Deberías ver:
- ✅ Conexión segura (🔒 en la barra de direcciones)
- ✅ Certificado SSL válido (Let's Encrypt)

---

## 📊 Paso 7: Configurar la Base de Datos Externa (Opcional)

Por defecto, SavvyBot usa PostgreSQL en Docker. Para producción, puedes usar:

### Opción A: Neon (PostgreSQL Serverless Gratis)

1. Ve a [https://neon.tech/](https://neon.tech/) y regístrate
2. Crea un nuevo proyecto
3. Crea una base de datos llamada `savvybot`
4. Copia la **Connection String** (ej: `postgresql://user:password@ep-cool-name-123456.us-east-1.aws.neon.tech/savvybot`)
5. Actualiza el `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@ep-cool-name-123456.us-east-1.aws.neon.tech/savvybot?sslmode=require"
   ```
6. Reinicia los contenedores:
   ```bash
   docker compose down && docker compose up -d
   ```

### Opción B: Supabase (PostgreSQL Gratis)

1. Ve a [https://supabase.com/](https://supabase.com/) y regístrate
2. Crea un nuevo proyecto
3. Ve a **Database** → **Connection String**
4. Copia la **URI**
5. Actualiza el `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
   ```
6. Reinicia los contenedores

### Opción C: Upstash (Redis Gratis)

1. Ve a [https://upstash.com/](https://upstash.com/) y regístrate
2. Crea una nueva base de datos Redis
3. Copia la **REST URL** (ej: `https://xxxxx-xxxx-xxxx-xxxx-xxxx.upstash.io`)
4. Actualiza el `.env`:
   ```bash
   REDIS_URL="rediss://:password@xxxxx-xxxx-xxxx-xxxx-xxxx.upstash.io:6379"
   ```
5. Reinicia los contenedores

---

## 🔧 Paso 8: Configurar SavvyBot

### 8.1 Registrar el Primer Usuario

1. Ve a `https://tudominio.com/auth/register`
2. Completa el formulario:
   - **Email**: Tu email
   - **Nombre**: Tu nombre
   - **Contraseña**: Una contraseña segura (mínimo 8 caracteres)
   - **Nombre del Workspace**: El nombre de tu organización
3. Haz clic en **Registrarse**

### 8.2 Configurar tu Clave de API de LLM

1. Inicia sesión en SavvyBot
2. Ve a **Ajustes** → **Modelo**
3. Configura:
   - **Proveedor**: xAI (Grok), OpenAI, Anthropic, etc.
   - **URL Base**: La URL del endpoint (ej: `https://api.x.ai/v1`)
   - **Modelo**: El modelo a usar (ej: `grok`, `gpt-4`, `claude-3`)
   - **Clave API**: **Tu clave API personal**
4. Haz clic en **Guardar**

> ✅ **SavvyBot funciona con BYOK (Bring Your Own Key)**: cada usuario configura su propia clave de API.

### 8.3 Configurar la Clave de Composio (Opcional - Solo para el Propietario de la Plataforma)

Si quieres que tus usuarios puedan conectar apps a través de **Composio**:

1. Ve a [https://composio.dev/](https://composio.dev/) y regístrate
2. Obtén tu **API Key** de Composio
3. En SavvyBot, ve a **Ajustes** → **Integraciones**
4. Pega tu clave de Composio
5. Haz clic en **Guardar**

### 8.4 Configurar Stripe (Opcional - Para Cobros)

Si quieres habilitar los pagos:

1. Ve a [https://stripe.com/](https://stripe.com/) y regístrate
2. Obtén tus claves:
   - **Secret Key**
   - **Publishable Key**
   - **Webhook Secret**
3. En SavvyBot, ve a **Ajustes** → **Facturación**
4. Activa el módulo de pagos
5. Configura tus claves de Stripe
6. Haz clic en **Guardar**

---

## 📱 Paso 9: Configurar la App Android (Opcional)

### 9.1 Compilar el APK

1. **Instalar Capacitor** (en tu máquina local o en la VM):
   ```bash
   npm install -g @capacitor/cli @capacitor/core
   ```

2. **Añadir Android**:
   ```bash
   npx cap add android
   ```

3. **Sincronizar con la web**:
   ```bash
   npm run build
   npx cap sync android
   ```

4. **Compilar el APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. **El APK estará en**:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### 9.2 Firmar el APK (Para Producción)

Para distribuir el APK, necesitas firmarlo:

1. **Generar un keystore**:
   ```bash
   keytool -genkey -v -keystore savvybot-release.keystore -alias savvybot -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configurar el signing en `android/app/build.gradle`**:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('savvybot-release.keystore')
               storePassword System.getenv('ANDROID_STORE_PASSWORD')
               keyAlias System.getenv('ANDROID_KEY_ALIAS')
               keyPassword System.getenv('ANDROID_KEY_PASSWORD')
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. **Compilar el APK firmado**:
   ```bash
   ./gradlew assembleRelease
   ```

### 9.3 Distribuir el APK

El APK firmado estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Opciones de distribución:**
1. **GitHub Releases**: Sube el APK a tu repositorio de GitHub
2. **Google Drive**: Comparte el archivo directamente
3. **Firebase App Distribution**: Para testing con usuarios
4. **Instalación directa**: Los usuarios pueden instalar el APK manualmente

> ⚠️ **Importante**: Los usuarios deben **habilitar "Orígenes desconocidos"** en sus dispositivos Android para instalar el APK.

---

## 🔄 Paso 10: Automatizar el Despliegue (Opcional)

### 10.1 Configurar GitHub Actions

El repositorio ya incluye workflows de GitHub Actions para:
- ✅ Compilar el APK de Android
- ✅ Desplegar en Oracle Cloud
- ✅ Ejecutar tests

**Para habilitar el despliegue automático:**

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Añade los siguientes **Repository Secrets**:
   - `OCI_CONFIG`: Configuración de OCI CLI (en base64)
   - `OCI_COMPARTMENT_ID`: ID del compartimento de Oracle
   - `OCI_REGION`: Región de Oracle (ej: `eu-frankfurt-1`)
   - `DOCKER_HUB_USERNAME`: Tu usuario de Docker Hub
   - `DOCKER_HUB_TOKEN`: Token de Docker Hub
   - `ANDROID_STORE_PASSWORD`: Contraseña del keystore
   - `ANDROID_KEY_ALIAS`: Alias del keystore
   - `ANDROID_KEY_PASSWORD`: Contraseña de la clave

4. **Empujar cambios** y el workflow se ejecutará automáticamente

### 10.2 Configurar OCI CLI

Para generar la configuración de OCI CLI:

1. En tu máquina local, instala OCI CLI:
   ```bash
   curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh | bash
   ```

2. Configura OCI CLI:
   ```bash
   oci setup config
   ```

3. Guarda la configuración en un archivo y codifícala en base64:
   ```bash
   cat ~/.oci/config | base64 -w 0
   ```

4. Copia el resultado y configúralo como `OCI_CONFIG` en GitHub Secrets

---

## 📈 Paso 11: Monitorear y Mantener

### 11.1 Verificar el Estado de los Servicios

```bash
# Ver el estado de los contenedores
docker compose ps

# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f web

# Ver el uso de recursos
docker stats
```

### 11.2 Actualizar SavvyBot

```bash
# Detener los contenedores
docker compose down

# Actualizar el código
git pull origin main

# Reconstruir y levantar los contenedores
docker compose build --no-cache
docker compose up -d

# Ejecutar migraciones (si hay cambios en la BD)
docker compose exec web npm run db:migrate
```

### 11.3 Hacer Backups

```bash
# Backup de PostgreSQL
docker compose exec postgres pg_dump -U postgres savvybot > backup_$(date +%Y-%m-%d).sql

# Backup de los volúmenes
docker run --rm --volumes-from savvybot_postgres_1 -v $(pwd):/backup busybox tar cvf /backup/postgres_backup.tar /var/lib/postgresql/data

# Backup de Redis
docker compose exec redis redis-cli SAVE
cp /var/lib/docker/volumes/savvybot_redis_data/_data/dump.rdb backup_redis_$(date +%Y-%m-%d).rdb
```

### 11.4 Restaurar Backups

```bash
# Restaurar PostgreSQL
docker compose exec postgres psql -U postgres savvybot < backup_2024-01-01.sql

# Restaurar Redis
docker cp backup_redis_2024-01-01.rdb savvybot_redis_1:/data/dump.rdb
docker compose exec redis redis-cli LOAD
```

---

## 🔍 Paso 12: Solucionar Problemas

### 🚨 Problemas Comunes y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| **No puedo acceder a la web** | Puerto 3000 no está abierto | Verifica el firewall y las reglas de seguridad |
| **Error de conexión a la BD** | PostgreSQL no está listo | Espera 1-2 minutos y reinicia los contenedores |
| **Error de conexión a Redis** | Redis no está listo | Espera y reinicia los contenedores |
| **Error de cifrado** | ENCRYPTION_KEY no está configurada | Genera una clave y configúrala en el .env |
| **Error al registrar usuario** | Email ya existe | Usa un email diferente |
| **Error al iniciar sesión** | Credenciales incorrectas | Verifica el email y la contraseña |
| **Error al conectar integración** | Clave de Composio no configurada | Configura tu clave de Composio en Ajustes |
| **Error al ejecutar rutina** | Agente o grupo no encontrado | Verifica que el agente o grupo exista |
| **Error al crear grupo** | No hay agentes disponibles | Crea al menos un agente primero |
| **Error de memoria** | No hay suficiente memoria | Usa una instancia con más RAM |

### 📞 Soporte

Si tienes problemas que no puedes resolver:

1. **Revisa los logs**:
   ```bash
   docker compose logs -f web
   docker compose logs -f worker
   ```

2. **Verifica los recursos**:
   ```bash
   docker stats
   free -h
   df -h
   ```

3. **Reinicia los servicios**:
   ```bash
   docker compose down && docker compose up -d
   ```

4. **Consulta la documentación**:
   - [README.md](README.md)
   - [DESPLIEGUE-GRATIS.md](DESPLIEGUE-GRATIS.md)

5. **Abre un issue en GitHub**:
   - [https://github.com/Loscar18/SavvyBot/issues](https://github.com/Loscar18/SavvyBot/issues)

---

## 📊 Recursos y Límites de Oracle Cloud Free Tier

### ✅ Recursos Incluidos (Siempre Gratis)

| Recurso | Límite | SavvyBot Usage |
|---------|--------|----------------|
| **Compute (ARM)** | 4 núcleos, 24 GB RAM | ✅ Web + Worker |
| **Block Storage** | 200 GB | ✅ PostgreSQL + Redis |
| **Object Storage** | 10 GB | ❌ No usado |
| **Transferencia de Datos** | 10 TB/mes | ✅ Tráfico web |
| **Load Balancer** | 1 instancia | ❌ No usado |
| **Database Autónoma** | 2 DBs, 20 GB cada una | ❌ No usado |

### ⚠️ Límites a Tener en Cuenta

1. **Compute**: Solo **4 núcleos ARM** y **24 GB RAM** en total
2. **Storage**: **200 GB** de almacenamiento en bloque
3. **Networking**: **10 TB/mes** de transferencia de datos
4. **Instancias**: Máximo **4 instancias Always Free** por región

### 💡 ¿Cuándo Debería Migrar a Pago?

| Escenario | Solución |
|-----------|----------|
| Más de 100 usuarios activos | Aumentar recursos de Compute |
| Más de 200 GB de almacenamiento | Usar Object Storage de pago |
| Más de 10 TB de tráfico/mes | Optimizar o pagar por ancho de banda |
| Necesitas alta disponibilidad | Usar Load Balancer de pago |
| Necesitas backups automáticos | Usar Object Storage de pago |

---

## 🎉 ¡Listo! SavvyBot está Desplegado

### ✅ Verificación Final

1. **Web**: Accede a `https://tudominio.com` o `http://<IP_PÚBLICA>:3000`
2. **Registro**: Crea un usuario y un workspace
3. **Agentes**: Verifica que los 3 agentes de demostración aparezcan
4. **Chat**: Prueba a chatear con un agente
5. **Integraciones**: Conecta una app (si configuraste Composio)
6. **Rutinas**: Verifica que las rutinas de demostración funcionen
7. **Android**: Instala el APK en tu dispositivo (opcional)

### 📝 Próximos Pasos

1. **Invitar usuarios**: Comparte el enlace de tu SavvyBot con tu equipo
2. **Crear más agentes**: Personaliza agentes para tus necesidades
3. **Configurar integraciones**: Conecta herramientas externas
4. **Automatizar rutinas**: Crea flujos de trabajo automatizados
5. **Monitorear**: Usa `docker stats` para ver el uso de recursos

---

## 📚 Documentación Adicional

- **[README.md](README.md)**: Documentación técnica completa
- **[DESPLIEGUE-GRATIS.md](DESPLIEGUE-GRATIS.md)**: Guía de despliegue gratuito
- **[Guía de API](API-GUIDE.md)**: Documentación de la API REST
- **[Guía de Desarrollo](DEVELOPMENT.md)**: Cómo contribuir al proyecto

---

## 🔗 Enlaces Útiles

- **SavvyBot GitHub**: [https://github.com/Loscar18/SavvyBot](https://github.com/Loscar18/SavvyBot)
- **Oracle Cloud Console**: [https://cloud.oracle.com/](https://cloud.oracle.com/)
- **Oracle Cloud Free Tier**: [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)
- **Docker**: [https://www.docker.com/](https://www.docker.com/)
- **Docker Compose**: [https://docs.docker.com/compose/](https://docs.docker.com/compose/)
- **Capacitor**: [https://capacitorjs.com/](https://capacitorjs.com/)
- **Next.js**: [https://nextjs.org/](https://nextjs.org/)
- **PostgreSQL**: [https://www.postgresql.org/](https://www.postgresql.org/)
- **Redis**: [https://redis.io/](https://redis.io/)
- **Neon**: [https://neon.tech/](https://neon.tech/)
- **Upstash**: [https://upstash.com/](https://upstash.com/)
- **Composio**: [https://composio.dev/](https://composio.dev/)

---

## 📜 Licencias

- **SavvyBot**: MIT License
- **Oracle Cloud**: [Oracle Cloud Terms](https://www.oracle.com/legal/cloud/)
- **Docker**: Apache License 2.0
- **Next.js**: MIT License
- **PostgreSQL**: PostgreSQL License
- **Redis**: BSD License

---

## 🙏 Agradecimientos

Gracias por usar **SavvyBot**! Si tienes alguna pregunta, sugerencia o encuentras un error, no dudes en abrir un issue en GitHub.

**¡Feliz despliegue! 🚀**

---

*Documentación generada para SavvyBot v1.1*
*Última actualización: Noviembre 2024*
