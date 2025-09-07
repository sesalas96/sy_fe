#!/bin/bash

# Safety App - Deploy Script for Netlify
echo "🚀 Preparando despliegue para Netlify..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: No se encontró package.json. Ejecuta desde la raíz del proyecto.${NC}"
  exit 1
fi

# Check Node.js version
echo "📋 Verificando Node.js..."
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Instalando dependencias..."
if npm ci; then
  echo -e "${GREEN}✅ Dependencias instaladas correctamente${NC}"
else
  echo -e "${RED}❌ Error instalando dependencias${NC}"
  exit 1
fi

# Run tests (if any)
echo "🧪 Ejecutando tests..."
if npm test -- --coverage --watchAll=false; then
  echo -e "${GREEN}✅ Tests pasaron correctamente${NC}"
else
  echo -e "${YELLOW}⚠️  Algunos tests fallaron, pero continuando...${NC}"
fi

# Build the project
echo "🔨 Construyendo proyecto..."
if npm run build; then
  echo -e "${GREEN}✅ Build completado exitosamente${NC}"
else
  echo -e "${RED}❌ Error en el build${NC}"
  exit 1
fi

# Verify build folder
if [ -d "build" ]; then
  echo -e "${GREEN}✅ Carpeta build generada correctamente${NC}"
  echo "📊 Contenido de la carpeta build:"
  ls -la build/
else
  echo -e "${RED}❌ No se generó la carpeta build${NC}"
  exit 1
fi

# Check critical files
echo "🔍 Verificando archivos críticos..."
if [ -f "build/index.html" ]; then
  echo -e "${GREEN}✅ index.html encontrado${NC}"
else
  echo -e "${RED}❌ index.html no encontrado${NC}"
  exit 1
fi

if [ -f "public/_redirects" ]; then
  echo -e "${GREEN}✅ _redirects configurado${NC}"
else
  echo -e "${YELLOW}⚠️  _redirects no encontrado${NC}"
fi

if [ -f "netlify.toml" ]; then
  echo -e "${GREEN}✅ netlify.toml configurado${NC}"
else
  echo -e "${YELLOW}⚠️  netlify.toml no encontrado${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Proyecto listo para despliegue en Netlify!${NC}"
echo ""
echo "📋 Pasos siguientes:"
echo "1. Sube el código a tu repositorio Git"
echo "2. Conecta el repositorio a Netlify"
echo "3. Configura las variables de entorno (ver .env.example)"
echo "4. Netlify automáticamente detectará la configuración"
echo ""
echo "🔗 Configuración de Netlify:"
echo "   • Build command: npm run build"
echo "   • Publish directory: build"
echo "   • Node version: 18"
echo ""