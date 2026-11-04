# 📤 Instrucciones para Subir a GitHub

**Sigue estos pasos para subir el proyecto a tu repositorio de GitHub:**

---

## 🎯 OPCIÓN 1: Crear Repositorio Nuevo en GitHub (Recomendado)

### Paso 1: Crear repositorio en GitHub

1. Ve a [https://github.com/new](https://github.com/new)
2. Configura el repositorio:
   - **Repository name**: `savvybot-v1` (o el nombre que prefieras)
   - **Description**: `SavvyBot v1.1 - Plataforma comercial multi-tenant de agentes de IA`
   - **Public/Private**: `Public` (recomendado para usar Actions gratis)
   - **Initialize with README**: ❌ NO (ya tenemos README)
   - **Add .gitignore**: ❌ NO (ya tenemos .gitignore)
   - **Add license**: ❌ NO (opcional, puedes añadirla después)
3. Haz clic en **Create repository**

### Paso 2: Subir el código

```bash
# 1. Asegúrate de estar en el directorio del proyecto
cd /workspace/savvybot

# 2. Verifica que tienes commits
git log --oneline
# Deberías ver:
# 97efedb feat: SavvyBot v1.1 - Cimientos multi-tenant completos
# a4ab848 docs: Añadir README completo con documentación del proyecto

# 3. Añade el remote de GitHub (cambia el nombre si usaste otro)
git remote add origin https://github.com/Loscar18/savvybot-v1.git

# 4. Verifica el remote
git remote -v
# Deberías ver:
# origin  https://github.com/Loscar18/savvybot-v1.git (fetch)
# origin  https://github.com/Loscar18/savvybot-v1.git (push)

# 5. Sube todo a GitHub
git push -u origin main
```

### Paso 3: Verificar

1. Ve a tu repositorio en GitHub: `https://github.com/Loscar18/savvybot-v1`
2. Verifica que todos los archivos están subidos
3. Verifica que el README se muestra correctamente

---

## 🎯 OPCIÓN 2: Usar Repositorio Existente

Si ya tienes un repositorio creado:

```bash
# 1. Añadir el remote
cd /workspace/savvybot
git remote add origin https://github.com/Loscar18/NOMBRE-REPO.git

# 2. Subir el código
git push -u origin main
```

---

## 🎯 OPCIÓN 3: Usar GitHub CLI (si tienes permisos)

```bash
# 1. Crear repositorio
gh repo create Loscar18/savvybot-v1 --public --description "SavvyBot v1.1" --source=. --push

# Si ya existe el repositorio:
gh repo clone Loscar18/savvybot-v1
cd savvybot-v1
# Copiar los archivos del proyecto actual
# Luego:
git add .
git commit -m "Initial commit"
git push
```

---

## 📋 Commands Summary

```bash
# Desde /workspace/savvybot:

# 1. Ver estado de git
git status

# 2. Ver commits
git log --oneline

# 3. Añadir remote (cambia la URL)
git remote add origin https://github.com/Loscar18/savvybot-v1.git

# 4. Subir todo
git push -u origin main

# 5. Verificar remotes
git remote -v
```

---

## ⚠️ Posibles Errores y Soluciones

### Error: "remote origin already exists"

```bash
# Ver remotes existentes
git remote -v

# Eliminar el remote existente
git remote remove origin

# Añadir el nuevo
git remote add origin https://github.com/Loscar18/savvybot-v1.git
```

### Error: "failed to push some refs"

```bash
# Forzar push (solo si estás seguro)
git push -u origin main --force

# O mejor, hacer pull primero
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: "repository not found"

1. Verifica que el repositorio existe en GitHub
2. Verifica que la URL es correcta
3. Verifica que tienes permisos

### Error: "authentication failed"

```bash
# Configurar autenticación
git config --global credential.helper store

# O usar token de GitHub:
# 1. Genera un token en: https://github.com/settings/tokens
# 2. Usa: https://<TOKEN>@github.com/Loscar18/savvybot-v1.git
```

---

## 📊 ¿Qué se está subiendo?

El proyecto incluye:

```
savvybot/
├── README.md                    # Documentación principal
├── DESPLIEGUE-GRATIS.md         # Guía de despliegue 0€
├── GITHUB-UPLOAD.md             # Este archivo
├── .env.example                 # Variables de entorno
├── .gitignore                   # Archivos ignorados
├── docker-compose.yml           # Configuración Docker
├── docker/
│   └── postgres/
│       └── init.sql            # Script BD
├── web/                        # Aplicación Next.js
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   ├── scripts/
│   ├── public/
│   └── ... (30+ archivos)
└── worker/                     # Worker BullMQ
    ├── src/
    └── ... (4 archivos)
```

**Total: 40+ archivos, ~13,500+ líneas de código**

---

## 🎉 Después de Subir

Una vez subido, puedes:

1. **Configurar GitHub Actions** para CI/CD (opcional)
2. **Crear un Pull Request** si es un fork
3. **Configurar Issues** para seguimiento
4. **Añadir colaboradores** si es un proyecto en equipo

---

## 🔗 Repositorio de Ejemplo

Si quieres ver cómo debería quedar, puedes crear un repositorio público con este nombre:
```
https://github.com/Loscar18/savvybot-v1
```

Y luego seguir los pasos de arriba para subir el código.

---

**✨ ¡Listo! Ahora tienes todo el código de SavvyBot v1.1 listo para subir a GitHub**

Si tienes problemas, dime qué error obtienes y te ayudo a solucionarlo. 🚀
