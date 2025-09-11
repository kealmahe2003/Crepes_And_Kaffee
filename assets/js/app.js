// Aplicación Principal - Crêpes & Kaffee POS
class CrepesKaffeePOS {
    constructor() {
        this.currentSection = 'pedidos';
        this.selectedProduct = null;
        this.cart = [];
        this.init();
    }

    init() {
        console.log('Iniciando Crêpes & Kaffee POS...');
        
        // Inicializar componentes
        this.initializeEventListeners();
        this.startClock();
        this.startAutoBackup();
        
        // Verificar estado de autenticación
        this.checkAuthState();
    }

    checkAuthState() {
        if (!auth.isLoggedIn()) {
            auth.showLogin();
        } else if (auth.needsCashOpening()) {
            auth.showCashOpening();
        } else {
            auth.showMainSystem();
            this.initializeMainSystem();
        }
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Cash opening form
        document.getElementById('cash-opening-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCashOpening();
        });

        // Sidebar navigation
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.sidebar-btn').dataset.section;
                this.navigateToSection(section);
            });
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Product search
        document.getElementById('product-search')?.addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Cart actions
        document.getElementById('remove-product-btn')?.addEventListener('click', () => {
            this.removeFromCart();
        });

        document.getElementById('send-order-btn')?.addEventListener('click', () => {
            this.sendOrder();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showToast('Por favor complete todos los campos', 'error');
            return;
        }

        const result = auth.login(username, password);
        
        if (result.success) {
            this.showToast(`Bienvenido ${result.user.name}`, 'success');
            
            if (auth.needsCashOpening()) {
                auth.showCashOpening();
            } else {
                auth.showMainSystem();
                this.initializeMainSystem();
            }
        } else {
            this.showToast(result.message, 'error');
            document.getElementById('password').value = '';
        }
    }

    handleCashOpening() {
        const initialCash = document.getElementById('initial-cash').value;

        if (!initialCash || isNaN(initialCash) || parseFloat(initialCash) < 0) {
            this.showToast('Por favor ingrese un monto válido', 'error');
            return;
        }

        const result = auth.openCashSession(initialCash, 'Apertura de caja del día');

        if (result.success) {
            this.showToast('Caja abierta exitosamente', 'success');
            auth.showMainSystem();
            this.initializeMainSystem();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    handleLogout() {
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            // Si hay pedidos activos, advertir
            const orders = db.getOrders().filter(o => o.status === 'active');
            if (orders.length > 0) {
                if (!confirm(`Hay ${orders.length} pedidos activos. ¿Continuar cerrando sesión?`)) {
                    return;
                }
            }

            this.showToast('Cerrando sesión...', 'success');
            setTimeout(() => {
                auth.logout();
            }, 1000);
        }
    }

    initializeMainSystem() {
        this.updateCashDisplay();
        this.loadProducts();
        this.loadActiveOrders();
        this.navigateToSection(this.currentSection);
        
        // Inicializar módulos específicos
        if (window.sales) {
            sales.init();
        }
        if (window.tables) {
            tables.init();
        }
        if (window.orders) {
            orders.init();
        }
    }

    navigateToSection(section) {
        // Actualizar sidebar
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Ocultar todas las secciones
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Mostrar sección seleccionada
        document.getElementById(`section-${section}`)?.classList.remove('hidden');

        // Actualizar título
        const titles = {
            pedidos: 'MÓDULO DE PEDIDOS',
            ventas: 'MÓDULO DE VENTAS',
            mesas: 'MÓDULO DE MESAS',
            estadisticas: 'MÓDULO DE ESTADÍSTICAS',
            ajustes: 'MÓDULO DE AJUSTES'
        };

        document.getElementById('page-title').textContent = titles[section] || 'SISTEMA POS';
        
        this.currentSection = section;

        // Cargar contenido específico de la sección
        this.loadSectionContent(section);
    }

    loadSectionContent(section) {
        switch (section) {
            case 'pedidos':
                this.loadActiveOrders();
                break;
            case 'ventas':
                this.loadProducts();
                break;
            case 'mesas':
                if (window.tables) tables.loadTables();
                break;
            case 'estadisticas':
                if (window.statistics) statistics.loadStatistics();
                break;
            case 'ajustes':
                if (window.settings) settings.loadSettings();
                break;
        }
    }

    loadProducts() {
        const products = db.getProducts().filter(p => p.active);
        const tbody = document.getElementById('products-table');
        
        if (!tbody) return;

        tbody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'product-row cursor-pointer hover:bg-gray-50';
            row.dataset.productId = product.id;
            
            row.innerHTML = `
                <td class="py-3 px-2 text-left">${product.name}</td>
                <td class="py-3 px-2 text-right font-semibold">${db.formatCurrency(product.price)}</td>
            `;

            row.addEventListener('click', () => {
                this.selectProduct(product);
            });

            tbody.appendChild(row);
        });
    }

    filterProducts(searchTerm) {
        const products = db.getProducts().filter(p => 
            p.active && p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const tbody = document.getElementById('products-table');
        if (!tbody) return;

        tbody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'product-row cursor-pointer hover:bg-gray-50';
            row.dataset.productId = product.id;
            
            row.innerHTML = `
                <td class="py-3 px-2 text-left">${product.name}</td>
                <td class="py-3 px-2 text-right font-semibold">${db.formatCurrency(product.price)}</td>
            `;

            row.addEventListener('click', () => {
                this.selectProduct(product);
            });

            tbody.appendChild(row);
        });
    }

    selectProduct(product) {
        // Deseleccionar producto anterior
        document.querySelectorAll('.product-row').forEach(row => {
            row.classList.remove('selected', 'bg-green-100');
        });

        // Seleccionar nuevo producto
        const row = document.querySelector(`[data-product-id="${product.id}"]`);
        if (row) {
            row.classList.add('selected', 'bg-green-100');
        }

        this.selectedProduct = product;
        this.addToCart(product);
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.updateCartDisplay();
        this.showToast(`${product.name} agregado al carrito`, 'success');
    }

    removeFromCart() {
        if (!this.selectedProduct) {
            this.showToast('Seleccione un producto primero', 'warning');
            return;
        }

        const quantityInput = document.getElementById('remove-quantity');
        const quantity = parseInt(quantityInput.value) || 1;

        const itemIndex = this.cart.findIndex(item => item.id === this.selectedProduct.id);
        
        if (itemIndex >= 0) {
            const item = this.cart[itemIndex];
            
            if (quantity >= item.quantity) {
                this.cart.splice(itemIndex, 1);
                this.showToast(`${item.name} removido del carrito`, 'success');
            } else {
                item.quantity -= quantity;
                this.showToast(`${quantity} ${item.name} removidos del carrito`, 'success');
            }
            
            this.updateCartDisplay();
            quantityInput.value = '';
        } else {
            this.showToast('El producto no está en el carrito', 'warning');
        }
    }

    updateCartDisplay() {
        const tbody = document.getElementById('cart-table');
        const totalElement = document.getElementById('cart-total');
        
        if (!tbody || !totalElement) return;

        tbody.innerHTML = '';
        let total = 0;

        this.cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;

            const row = document.createElement('tr');
            row.className = 'cursor-pointer hover:bg-gray-50';
            row.dataset.productId = item.id;
            
            row.innerHTML = `
                <td class="py-2 px-2 text-left">${item.name}</td>
                <td class="py-2 px-2 text-center">${item.quantity}</td>
                <td class="py-2 px-2 text-right font-semibold">${db.formatCurrency(subtotal)}</td>
            `;

            row.addEventListener('click', () => {
                this.selectProduct(item);
            });

            tbody.appendChild(row);
        });

        totalElement.textContent = db.formatCurrency(total);
    }

    sendOrder() {
        if (this.cart.length === 0) {
            this.showToast('El carrito está vacío', 'warning');
            return;
        }

        const tableSelect = document.getElementById('table-number');
        const tableNumber = tableSelect.value;

        if (!tableNumber) {
            this.showToast('Seleccione una mesa', 'warning');
            return;
        }

        // Crear orden
        const order = {
            id: Date.now(),
            tableNumber: parseInt(tableNumber),
            items: [...this.cart],
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser().name,
            notes: ''
        };

        // Guardar orden
        const orders = db.getOrders();
        orders.push(order);
        db.saveOrders(orders);

        // Actualizar mesa
        const tables = db.getTables();
        const table = tables.find(t => t.number === parseInt(tableNumber));
        if (table) {
            table.status = 'ocupada';
            table.orderId = order.id;
            table.startTime = new Date().toISOString();
            db.saveTables(tables);
        }

        // Limpiar carrito
        this.cart = [];
        this.updateCartDisplay();
        tableSelect.value = '';

        this.showToast(`Pedido enviado a Mesa ${tableNumber}`, 'success');
        
        // Actualizar vista de pedidos si está activa
        if (this.currentSection === 'pedidos') {
            this.loadActiveOrders();
        }
    }

    loadActiveOrders() {
        const orders = db.getOrders().filter(o => o.status === 'active');
        const container = document.getElementById('orders-container');
        const countElement = document.getElementById('active-orders-count');
        
        if (!container || !countElement) return;

        countElement.textContent = orders.length;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-shopping-cart text-4xl mb-4"></i>
                    <p>No hay pedidos activos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        orders.forEach(order => {
            const orderTime = new Date(order.createdAt);
            const now = new Date();
            const minutesElapsed = Math.floor((now - orderTime) / 60000);
            
            const orderCard = document.createElement('div');
            orderCard.className = `order-card bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all cursor-pointer`;
            
            orderCard.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-bold text-gray-800">Mesa ${order.tableNumber}</h3>
                        <p class="text-sm text-gray-600">${order.createdBy} • ${db.formatDate(order.createdAt)}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-lg font-bold text-green-600">${db.formatCurrency(order.total)}</span>
                        <p class="text-sm text-gray-500">${minutesElapsed} min</p>
                    </div>
                </div>
                <div class="space-y-1">
                    ${order.items.map(item => `
                        <div class="flex justify-between text-sm">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>${db.formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            orderCard.addEventListener('click', () => {
                this.showOrderDetails(order);
            });

            container.appendChild(orderCard);
        });
    }

    showOrderDetails(order) {
        // Aquí se implementaría un modal con los detalles del pedido
        console.log('Mostrar detalles del pedido:', order);
        this.showToast('Funcionalidad en desarrollo', 'warning');
    }

    updateCashDisplay() {
        const cashElement = document.getElementById('current-cash');
        if (!cashElement) return;

        const summary = auth.getCashSummary();
        if (summary) {
            cashElement.textContent = db.formatCurrency(summary.currentAmount);
        }
    }

    startClock() {
        const updateTime = () => {
            const now = new Date();
            
            const dateElement = document.getElementById('current-date');
            const timeElement = document.getElementById('current-time');
            
            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        };

        updateTime();
        setInterval(updateTime, 60000); // Actualizar cada minuto
    }

    startAutoBackup() {
        const config = db.getConfig();
        
        setInterval(() => {
            try {
                const backup = db.createBackup();
                console.log('Backup automático creado:', backup.timestamp);
            } catch (error) {
                console.error('Error en backup automático:', error);
            }
        }, config.backupInterval);
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + número para cambiar sección
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const sections = ['pedidos', 'ventas', 'mesas', 'estadisticas', 'ajustes'];
            const sectionIndex = parseInt(e.key) - 1;
            if (sections[sectionIndex]) {
                this.navigateToSection(sections[sectionIndex]);
            }
        }

        // ESC para limpiar selecciones
        if (e.key === 'Escape') {
            this.selectedProduct = null;
            document.querySelectorAll('.product-row').forEach(row => {
                row.classList.remove('selected', 'bg-green-100');
            });
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.pos = new CrepesKaffeePOS();
});
