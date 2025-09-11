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
        if (!this.currentCashSession) return true;
        
        const today = new Date().toDateString();
        const sessionDate = new Date(this.currentCashSession.openedAt).toDateString();
        
        return today !== sessionDate || this.currentCashSession.status === 'closed';
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
        if (!this.isLoggedIn()) {
            this.showLogin();
            return false;
        }

        if (this.needsCashOpening()) {
            this.showCashOpening();
            return false;
        }

        return true;
    }

    // Mostrar pantalla de login
    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-system').classList.add('hidden');
        document.getElementById('cash-opening-modal').classList.add('hidden');
    }

    // Mostrar modal de apertura de caja
    showCashOpening() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-system').classList.add('hidden');
        document.getElementById('cash-opening-modal').classList.remove('hidden');
    }

    // Mostrar sistema principal
    showMainSystem() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('cash-opening-modal').classList.add('hidden');
        document.getElementById('main-system').classList.remove('hidden');
    }
}

// Instancia global de autenticación
window.auth = new Auth();
