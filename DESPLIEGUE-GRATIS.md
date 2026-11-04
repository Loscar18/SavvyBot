# �� DESPLIEGUE GRATIS - SavvyBot v1.1

**Gu�a completa para desplegar SavvyBot con 0€/mes**

SavvyBot est� diseñado para funcionar completamente gratis en producci�n. Esta gu�a te muestra c�mo desplegar toda la plataforma sin pagar nada, usando los servicios gratuitos de varios proveedores.

---

## �� Opciones de Despliegue

### OPCI�N A: Todo en un VPS (Recomendado para producci�n)
**Coste: 0€/mes (perpetuo)**

Usa **Oracle Cloud Always Free** (4 n�cleos ARM, 24GB RAM, 200GB SSD)

```
┌─────────────────────────────────────────────────────────┐
│                  Oracle Cloud VPS                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ PostgreSQL│  │  Redis  │  │   Web   │  │ Worker  │ │
│  │  (Neon)  │  │(Upstash) │  │ (Next.js)│  │(BullMQ) │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         ┌─────────────────────────────────────────┐     │
│         │           Docker Compose                 │     │
│         └─────────────────────────────────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │                    Caddy/Traefik                    ││
│  │              (HTTPS autom�tico)                     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

### OPCI�N B: Servicios Separados (M�s f�cil de configurar)
**Coste: 0€/mes (con l�mites generosos)**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │     │    Neon     │     │  Upstash    │
│  (Web App)  │◄───►│ (PostgreSQL)│◄───►│   (Redis)   │
└─────────────┘     └─────────────┘     └─────────────┘
         ▲                   ▲                   ▲
         │                   │                   │
         ▼                   ▼                   ▼
┌───────────────────────────────────────────────────────┐
│                Render/Fly.io                         │
│              (Worker - BullMQ)                         │
└───────────────────────────────────────────────────────┘
```

---

### OPCI�N C: Local + Ngrok (Para pruebas r�pidas)
**Coste: 0€ (solo para desarrollo)**

```bash
# 1. Iniciar todo localmente
docker-compose up -d

# 2. Exponer con ngrok (gratis)
ngrok http 3000
# => https://abc123.ngrok.io
```

---

## �� OPCI�N A: Oracle Cloud Always Free (RECOMENDADO)

### �� Paso 1: Crear Cuenta en Oracle Cloud

1. Ve a [https://cloud.oracle.com](https://cloud.oracle.com)
2. Reg�strate con tu email (tarjeta de cr�dito NO obligatoria para el tier gratis)
3. Verifica tu email
4. Inicia sesi�n

### �� Paso 2: Crear Instancia Always Free

1. Ve a **Compute > Instances**
2. Haz clic en **Create Instance**
3. Configura:
   - **Name**: `savvybot-server`
   - **Placement**: Selecciona tu regi�n (ej: `EU Frankfurt`)
   - **Image**: Ubuntu 22.04 LTS (ARM)
   - **Shape**: `VM.Standard.A1.Flex` (Always Free eligible)
     - OCPUs: 4
     - Memory: 24 GB
   - **Storage**: 200 GB (m�ximo gratis)
   - **Network**: Crear nueva VCN o usar existente
   - **SSH Keys**: Sube tu clave p�blica o genera una nueva
4. Haz clic en **Create**

### �� Paso 3: Conectar por SSH

```bash
# Si usaste clave existente
ssh -i ~/.ssh/tu_clave_privada ubuntu@<IP_PUBLICA>

# Si generaste nueva clave en Oracle
ssh -i ~/Downloads/ssh-key-YYYY-MM-DD.key ubuntu@<IP_PUBLICA>
```

### �� Paso 4: Configurar el Servidor

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias
sudo apt install -y docker.io docker-compose git curl wget

# 3. A�adir usuario a grupo docker
sudo usermod -aG docker ubuntu

# 4. Reiniciar sesi�n
logout
# Volver a conectar

# 5. Verificar docker
docker --version
docker-compose --version

# 6. Instalar Docker Compose v2 (si no est� instalado)
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### �� Paso 5: Clonar el Repositorio

```bash
# 1. Clonar (si es privado, usa token)
git clone https://github.com/tu-usuario/savvybot.git
cd savvybot

# 2. O sube tus archivos con scp
# scp -r /workspace/savvybot ubuntu@<IP_PUBLICA>:/home/ubuntu/
```

### �� Paso 6: Configurar Variables de Entorno

```bash
# 1. Crear archivo .env
nano .env

# 2. Pegar esta configuraci�n (ajusta seg�n necesites):
DATABASE_URL=postgresql://savvybot:savvybot_password@localhost:5432/savvybot
REDIS_URL=redis://localhost:6379/0
ENCRYPTION_KEY=tu_clave_base64_32_bytes
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres
JWT_REFRESH_SECRET=tu_jwt_refresh_secret
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NODE_ENV=production
BILLING_ENABLED=false

# 3. Guardar (Ctrl+O, Enter, Ctrl+X)

# 4. Generar clave de cifrado (32 bytes base64)
openssl rand -base64 32
```

### �� Paso 7: Configurar Base de Datos Externa (Opcional)

Para mejor rendimiento, usa **Neon** (PostgreSQL serverless gratis):

1. Ve a [https://neon.tech](https://neon.tech)
2. Reg�strate con GitHub
3. Crea un nuevo proyecto
4. Copia la **Connection String** (sin pool)
5. Actualiza `.env`:

```bash
DATABASE_URL=postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/savvybot?sslmode=require
```

**�Ventaja de Neon:**
- PostgreSQL serverless (se auto-pausa cuando no hay uso)
- 3 proyectos gratis
- 500MB almacenamiento por proyecto
- Conexi�n desde cualquier lugar

### �� Paso 8: Configurar Redis Externo (Opcional)

Usa **Upstash** (Redis serverless gratis):

1. Ve a [https://upstash.com](https://upstash.com)
2. Reg�strate con GitHub
3. Crea un nuevo database Redis
4. Copia la URL:

```bash
REDIS_URL=redis://<user>:<password>@<host>:<port>
```

**�Ventaja de Upstash:**
- 500K comandos/mes gratis
- 100MB almacenamiento
- Redis 7 compatible

### �� Paso 9: Desplegar con Docker Compose

```bash
# 1. Iniciar todos los servicios
docker-compose up -d

# 2. Ver logs
docker-compose logs -f

# 3. Esperar a que todo est� listo (2-3 minutos)
# Cuando veas "SavvyBot Worker is running!" y "ready started server"
# el sistema est� listo
```

### �� Paso 10: Configurar Dominio y HTTPS

Usa **Caddy** (m�s f�cil) o **Nginx**:

#### OPCI�N A: Caddy (Recomendado - HTTPS autom�tico)

```bash
# 1. Crear archivo Caddyfile
nano Caddyfile

# 2. Pegar configuraci�n (cambia tu-dominio.com):
tu-dominio.com {
    reverse_proxy localhost:3000
}

# 3. Guardar y salir

# 4. Iniciar Caddy
docker run -d \
  --name caddy \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:latest
```

#### OPCI�N B: Nginx

```bash
# 1. Instalar Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Configurar sitio
sudo nano /etc/nginx/sites-available/savvybot

# 3. Pegar configuraci�n:
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 4. Habilitar sitio
sudo ln -s /etc/nginx/sites-available/savvybot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 5. Obtener certificado SSL (HTTPS)
sudo certbot --nginx -d tu-dominio.com
```

### �� Paso 11: Configurar Dominio

1. Compra un dominio en [Namecheap](https://namecheap.com) (~10€/a�o) o usa uno gratis:
   - [Freenom](https://freenom.com) (dominios .tk, .ml, .ga, .cf, .gq)
   - [Dot.tk](https://dot.tk) (solo .tk)

2. Configura DNS:
   - A record: `@` -> IP de tu VPS
   - A record: `www` -> IP de tu VPS

3. Espera a que se propaguen (5 min - 24 horas)

### �� Paso 12: Acceder a SavvyBot

```
https://tu-dominio.com
```

**�Listo!** SavvyBot est� desplegado y accesible p�blicamente con HTTPS.

---

## �� OPCI�N B: Servicios Separados (Vercel + Neon + Upstash + Render)

### �� Frontend: Vercel (Next.js)

1. Ve a [https://vercel.com](https://vercel.com)
2. Importar repositorio de GitHub
3. Configurar variables de entorno:
   ```
   NEXT_PUBLIC_APP_URL=https://savvybot.vercel.app
   DATABASE_URL=postgresql://... (de Neon)
   REDIS_URL=redis://... (de Upstash)
   ENCRYPTION_KEY=...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   BILLING_ENABLED=false
   ```
4. Desplegar

**�Ventajas:**
- Despliegue autom�tico al hacer push
- HTTPS autom�tico
- CDN global
- 100GB ancho de banda/mes gratis

**�Limitaciones:**
- No soporta WebSockets (necesario para SSE)
- **Solici�n:** Usa **Vercel Pro** (gratis para repos p�blicos) o **Netlify**

### �� Base de Datos: Neon

Como se explic� en la OPCI�N A.

### �� Redis: Upstash

Como se explic� en la OPCI�N A.

### �� Worker: Render (Gratis)

1. Ve a [https://render.com](https://render.com)
2. Crea nuevo **Worker**
3. Conecta repositorio
4. Configura:
   - **Name**: savvybot-worker
   - **Region**: EU West (Frankfurt)
   - **Branch**: main
   - **Root Directory**: worker
   - **Build Command**: npm install && npm run build
   - **Start Command**: npm start
5. A�ade variables de entorno (mismas que en Vercel)
6. Desplegar

**�Ventajas:**
- Worker siempre activo (no se duerme)
- 750 horas/mes gratis (suficiente para 1 worker 24/7)
- 512MB RAM

**�Limitaciones:**
- El worker se duerme despu�s de 5 minutos de inactividad en el plan gratis
- **Solici�n:** Usa **Fly.io** (gratis con l�mites) o **Railway** (5$/mes con cr�ditos gratis)

### �� Worker: Fly.io (Alternativa)

1. Ve a [https://fly.io](https://fly.io)
2. Instalar CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
3. Autenticarse:
   ```bash
   flyctl auth login
   ```
4. Desplegar worker:
   ```bash
   cd worker
   flyctl launch
   # Selecciona: Node.js, EU Central (Frankfurt)
   flyctl deploy
   ```
5. Configurar variables:
   ```bash
   flyctl secrets set DATABASE_URL=...
   flyctl secrets set REDIS_URL=...
   flyctl secrets set ENCRYPTION_KEY=...
   flyctl secrets set JWT_SECRET=...
   ```

**�Ventajas:**
- 3 VMs compartidas gratis
- 3GB almacenamiento
- 160GB egress/mes

---

## �� OPCI�N C: Local + Ngrok (Para Pruebas)

### �� Requisitos
- Docker instalado
- Ngrok instalado

### �� Pasos

```bash
# 1. Iniciar servicios
docker-compose up -d

# 2. Instalar ngrok (si no lo tienes)
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
 echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
 sudo apt update && sudo apt install ngrok

# 3. Autenticarse en ngrok (solo primera vez)
ngrok config add-authtoken <TU_TOKEN>
# (Reg�strate en https://ngrok.com para obtener token gratis)

# 4. Exponer puerto 3000
ngrok http 3000

# 5. Copiar la URL (ej: https://abc123.ngrok.io)
# y acceder desde cualquier lugar
```

**�Ventajas:**
- R�pido de configurar
- HTTPS autom�tico
- Accesible desde internet

**�Limitaciones:**
- URL cambia cada vez que reinicias ngrok
- 40 conexiones/minuto gratis
- No apto para producci�n

---

## �� Comparativa de Opciones

| Proveedor | Servicio | Coste | L�mites | Recomendado para |
|-----------|----------|-------|---------|------------------|
| **Oracle Cloud** | VPS ARM | 0€/mes | 4 CPU, 24GB RAM, 200GB SSD | Producci�n completa |
| **Vercel** | Frontend | 0€/mes | 100GB BW, 100 lambdas | Frontend Next.js |
| **Neon** | PostgreSQL | 0€/mes | 500MB, 3 proyectos | Base de datos |
| **Upstash** | Redis | 0€/mes | 500K comandos, 100MB | Cache y colas |
| **Render** | Worker | 0€/mes | 750h/mes, 512MB RAM | Worker BullMQ |
| **Fly.io** | Worker | 0€/mes | 3 VMs, 3GB storage | Worker alternativo |
| **Ngrok** | T�nel | 0€/mes | 40 conn/min | Pruebas r�pidas |

---

## �� Configuraci�n Recomendada para Producci�n

### **OPCI�N RECOMENDADA: Oracle Cloud + Neon + Upstash**

```
┌─────────────────────────────────────────────────────────┐
│                  Oracle Cloud VPS                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Web    │  │  Worker  │  │  Caddy   │  │  Nginx  │ │
│  │(Next.js) │  │(BullMQ) │  │ (HTTPS)  │  │(opcional)│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │                  │                │            │
│         ▼                  ▼                ▼            │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Docker Compose                        ││
│  │   - PostgreSQL (local o Neon)                      ││
│  │   - Redis (local o Upstash)                        ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                    ▲          ▲
                    │          │
          ┌─────────┴─────────┴─────────┐
          │       Internet              │
          └──────────────────────────────┘
```

**�Ventajas:**
- Todo en un solo servidor (f�cil de gestionar)
- Coste 0€/mes perpetuo
- Alto rendimiento (4 CPU, 24GB RAM)
- Base de datos externa opcional (Neon)
- Redis externo opcional (Upstash)

---

## �� L�mites y Cu�ndo Migrar a Pago

### **Se�ales de que necesitas migrar:**

| Recurso | L�mite Gratis | Se�al de Advertencia | Soluci�n de Pago |
|---------|---------------|---------------------|------------------|
| **VPS (Oracle)** | 4 CPU, 24GB RAM | CPU > 80% constante | DigitalOcean (10$/mes) |
| **PostgreSQL (Neon)** | 500MB | Almacenamiento > 400MB | Neon Pro (10$/mes) |
| **Redis (Upstash)** | 500K comandos/mes | > 400K comandos/mes | Upstash Pro (7$/mes) |
| **Worker (Render)** | 750h/mes | Worker se duerme | Render Pro (7$/mes) |
| **Frontend (Vercel)** | 100GB BW | > 80GB/mes | Vercel Pro (20$/mes) |
| **Ancho de banda** | VPS: 10TB | > 8TB/mes | Cloudflare (gratis) |

### **Coste estimado para migrar:**

| Nivel | Usuarios | Coste/mes | Proveedores |
|-------|----------|-----------|-------------|
| **Gratis** | 1-10 | 0€ | Oracle + Neon + Upstash |
| **B�sico** | 10-50 | ~15€ | DigitalOcean + Neon + Upstash |
| **Profesional** | 50-200 | ~50€ | DO + Neon Pro + Upstash Pro |
| **Empresa** | 200+ | ~150€+ | AWS/GCP + RDS + ElastiCache |

---

## �� Monitorizaci�n y Mantenimiento

### **Comandos �tiles:**

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f web

# Ver uso de recursos
docker stats

# Reiniciar servicios
docker-compose restart web worker

# Actualizar (despu�s de hacer git pull)
docker-compose down && docker-compose up -d --build

# Backup de base de datos
docker exec savvybot-postgres pg_dump -U savvybot savvybot > backup.sql

# Restaurar base de datos
cat backup.sql | docker exec -i savvybot-postgres psql -U savvybot savvybot
```

### **Monitorizaci�n con Netdata (Opcional):**

```bash
# Instalar Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Acceder a dashboard
http://<IP_VPS>:19999
```

---

## �� Soluci�n de Problemas

### **Problema: No puedo acceder a la web**

1. Verifica que Docker est� corriendo:
   ```bash
   docker ps
   ```
2. Verifica que el contenedor web est� healthy:
   ```bash
   docker inspect --format='{{json .State.Health}}' savvybot-web
   ```
3. Revisa logs:
   ```bash
   docker logs savvybot-web
   ```

### **Problema: Base de datos no conecta**

1. Verifica credenciales en `.env`
2. Prueba conexi�n manual:
   ```bash
   docker exec -it savvybot-postgres psql -U savvybot -d savvybot
   ```
3. Si usas Neon, verifica que la IP de tu VPS est� en la lista blanca

### **Problema: Redis no conecta**

1. Verifica que Redis est� corriendo:
   ```bash
   docker exec -it savvybot-redis redis-cli ping
   # Debe responder: PONG
   ```
2. Si usas Upstash, verifica la URL en `.env`

### **Problema: Worker no procesa jobs**

1. Verifica logs del worker:
   ```bash
   docker logs savvybot-worker
   ```
2. Verifica conexi�n a Redis:
   ```bash
   docker exec -it savvybot-worker node -e "const redis = require('ioredis'); const r = new redis(process.env.REDIS_URL); r.ping().then(console.log).catch(console.error);"
   ```

### **Problema: HTTPS no funciona**

1. Verifica que Caddy est� corriendo:
   ```bash
   docker ps | grep caddy
   ```
2. Verifica logs de Caddy:
   ```bash
   docker logs caddy
   ```
3. Verifica que el dominio apunta a la IP correcta:
   ```bash
   dig tu-dominio.com
   ```

---

## �� Security Checklist

- [ ] Cambiar contrase�as por defecto de PostgreSQL y Redis
- [ ] Configurar firewall (UFW) en el VPS
- [ ] Habilitar autenticaci�n de 2 factores en todos los servicios
- [ ] Rotar claves de API peri�dicamente
- [ ] Hacer backups autom�ticos de la base de datos
- [ ] Configurar alertas de uso (Neon, Upstash)
- [ ] Usar variables de entorno, NUNCA hardcodear secretos
- [ ] Mantener Docker y el sistema operativo actualizados

### **Configurar Firewall (UFW):**

```bash
# Instalar UFW
sudo apt install -y ufw

# Permitir SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Denegar todo lo dem�s
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Habilitar
sudo ufw enable

# Verificar
sudo ufw status
```

---

## �� Backup y Recuperaci�n

### **Backup Autom�tico:**

```bash
# 1. Crear script de backup
nano /home/ubuntu/backup.sh

# 2. Pegar:
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR=/home/ubuntu/backups

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec savvybot-postgres pg_dump -U savvybot savvybot > $BACKUP_DIR/backup_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/backup_$DATE.sql

# Eliminar backups viejos (+30 d�as)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Subir a Google Drive (opcional)
# rclone copy $BACKUP_DIR/ gdrive:savvybot-backups/

# 3. Hacer ejecutable
chmod +x /home/ubuntu/backup.sh

# 4. Programar con cron (cada d�a a las 2am)
crontab -e
# A�adir:
0 2 * * * /home/ubuntu/backup.sh
```

### **Restaurar desde Backup:**

```bash
# 1. Descomprimir
 gunzip backup_2024-01-01_00-00-00.sql.gz

# 2. Restaurar
docker exec -i savvybot-postgres psql -U savvybot -d savvybot < backup_2024-01-01_00-00-00.sql

# 3. Reiniciar servicios
docker-compose restart web worker
```

---

## �� Resumen R�pido

| Tarea | Comando | Tiempo |
|-------|---------|--------|
| Crear VPS Oracle | Manual en consola | 10 min |
| Configurar servidor | `sudo apt update && sudo apt install -y docker.io docker-compose git` | 5 min |
| Clonar repositorio | `git clone https://github.com/tu-usuario/savvybot.git` | 2 min |
| Configurar .env | `nano .env` | 5 min |
| Desplegar | `docker-compose up -d` | 3 min |
| Configurar dominio | Manual en registrador DNS | 5 min |
| Configurar HTTPS | `docker run -d caddy` | 2 min |
| **Total** | | **~30 min** |

---

## �� Recursos Adicionales

- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)
- [Neon PostgreSQL](https://neon.tech)
- [Upstash Redis](https://upstash.com)
- [Vercel](https://vercel.com)
- [Render](https://render.com)
- [Fly.io](https://fly.io)
- [Ngrok](https://ngrok.com)
- [Namecheap Dominios](https://namecheap.com)
- [Freenom Dominios Gratis](https://freenom.com)

---

## �� Soporte

Si tienes problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Consulta la documentaci�n oficial de cada servicio
3. �nete a la comunidad de SavvyBot (pr�ximamente)

---

**�Listo!** Ahora puedes desplegar SavvyBot completamente gratis en producci�n. 

El coste ser� **0€/mes** hasta que superes los l�mites de los servicios gratuitos, lo cual para un uso normal de 1-50 usuarios no deber�a pasar.

**�Buena suerte con tu despliegue!** 🚀
