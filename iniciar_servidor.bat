@echo off
title Crepes & Kaffee - Sistema POS
echo ================================
echo   CREPES & KAFFEE - SISTEMA POS
echo ================================
echo.
echo Iniciando servidor local...
echo.

:: Verificar si Python está disponible
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Python encontrado. Iniciando servidor en puerto 8020...
    echo.
    echo Abre tu navegador y ve a: http://localhost:8020
    echo.
    echo Para detener el servidor, presiona Ctrl+C
    echo.
    python -m http.server 8020
    goto :end
)

:: Verificar si Python3 está disponible
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Python3 encontrado. Iniciando servidor en puerto 8020...
    echo.
    echo Abre tu navegador y ve a: http://localhost:8020
    echo.
    echo Para detener el servidor, presiona Ctrl+C
    echo.
    python3 -m http.server 8020
    goto :end
)

:: Si no hay Python, mostrar instrucciones
echo ERROR: Python no está instalado en este sistema.
echo.
echo OPCIONES PARA EJECUTAR EL SISTEMA:
echo.
echo 1. Instalar Python desde: https://python.org/downloads
echo 2. Usar un servidor web portable como XAMPP Portable
echo 3. Abrir dashboard.html directamente en el navegador (funcionalidad limitada)
echo.
echo Para más información, consulta el archivo README.md
echo.
pause

:end
