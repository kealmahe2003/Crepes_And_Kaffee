# Guía de Instalación Manual - Jaltech JAL-821
# Si Windows no detecta automáticamente la impresora

## Método 1: Instalación Manual de Driver
1. Ir a Panel de Control > Dispositivos e impresoras
2. Hacer clic en "Agregar una impresora"
3. Seleccionar "La impresora que deseo no está en la lista"
4. Seleccionar "Agregar una impresora local o de red con configuración manual"
5. Elegir puerto USB001 (para USB) o crear puerto TCP/IP (para red)
6. En fabricante buscar "Generic" o "Jaltech"
7. En modelo seleccionar "Generic / Text Only" o "Thermal Printer"

## Método 2: Driver Universal
Si no funciona el método anterior:
1. Descargar driver universal ESC/POS
2. Url: https://www.jaltech.com.co/soporte/drivers
3. O buscar "ESC/POS thermal printer driver Windows 10/11"

## Método 3: Configuración como Impresora de Texto
1. Panel de Control > Impresoras
2. Agregar impresora > Manual
3. Puerto: USB001
4. Fabricante: Generic
5. Modelo: Generic / Text Only
6. Nombre: "JAL-821 Thermal"

## Comandos PowerShell para verificar
Get-Printer | Where-Object {$_.Name -like "*JAL*" -or $_.Name -like "*Thermal*"}