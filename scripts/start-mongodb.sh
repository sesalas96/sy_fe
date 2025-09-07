#!/bin/bash

# Script para iniciar MongoDB según el método de instalación

echo "🚀 Iniciando MongoDB..."

# Detectar si MongoDB está instalado como servicio o homebrew
if command -v brew &> /dev/null && brew services list | grep -q mongodb; then
    echo "📦 Detectado MongoDB via Homebrew"
    brew services start mongodb-community
    echo "✅ MongoDB iniciado via Homebrew"
elif command -v systemctl &> /dev/null; then
    echo "🐧 Detectado systemctl (Linux)"
    sudo systemctl start mongod
    echo "✅ MongoDB iniciado via systemctl"
elif command -v service &> /dev/null; then
    echo "🐧 Detectado service (Linux)"
    sudo service mongod start
    echo "✅ MongoDB iniciado via service"
else
    echo "⚠️  No se pudo detectar cómo iniciar MongoDB automáticamente"
    echo "Por favor, inicia MongoDB manualmente:"
    echo ""
    echo "Opciones comunes:"
    echo "1. Homebrew (macOS): brew services start mongodb-community"
    echo "2. Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo "3. Systemctl (Linux): sudo systemctl start mongod"
    echo "4. Service (Linux): sudo service mongod start"
    echo "5. Manual: mongod --dbpath /path/to/data"
fi

# Esperar a que MongoDB esté listo
echo "⏳ Esperando a que MongoDB esté disponible..."
for i in {1..30}; do
    if nc -z localhost 27017 2>/dev/null; then
        echo "✅ MongoDB está disponible en puerto 27017"
        exit 0
    fi
    echo "Intento $i/30..."
    sleep 2
done

echo "❌ MongoDB no responde después de 60 segundos"
echo "Verifica que MongoDB esté instalado y ejecutándose"
exit 1