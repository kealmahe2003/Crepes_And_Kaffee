#!/bin/bash

# Crepes & Kaffee - Sistema POS
# Script de inicio para Linux/Mac

echo "================================"
echo "  CREPES & KAFFEE - SISTEMA POS"
echo "================================"
echo ""
echo "Iniciando servidor local..."
echo ""

# Verificar si Python3 está disponible
if command -v python3 &> /dev/null; then
    echo "Python3 encontrado. Iniciando servidor en puerto 8000..."
    echo ""
    echo "Abre tu navegador y ve a: http://localhost:8000"
    echo ""
    echo "Para detener el servidor, presiona Ctrl+C"
    echo ""
    python3 -m http.server 8000
    exit 0
fi

# Verificar si Python está disponible
if command -v python &> /dev/null; then
    echo "Python encontrado. Iniciando servidor en puerto 8000..."
    echo ""
    echo "Abre tu navegador y ve a: http://localhost:8000"
    echo ""
    echo "Para detener el servidor, presiona Ctrl+C"
    echo ""
    python -m http.server 8000
    exit 0
fi

# Si no hay Python, mostrar instrucciones
echo "ERROR: Python no está instalado en este sistema."
echo ""
echo "OPCIONES PARA EJECUTAR EL SISTEMA:"
echo ""
echo "1. Instalar Python desde: https://python.org/downloads"
echo "2. Usar un servidor web como nginx o apache"
echo "3. Abrir dashboard.html directamente en el navegador (funcionalidad limitada)"
echo ""
echo "Para más información, consulta el archivo README.md"
echo ""
read -p "Presiona Enter para continuar..."
