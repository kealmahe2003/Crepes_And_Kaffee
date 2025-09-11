// Sistema de Protección de Autenticación
class AuthGuard {
    constructor() {
        this.init();
    }

    init() {
        // Verificar autenticación al cargar cualquier página
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.setupLogoutHandlers();
        });
    }

    checkAuthentication() {
        // Si estamos en la página de login, no hacer verificaciones
        if (window.location.pathname.includes('login.html')) {
            // Si ya está logueado, redirigir al dashboard
            if (auth.isLoggedIn()) {
                window.location.href = 'dashboard.html';
            }
            return;
        }

        // Para todas las demás páginas, verificar autenticación
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        // Verificar permisos específicos según la página
        this.checkPagePermissions();
        
        // Actualizar información del usuario en la interfaz
        this.updateUserInterface();
    }

    checkPagePermissions() {
        const currentPage = window.location.pathname.toLowerCase();
        const user = auth.getCurrentUser();
        
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
                if (!auth.hasPermission(permission)) {
                    alert(`No tiene permisos para acceder a este módulo.\nSu rol: ${user.role}\nPermiso requerido: ${permission}`);
                    window.location.href = 'dashboard.html';
                    return;
                }
                break;
            }
        }
    }

    updateUserInterface() {
        const user = auth.getCurrentUser();
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
            auth.logout();
            window.location.href = 'login.html';
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
                    auth.logout();
                    window.location.href = 'login.html';
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

// Inicializar el guard de autenticación globalmente
window.authGuard = new AuthGuard();
