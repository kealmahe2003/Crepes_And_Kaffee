# 🥞 Crêpes & Kaffee - Sistema POS

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Stable-success.svg)

Sistema de Punto de Venta (POS) completo para restaurantes, cafeterías y negocios de comida, desarrollado específicamente para **Crêpes & Kaffee**. Una solución moderna, intuitiva y completamente funcional para gestionar ventas, pedidos, mesas y estadísticas en tiempo real.

## ✨ Características Principales

### 🏪 **Gestión Completa de Restaurante**
- **💰 Sistema de Ventas** - Procesamiento de órdenes con carrito de compras
- **🪑 Gestión de Mesas** - Control de ocupación y estados de mesas
- **📋 Administración de Pedidos** - Seguimiento desde creación hasta entrega
- **📊 Dashboard en Tiempo Real** - Estadísticas y métricas actualizadas
- **🔐 Sistema de Autenticación** - Login seguro con validación

### 🎨 **Diseño Moderno**
- **Interfaz Responsive** - Optimizada para escritorio, tablet y móvil
- **Efectos Visuales** - Gradientes, animaciones y transiciones suaves
- **Paleta de Colores** - Verde corporativo (#6B9B7C) con acentos modernos
- **UX/UI Intuitiva** - Navegación fácil y flujos de trabajo optimizados

### 🔧 **Tecnología**
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Estilos**: CSS Grid, Flexbox, Animaciones CSS
- **Iconos**: Font Awesome 6.4.0
- **Base de Datos**: LocalStorage (JavaScript)
- **Sin Dependencias**: No requiere frameworks externos

## 📦 Instalación

### Requisitos Mínimos
- ✅ **Python** (2.7 o 3.x) - [Descargar aquí](https://python.org/downloads) si no lo tienes
- ✅ **Navegador web** moderno (Chrome, Firefox, Safari, Edge)

> **💡 Nota:** En Mac y Linux, Python ya viene preinstalado. Solo Windows necesita instalarlo.

### Método 1: Instalación Automática (Recomendado)

1. **Descarga** la carpeta completa del sistema
2. **Ejecuta** el archivo correspondiente a tu sistema:
   - **Windows:** Doble-click en `iniciar_servidor.bat`
   - **Mac/Linux:** Ejecuta `./iniciar_servidor.sh`
3. **Abre** tu navegador en `http://localhost:8000/dashboard.html`

### Método 2: Instalación Manual

#### Paso 1: Descargar el Sistema
```bash
# Clonar el repositorio
git clone https://github.com/kealmahe2003/Crepes-And-Kaffee.git

# O descargar el ZIP y extraer
```

#### Paso 2: Iniciar el Servidor
```bash
# Abrir terminal en la carpeta del proyecto
cd "Crepes and kaffee"

# Iniciar servidor local
python -m http.server 8000
# O en algunos sistemas:
python3 -m http.server 8000
```

#### Paso 3: Abrir en Navegador
Ve a: `http://localhost:8000/dashboard.html`

## 🚀 Portabilidad

### ¿Puedo usar esto en otros PCs sin instalar nada?

¡**SÍ!** El sistema es completamente portable:

#### ✅ **Requisitos en el PC destino:**
- **Python** (viene preinstalado en Mac/Linux)
- **Navegador web** cualquiera

#### 📁 **Para usar en otro PC:**
1. **Copia** toda la carpeta del proyecto
2. **Ejecuta** `iniciar_servidor.bat` (Windows) o `iniciar_servidor.sh` (Mac/Linux)
3. **Abre** `http://localhost:8000/dashboard.html` en cualquier navegador

#### 💾 **Almacenamiento:**
- Los datos se guardan en `localStorage` del navegador
- No requiere base de datos externa
- Cada navegador tiene su propia "base de datos"

#### 🌐 **Acceso en red local:**
```bash
# Para acceder desde otros dispositivos en la misma red:
python -m http.server 8000 --bind 0.0.0.0

# Luego acceder desde: http://IP_DEL_PC:8000/dashboard.html
```

### Paso 4: Configurar el Logo (Opcional)
1. Coloca tu logo como `logo.png` en la carpeta `assets/img/`
2. **Formato recomendado:**
   - Archivo: `logo.png`
   - Tamaño: 200x200 píxeles
   - Fondo transparente preferible

## 🚀 Uso Rápido

### Credenciales por Defecto
```
Usuario: admin
Contraseña: admin123
```

### Acceso al Sistema
1. **Inicia el servidor** con `iniciar_servidor.bat` (Windows) o `iniciar_servidor.sh` (Mac/Linux)
2. **Abre** tu navegador en `http://localhost:8000/dashboard.html`
3. **Login** con las credenciales por defecto
4. ¡**Listo!** Ya puedes usar el sistema completo

## 📋 Uso del Sistema

### 1. **Login**
- Accede con las credenciales por defecto
- El sistema valida automáticamente
- Redirección al dashboard principal

### 2. **Dashboard Principal**
- **Estadísticas en tiempo real**: Ventas del día, pedidos, clientes
- **Estado de mesas**: Ocupación y disponibilidad
- **Pedidos recientes**: Últimos 5 pedidos con estado
- **Productos populares**: Análisis de ventas
- **Acciones rápidas**: Navegación directa a módulos

### 3. **Gestión de Ventas**
- Crear nueva venta
- Agregar productos al carrito
- Seleccionar mesa de destino
- Procesar pago y generar recibo
- Sistema sin impuestos (removido por solicitud)

### 4. **Administración de Mesas**
- **Estados disponibles**: Libre, Ocupada, Reservada, Limpieza
- **Operaciones**: Crear, editar, cambiar estado, eliminar
- **Búsqueda y filtros**: Por estado y número de mesa
- **Vista en tiempo real**: Actualización automática

### 5. **Gestión de Pedidos**
- Crear nuevos pedidos
- Seguimiento de estado
- Actualización en tiempo real
- Historial completo

## 📁 Estructura del Proyecto

```
Crepes and kaffee/
├── assets/
│   ├── css/
│   │   ├── styles.css          # Estilos globales
│   │   ├── dashboard.css       # Estilos del dashboard
│   │   ├── mesas.css          # Estilos de mesas
│   │   └── ...
│   ├── js/
│   │   ├── database.js         # Gestión de datos
│   │   ├── dashboard.js        # Lógica del dashboard
│   │   ├── auth.js            # Autenticación
│   │   ├── mesas.js           # Gestión de mesas
│   │   └── ...
│   └── img/
│       └── logo.png           # Logo del negocio
├── dashboard.html             # Dashboard principal
├── login.html                 # Página de login
├── ventas.html               # Sistema de ventas
├── mesas.html                # Gestión de mesas
├── pedidos.html              # Gestión de pedidos
└── README.md                 # Este archivo
```

## 🔧 Configuración Avanzada

### Personalización de Productos
Edita `assets/js/database.js` para agregar/modificar productos:

```javascript
const defaultProducts = [
    {
        id: 1,
        nombre: "Crêpe Dulce Clásico",
        categoria: "Crêpes Dulces",
        precio: 15000,
        descripcion: "Crêpe con azúcar y limón"
    },
    // Agregar más productos...
];
```

### Configuración de Mesas
Las mesas se pueden configurar desde la interfaz o modificando:

```javascript
// En database.js - configuración inicial de mesas
const defaultTables = [
    { id: 1, numero: 1, capacidad: 4, ubicacion: "Terraza", estado: "libre" },
    // Agregar más mesas...
];
```

### Cambiar Credenciales
Modifica en `assets/js/auth.js`:

```javascript
// Cambiar usuario y contraseña
const validCredentials = {
    username: "tu_usuario",
    password: "tu_contraseña"
};
```

## 📊 Características Técnicas

### Almacenamiento de Datos
- **LocalStorage**: Persistencia local en el navegador
- **Estructura JSON**: Datos organizados y fáciles de mantener
- **Backup automático**: Los datos persisten entre sesiones

### Rendimiento
- **Carga rápida**: Sin dependencias externas pesadas
- **Actualización en tiempo real**: Cada 30 segundos
- **Optimizado para móviles**: Responsive design completo

### Seguridad
- **Validación de entrada**: Sanitización de datos
- **Control de acceso**: Sistema de autenticación
- **Datos locales**: No se envían datos a servidores externos

## 🎯 Funcionalidades por Módulo

### Dashboard
- ✅ Estadísticas en tiempo real
- ✅ Gráficos de ventas
- ✅ Estado de mesas
- ✅ Pedidos recientes
- ✅ Productos populares
- ✅ Reportes imprimibles

### Ventas
- ✅ Carrito de compras
- ✅ Selección de mesa
- ✅ Cálculo automático de totales
- ✅ Generación de recibos
- ✅ Historial de ventas

### Mesas
- ✅ CRUD completo de mesas
- ✅ Estados: Libre, Ocupada, Reservada, Limpieza
- ✅ Búsqueda y filtros
- ✅ Vista en grid moderna
- ✅ Estadísticas de ocupación

### Pedidos
- ✅ Gestión completa de pedidos
- ✅ Estados de seguimiento
- ✅ Asignación a mesas
- ✅ Historial completo

## 🔧 Solución de Problemas

### Problema: El sistema no carga
**Solución**: Verificar que el servidor web esté corriendo y acceder a `http://localhost:8000`

### Problema: Los datos no se guardan
**Solución**: Verificar que el navegador tenga habilitado LocalStorage

### Problema: El logo no aparece
**Solución**: Asegurar que `logo.png` esté en `assets/img/logo.png`

### Problema: Errores de JavaScript
**Solución**: Abrir las herramientas de desarrollador (F12) y revisar la consola


## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request


## 🏆 Créditos

Desarrollado con ❤️ para **Crêpes & Kaffee**

- **Desarrollo**: Sistema POS personalizado
- **Diseño UI/UX**: Interfaz moderna y responsiva
- **Tecnologías**: HTML5, CSS3, JavaScript ES6+

---

**© 2025 Crêpes & Kaffee. Todos los derechos reservados.**
=======
# Crepes-Kaffee
