@echo off
echo ================================================
echo  VERIFICACION DE IMPRESORA JAL-821
echo ================================================
echo.

echo 1. Verificando conexion de impresora...
powershell -Command "Get-Printer | Where-Object {$_.Name -like '*JAL*' -or $_.Name -like '*Thermal*' -or $_.PortName -like '*USB*'}"

echo.
echo 2. Verificando puerto USB...
powershell -Command "Get-WmiObject -Class Win32_USBHub | Where-Object {$_.Description -like '*printer*' -or $_.Description -like '*thermal*'}"

echo.
echo 3. Verificando servicios de impresion...
net start spooler

echo.
echo 4. Probando impresion basica...
echo Este es un test de impresion > test_print.txt
notepad /p test_print.txt
del test_print.txt

echo.
echo 5. Abriendo panel de impresoras...
control printers

echo.
echo ================================================
echo  VERIFICACION COMPLETADA
echo ================================================
echo.
echo Si la impresora aparece en la lista y el test
echo de impresion funciono, tu JAL-821 esta lista!
echo.
pause