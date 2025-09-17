// Sistema de Autenticación para Crêpes & Kaffee
class Auth {
    constructor() {
        this.currentUser = null;
        this.currentCashSession = null;
        this.init();
    }

    init() {
        // Verificar si hay un usuario logueado
        const savedUser = localStorage.getItem('pos_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }

        // Verificar sesión de caja activa
        const savedCashSession = localStorage.getItem('pos_current_cash_session');
        if (savedCashSession) {
            this.currentCashSession = JSON.parse(savedCashSession);
        }
    }

    // Autenticar usuario
    login(username, password) {
        const users = db.getUsers();
        const user = users.find(u => 
            u.username === username && 
            u.password === password && 
            u.active
        );

        if (user) {
            this.currentUser = {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('pos_current_user', JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        }

        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    // Cerrar sesión
    logout() {
        // Cerrar sesión de caja si está abierta
        if (this.currentCashSession) {
            this.closeCashSession();
        }

        this.currentUser = null;
        this.currentCashSession = null;
        localStorage.removeItem('pos_current_user');
        localStorage.removeItem('pos_current_cash_session');
        
        // Recargar página para volver al login
        window.location.reload();
    }

    // Verificar si el usuario está logueado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Verificar si la caja está abierta
    isCashSessionOpen() {
        return this.currentCashSession !== null && this.currentCashSession.status === 'open';
    }

    // Verificar si necesita abrir caja
    needsCashOpening() {
        console.log('[Auth] needsCashOpening - currentCashSession:', this.currentCashSession);
        
        if (!this.currentCashSession) {
            console.log('[Auth] No cash session found, opening needed');
            return true;
        }
        
        const today = new Date().toDateString();
        const sessionDate = new Date(this.currentCashSession.openedAt).toDateString();
        
        console.log('[Auth] Today:', today);
        console.log('[Auth] Session date:', sessionDate);
        console.log('[Auth] Session status:', this.currentCashSession.status);
        
        const needsOpening = today !== sessionDate || this.currentCashSession.status === 'closed';
        console.log('[Auth] Cash opening needed:', needsOpening);
        
        return needsOpening;
    }

    // Verificar si la caja está abierta para operaciones de venta
    isCashSessionActive() {
        if (!this.currentCashSession) {
            return false;
        }
        
        const today = new Date().toDateString();
        const sessionDate = new Date(this.currentCashSession.openedAt).toDateString();
        
        return today === sessionDate && this.currentCashSession.status === 'open';
    }

    // Mostrar notificación de caja cerrada
    showCashClosedNotification(action = 'realizar esta operación') {
        const message = `La caja debe estar abierta para ${action}. Por favor, abra la caja primero.`;
        
        // Intentar mostrar notificación en el sistema actual
        if (window.showNotification) {
            window.showNotification(message, 'warning');
        } else if (window.salesManager && window.salesManager.showNotification) {
            window.salesManager.showNotification(message, 'warning');
        } else if (window.mesasManager && window.mesasManager.showNotification) {
            window.mesasManager.showNotification(message, 'warning');
        } else {
            alert(message);
        }
        
        return false;
    }

    // Abrir sesión de caja
    openCashSession(initialAmount, notes = '') {
        if (this.currentCashSession && this.currentCashSession.status === 'open') {
            return { success: false, message: 'Ya hay una sesión de caja abierta' };
        }

        const cashSession = {
            id: Date.now(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            initialAmount: parseFloat(initialAmount),
            currentAmount: parseFloat(initialAmount),
            totalSales: 0,
            totalCash: parseFloat(initialAmount),
            totalCard: 0,
            totalTransfer: 0,
            openedAt: new Date().toISOString(),
            closedAt: null,
            status: 'open',
            notes: notes,
            transactions: []
        };

        this.currentCashSession = cashSession;
        localStorage.setItem('pos_current_cash_session', JSON.stringify(cashSession));

        // Guardar en historial
        const sessions = db.getCashSessions();
        sessions.push(cashSession);
        db.saveCashSessions(sessions);

        return { success: true, session: cashSession };
    }

    // Cerrar sesión de caja
    closeCashSession(finalAmount, notes = '') {
        if (!this.currentCashSession) {
            return { success: false, message: 'No hay sesión de caja abierta' };
        }

        const session = this.currentCashSession;
        session.finalAmount = parseFloat(finalAmount);
        session.closedAt = new Date().toISOString();
        session.status = 'closed';
        session.closeNotes = notes;
        session.difference = session.finalAmount - session.currentAmount;

        // Actualizar en el historial
        const sessions = db.getCashSessions();
        const index = sessions.findIndex(s => s.id === session.id);
        if (index >= 0) {
            sessions[index] = session;
            db.saveCashSessions(sessions);
        }

        this.currentCashSession = null;
        localStorage.removeItem('pos_current_cash_session');

        return { success: true, session: session };
    }

    // Agregar transacción a la sesión de caja
    addTransaction(type, amount, method, description = '') {
        if (!this.currentCashSession) return false;

        const transaction = {
            id: Date.now(),
            type: type, // 'sale', 'refund', 'withdrawal', 'deposit'
            amount: parseFloat(amount),
            method: method, // 'cash', 'card', 'transfer'
            description: description,
            timestamp: new Date().toISOString(),
            userId: this.currentUser.id
        };

        this.currentCashSession.transactions.push(transaction);

        // Actualizar totales
        if (type === 'sale') {
            this.currentCashSession.totalSales += transaction.amount;
            
            switch (method) {
                case 'cash':
                    this.currentCashSession.totalCash += transaction.amount;
                    this.currentCashSession.currentAmount += transaction.amount;
                    break;
                case 'card':
                    this.currentCashSession.totalCard += transaction.amount;
                    break;
                case 'transfer':
                    this.currentCashSession.totalTransfer += transaction.amount;
                    break;
            }
        } else if (type === 'withdrawal' && method === 'cash') {
            this.currentCashSession.currentAmount -= transaction.amount;
        } else if (type === 'deposit' && method === 'cash') {
            this.currentCashSession.currentAmount += transaction.amount;
        }

        // Guardar sesión actualizada
        localStorage.setItem('pos_current_cash_session', JSON.stringify(this.currentCashSession));

        // Actualizar en base de datos
        const sessions = db.getCashSessions();
        const index = sessions.findIndex(s => s.id === this.currentCashSession.id);
        if (index >= 0) {
            sessions[index] = this.currentCashSession;
            db.saveCashSessions(sessions);
        }

        return true;
    }

    // Obtener resumen de caja actual
    getCashSummary() {
        if (!this.currentCashSession) return null;

        return {
            initialAmount: this.currentCashSession.initialAmount,
            currentAmount: this.currentCashSession.currentAmount,
            totalSales: this.currentCashSession.totalSales,
            totalCash: this.currentCashSession.totalCash,
            totalCard: this.currentCashSession.totalCard,
            totalTransfer: this.currentCashSession.totalTransfer,
            transactionCount: this.currentCashSession.transactions.length,
            openedAt: this.currentCashSession.openedAt,
            duration: this.getSessionDuration()
        };
    }

    // Calcular duración de la sesión
    getSessionDuration() {
        if (!this.currentCashSession) return 0;
        
        const start = new Date(this.currentCashSession.openedAt);
        const end = this.currentCashSession.closedAt ? 
            new Date(this.currentCashSession.closedAt) : 
            new Date();
        
        return Math.floor((end - start) / 1000 / 60); // minutos
    }

    // Verificar permisos de usuario
    hasPermission(permission) {
        if (!this.currentUser) return false;

        const permissions = {
            administrador: ['*'], // Todos los permisos
            admin: ['*'], // Todos los permisos
            cajero: [
                'view_sales', 'create_sale', 'view_orders', 'create_order',
                'view_tables', 'update_tables', 'view_products', 'print_receipts',
                'view_statistics', 'open_cash', 'close_cash'
            ],
            mesero: [
                'view_orders', 'create_order', 'view_tables', 'update_tables', 
                'view_products', 'view_sales'
            ]
        };

        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Obtener sesión de caja actual
    getCurrentCashSession() {
        return this.currentCashSession;
    }

    // Validar sesión activa
    validateSession() {
        console.log('[Auth] validateSession called on page:', window.location.pathname);
        console.log('[Auth] isLoggedIn():', this.isLoggedIn());
        
        if (!this.isLoggedIn()) {
            console.log('[Auth] Not logged in');
            return false;
        }

        // Solo verificar apertura de caja en páginas específicas que la requieren
        const pagesRequiringCash = ['caja.html', 'ventas.html', 'mesas.html'];
        const currentPage = window.location.pathname;
        const requiresCash = pagesRequiringCash.some(page => currentPage.includes(page));
        
        console.log('[Auth] Page requires cash session:', requiresCash);
        console.log('[Auth] Current cash session active:', this.isCashSessionActive());
        
        // Para páginas que requieren caja, verificar que esté abierta
        if (requiresCash && !this.isCashSessionActive()) {
            console.log('[Auth] Cash session required but not active');
            // No forzar logout, solo indicar que la caja debe estar abierta
            return true; // Permitir que la página se cargue, la validación de caja se maneja en cada operación
        }

        console.log('[Auth] Session validation passed');
        return true;
    }

    // Mostrar pantalla de login
    showLogin() {
        const loginScreen = document.getElementById('login-screen');
        const mainSystem = document.getElementById('main-system');
        const cashModal = document.getElementById('cash-opening-modal');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (mainSystem) mainSystem.classList.add('hidden');
        if (cashModal) cashModal.classList.add('hidden');
    }

    // Mostrar modal de apertura de caja
    showCashOpening() {
        const loginScreen = document.getElementById('login-screen');
        const mainSystem = document.getElementById('main-system');
        const cashModal = document.getElementById('cash-opening-modal');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainSystem) mainSystem.classList.add('hidden');
        if (cashModal) cashModal.classList.remove('hidden');
    }

    // Mostrar sistema principal
    showMainSystem() {
        const loginScreen = document.getElementById('login-screen');
        const mainSystem = document.getElementById('main-system');
        const cashModal = document.getElementById('cash-opening-modal');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (cashModal) cashModal.classList.add('hidden');
        if (mainSystem) mainSystem.classList.remove('hidden');
    }
}

// Instancia global de autenticación
window.auth = new Auth();
