# 🚀 INICIO RÁPIDO - Crêpes & Kaffee POS

## ¿Qué necesito para ejecutar el sistema?

**Solo dos cosas:**
1. **Python** (viene preinstalado en Mac/Linux)
2. **Un navegador web** (Chrome, Firefox, Edge, Safari)

## ¿Cómo lo ejecuto?

### Windows:
1. Doble-click en `iniciar_servidor.bat`
2. Se abrirá una ventana de comando
3. Abre tu navegador en: `http://localhost:8000/dashboard.html`

### Mac/Linux:
1. Doble-click en `iniciar_servidor.sh`
2. O desde terminal: `./iniciar_servidor.sh`
3. Abre tu navegador en: `http://localhost:8000/dashboard.html`

## ¿Cómo accedo?

**Usuario:** admin  
**Contraseña:** admin123

## ¿Puedo usarlo en otros PCs?

¡SÍ! Solo copia toda la carpeta a otro PC y ejecuta el script correspondiente.

## ¿Funciona offline?

¡SÍ! Una vez cargado en el navegador, funciona completamente offline.

## ¿Dónde se guardan los datos?

En el navegador (localStorage). Cada navegador tiene su propia "base de datos".

## ¿Puedo acceder desde otros dispositivos en la red?

¡SÍ! Ejecuta:
```bash
python -m http.server 8000 --bind 0.0.0.0
```
Luego accede desde: `http://IP_DEL_PC:8000/dashboard.html`

---

💡 **¿Problemas?** Consulta el archivo `README.md` para más detalles.
