# 🚀 Guía de Despliegue en Netlify - Safety Backoffice

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Netlify
- Repositorio Git (GitHub, GitLab, etc.)

## 🔧 Preparación del Proyecto

### 1. Verificar Configuración

El proyecto ya incluye todos los archivos necesarios para Netlify:

- ✅ `netlify.toml` - Configuración principal
- ✅ `public/_redirects` - Manejo de rutas SPA
- ✅ `.env.example` - Variables de entorno de ejemplo
- ✅ `deploy.sh` - Script de verificación pre-despliegue

### 2. Ejecutar Script de Preparación

```bash
# Hacer ejecutable (solo la primera vez)
chmod +x deploy.sh

# Ejecutar verificación
./deploy.sh
```

## 🌐 Despliegue en Netlify

### Opción A: Deploy con Git (Recomendado)

1. **Subir código a repositorio:**
   ```bash
   git add .
   git commit -m "Preparar para despliegue en Netlify"
   git push origin main
   ```

2. **Conectar en Netlify:**
   - Ir a [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Conectar tu repositorio
   - Netlify detectará automáticamente la configuración

3. **Configuración automática:**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Deploy automático en cada push

### Opción B: Deploy Manual

1. **Construir localmente:**
   ```bash
   npm run build
   ```

2. **Arrastrar carpeta `build/` a Netlify**

## ⚙️ Configuración de Variables de Entorno

En el dashboard de Netlify:

1. Ir a **Site settings** → **Environment variables**
2. Agregar variables según `.env.example`:

```bash
# Ejemplo de variables
REACT_APP_APP_NAME=Safety Backoffice
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

## 🔒 Características de Seguridad

El proyecto incluye headers de seguridad automáticos:

- **X-Frame-Options**: Previene clickjacking
- **X-XSS-Protection**: Protección XSS
- **X-Content-Type-Options**: Previene MIME sniffing
- **Referrer-Policy**: Control de referrer
- **Permissions-Policy**: Restricciones de APIs

## 🚦 Verificación Post-Despliegue

### 1. Funcionalidades a Verificar

- ✅ Login con accesos rápidos
- ✅ Navegación entre páginas
- ✅ Sidebar responsive
- ✅ Logo visible
- ✅ Roles de usuario funcionando

### 2. URLs de Prueba

```
https://tu-sitio.netlify.app/
https://tu-sitio.netlify.app/dashboard
https://tu-sitio.netlify.app/contractors
https://tu-sitio.netlify.app/contractor-search
```

## 🛠️ Solución de Problemas

### Error 404 en rutas

**Síntoma:** Páginas funcionan en desarrollo pero dan 404 en producción
**Solución:** Verificar que existe `public/_redirects`

### Build falla

**Síntoma:** Error durante npm run build
**Solución:** 
```bash
# Limpiar caché
npm ci
rm -rf build
npm run build
```

### Variables de entorno no funcionan

**Síntoma:** Funcionalidades que dependen de variables fallan
**Solución:** 
- Variables deben empezar con `REACT_APP_`
- Configurar en Netlify dashboard
- Redeploy después de cambios

## 📊 Optimizaciones Incluidas

- **Caching inteligente** para assets estáticos
- **Service Worker** con cache controlado
- **Compresión automática** por Netlify
- **HTTPS automático**
- **CDN global**

## 🔄 CI/CD Automático

Una vez conectado a Git:

1. **Push a main** → Deploy automático a producción
2. **Pull requests** → Deploy previews automáticos
3. **Rollback** disponible desde dashboard

## 📱 Demo y Accesos

### Usuarios de Demo Disponibles:

1. **Administrador**: `admin@safety.com` / `admin123`
2. **Supervisor**: `supervisor@safety.com` / `supervisor123`  
3. **Cliente**: `client@safety.com` / `client123`
4. **Validador**: `safety@safety.com` / `safety123`
5. **Contratista**: `contractor@safety.com` / `contractor123`

### Funcionalidades por Rol:

- **Administrador**: Acceso completo al sistema
- **Validador**: Búsqueda de contratistas por cédula
- **Supervisor**: Gestión de contratistas y permisos
- **Cliente**: Reportes y gestión empresarial
- **Contratista**: Acceso personal limitado

---

## 🆘 Soporte

Para problemas específicos:
1. Verificar logs en Netlify dashboard
2. Revisar browser console para errores JavaScript
3. Verificar Network tab para problemas de recursos

¡Tu aplicación Safety está lista para producción! 🎉