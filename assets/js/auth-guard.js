// Sistema de Protección de Autenticación
class AuthGuard {
    constructor() {
        // Asegurar que existe una instancia de Auth
        if (!window.auth) {
            window.auth = new Auth();
        }
        this.auth = window.auth;
        this.initialized = false;
        this._redirecting = false;
        this._checkingAuth = false; // Nuevo flag para evitar verificaciones múltiples
        this.init();
    }

    init() {
        // Evitar múltiples inicializaciones
        if (this.initialized) return;
        
        // Verificar autenticación inmediatamente (sin esperar DOMContentLoaded)
        this.checkAuthentication();
        
        // También verificar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.setupLogoutHandlers();
            this.setupServerConnectionMonitoring();
        });
        
        // Verificar sesión cada 30 segundos
        setInterval(() => {
            this.validateSession();
        }, 30000);
        
        // Verificar cuando la página reciba el foco
        window.addEventListener('focus', () => {
            this.validateSession();
        });
        
        this.initialized = true;
    }

    checkAuthentication() {
        // Evitar loops de redirección y verificaciones múltiples
        if (this._redirecting || this._checkingAuth) return;
        
        this._checkingAuth = true;
        
        try {
            // Si estamos en la página de login, manejar de forma especial
            if (window.location.pathname.includes('login.html')) {
                // Solo redirigir si hay un usuario válido Y si no estamos en proceso de login
                if (this.auth.isLoggedIn() && this.auth.validateSession()) {
                    // Verificar si no hay un proceso de login en curso
                    const loginForm = document.getElementById('loginForm');
                    if (!loginForm || !document.activeElement || document.activeElement.tagName !== 'INPUT') {
                        // Solo redirigir si no estamos en medio de un proceso de login
                        console.log('[AuthGuard] Usuario ya logueado, redirigiendo al dashboard');
                        this._redirecting = true;
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 100);
                    }
                }
                return;
            }

            // Para todas las demás páginas, verificar autenticación
            if (!this.auth.isLoggedIn()) {
                this.forceLogin('Debe iniciar sesión para acceder al sistema');
                return;
            }

            // Verificar si la sesión es válida
            if (!this.auth.validateSession()) {
                this.forceLogin('Su sesión ha expirado');
                return;
            }

            // Verificar permisos específicos según la página
            this.checkPagePermissions();
            
            // Actualizar información del usuario en la interfaz
            this.updateUserInterface();
            
        } finally {
            // Siempre limpiar el flag, incluso si hay error
            setTimeout(() => {
                this._checkingAuth = false;
            }, 100);
        }
    }

    validateSession() {
        // Si estamos en login, no validar
        if (window.location.pathname.includes('login.html')) return;
        
        // Verificar si hay usuario logueado
        if (!this.auth.isLoggedIn()) {
            this.forceLogin('Sesión no válida');
            return false;
        }

        // Verificar validez de la sesión
        if (!this.auth.validateSession()) {
            this.forceLogin('Su sesión ha expirado');
            return false;
        }

        return true;
    }

    forceLogin(message = 'Debe iniciar sesión') {
        // Prevenir múltiples redirecciones
        if (this._redirecting) return;
        
        // Si ya estamos en login, no hacer nada
        if (window.location.pathname.includes('login.html')) {
            console.log('[AuthGuard] Ya estamos en login, no redirigir');
            return;
        }
        
        this._redirecting = true;
        
        // Emitir evento personalizado
        this.emitAuthEvent('forceLogin', message, 'warning');
        
        // Limpiar cualquier sesión existente
        this.auth.logout();
        
        // Mostrar mensaje
        this.showAuthNotification(message, 'warning');
        
        // Redirigir al login después de un breve delay
        console.log('[AuthGuard] Redirigiendo a login:', message);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }

    setupServerConnectionMonitoring() {
        // Monitorear conexión al servidor cada 10 segundos
        this.serverCheckInterval = setInterval(() => {
            this.checkServerConnection();
        }, 10000);

        // Verificar cuando la ventana recibe foco (usuario vuelve a la pestaña)
        window.addEventListener('focus', () => {
            this.checkServerConnection();
        });

        // Manejar eventos de conexión de red
        window.addEventListener('online', () => {
            this.checkServerConnection();
        });

        window.addEventListener('offline', () => {
            this.handleServerDisconnection();
        });
    }

    async checkServerConnection() {
        try {
            // Intentar hacer una petición al servidor
            const response = await fetch(window.location.origin + '/test-connection', {
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 5000
            });
            
            // Si no hay respuesta, el servidor está caído
            if (!response.ok) {
                this.handleServerDisconnection();
            }
        } catch (error) {
            // Error de conexión - servidor probablemente caído
            this.handleServerDisconnection();
        }
    }

    handleServerDisconnection() {
        // Limpiar interval de verificación
        if (this.serverCheckInterval) {
            clearInterval(this.serverCheckInterval);
            this.serverCheckInterval = null;
        }

        // Emitir evento personalizado
        this.emitAuthEvent('serverDisconnected', 'Conexión con el servidor perdida', 'error');

        // Mostrar notificación
        this.showAuthNotification('Conexión con el servidor perdida. Cerrando sesión por seguridad.', 'error');
        
        // Cerrar sesión y limpiar datos
        this.auth.logout();
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    emitAuthEvent(type, message, level = 'info') {
        // Emitir evento personalizado para que las páginas puedan escucharlo
        const event = new CustomEvent('authGuardEvent', {
            detail: {
                type: type,
                message: message,
                level: level,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
        
        // También loggear en consola para debugging
        console.log(`[AuthGuard] ${type}: ${message}`);
    }

    checkPagePermissions() {
        const currentPage = window.location.pathname.toLowerCase();
        const user = this.auth.getCurrentUser();
        
        if (!user) return;

        // Definir permisos requeridos por página
        const pagePermissions = {
            'ventas.html': 'create_sale',
            'pedidos.html': 'view_orders',
            'mesas.html': 'view_tables',
            'estadisticas.html': 'view_statistics',
            'configuracion.html': 'admin_access'
        };

        // Verificar permiso específico
        for (const [page, permission] of Object.entries(pagePermissions)) {
            if (currentPage.includes(page)) {
                // Para configuración, solo administradores
                if (page === 'configuracion.html' && user.role !== 'administrador' && user.role !== 'admin') {
                    alert(`Acceso denegado. Solo administradores pueden acceder a la configuración.\nSu rol: ${user.role}`);
                    window.location.href = 'dashboard.html';
                    return;
                }
                
                // Para otras páginas, verificar permisos específicos
                if (!this.auth.hasPermission(permission)) {
                    alert(`No tiene permisos para acceder a este módulo.\nSu rol: ${user.role}\nPermiso requerido: ${permission}`);
                    window.location.href = 'dashboard.html';
                    return;
                }
                break;
            }
        }
    }

    updateUserInterface() {
        const user = this.auth.getCurrentUser();
        if (!user) return;

        // Actualizar nombre de usuario si existe el elemento
        const userNameElements = document.querySelectorAll('.user-name, #userName');
        userNameElements.forEach(element => {
            element.textContent = user.name;
        });

        // Actualizar rol de usuario si existe el elemento
        const userRoleElements = document.querySelectorAll('.user-role, #userRole');
        userRoleElements.forEach(element => {
            element.textContent = user.role;
        });

        // Actualizar título de página si es necesario
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle && !pageTitle.textContent.includes(user.name)) {
            pageTitle.textContent += ` - ${user.name}`;
        }

        // Mostrar/ocultar elementos según permisos
        this.toggleElementsByPermissions(user);
    }

    toggleElementsByPermissions(user) {
        // Elementos que requieren permisos específicos
        const permissionElements = {
            'admin-only': ['admin', 'administrador'],
            'cashier-access': ['admin', 'administrador', 'cajero'],
            'waiter-access': ['admin', 'administrador', 'cajero', 'mesero']
        };

        Object.entries(permissionElements).forEach(([className, roles]) => {
            const elements = document.querySelectorAll(`.${className}`);
            const hasAccess = roles.includes(user.role);
            
            elements.forEach(element => {
                if (hasAccess) {
                    element.style.display = '';
                    element.removeAttribute('disabled');
                } else {
                    element.style.display = 'none';
                    element.setAttribute('disabled', 'true');
                }
            });
        });
    }

    setupLogoutHandlers() {
        // Configurar todos los botones de logout
        document.querySelectorAll('.logout-btn, [onclick*="logout"]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });

        // Configurar logout automático por inactividad (30 minutos)
        this.setupInactivityLogout();
    }

    handleLogout() {
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            // Verificar si hay pedidos activos
            const hasActiveOrders = this.checkActiveOrders();
            
            if (hasActiveOrders) {
                const confirmed = confirm('Hay pedidos activos. ¿Continuar cerrando sesión?');
                if (!confirmed) return;
            }

            // Realizar logout
            this._redirecting = true;
            this.auth.logout();
            // No hacer redirección manual aquí, auth.logout() ya lo maneja
        }
    }

    checkActiveOrders() {
        try {
            const orders = db.getOrders().filter(order => 
                order.status === 'active' || order.status === 'pending'
            );
            return orders.length > 0;
        } catch (error) {
            console.warn('No se pudo verificar pedidos activos:', error);
            return false;
        }
    }

    setupInactivityLogout() {
        let inactivityTimer;
        const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (confirm('Su sesión ha expirado por inactividad. ¿Desea continuar?')) {
                    resetTimer(); // Resetear si el usuario quiere continuar
                } else {
                    this._redirecting = true;
                    this.auth.logout();
                    // No hacer redirección manual aquí
                }
            }, INACTIVITY_TIME);
        };

        // Eventos que resetean el timer
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Iniciar el timer
        resetTimer();
    }

    // Método para mostrar notificaciones de autenticación
    showAuthNotification(message, type = 'info') {
        // Crear elemento de notificación si no existe
        let notification = document.getElementById('auth-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'auth-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 300px;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(notification);
        }

        // Configurar estilos según el tipo
        const styles = {
            success: 'background-color: #10B981;',
            error: 'background-color: #EF4444;',
            warning: 'background-color: #F59E0B;',
            info: 'background-color: #3B82F6;'
        };

        notification.style.cssText += styles[type] || styles.info;
        notification.textContent = message;
        notification.style.opacity = '1';

        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar el guard de autenticación globalmente (solo una vez)
if (!window.authGuard) {
    window.authGuard = new AuthGuard();
}
