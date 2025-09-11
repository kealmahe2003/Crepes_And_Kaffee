// Sistema de Base de Datos Local para Crêpes & Kaffee
class Database {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar estructura de datos si no existe
        this.initializeData();
    }

    initializeData() {
        // Usuarios por defecto
        if (!localStorage.getItem('pos_users')) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    role: 'administrador',
                    name: 'Administrador',
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'cajero',
                    password: 'cajero123',
                    role: 'cajero',
                    name: 'Cajero Principal',
                    active: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    username: 'mesero',
                    password: 'mesero123',
                    role: 'mesero',
                    name: 'Mesero Principal',
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('pos_users', JSON.stringify(defaultUsers));
        }

        // Productos por defecto
        if (!localStorage.getItem('pos_products')) {
            const defaultProducts = [
                // Bebidas Calientes
                { id: 1, name: 'Americano', price: 4500, cost: 1500, category: 'bebidas-calientes', active: true },
                { id: 2, name: 'Cappuccino', price: 5500, cost: 2000, category: 'bebidas-calientes', active: true },
                { id: 3, name: 'Latte', price: 6000, cost: 2200, category: 'bebidas-calientes', active: true },
                { id: 4, name: 'Mocha', price: 6500, cost: 2500, category: 'bebidas-calientes', active: true },
                { id: 5, name: 'Caramel Macchiato', price: 7000, cost: 2800, category: 'bebidas-calientes', active: true },

                // Bebidas Frías
                { id: 6, name: 'Frappé Vainilla', price: 7500, cost: 3000, category: 'bebidas-frias', active: true },
                { id: 7, name: 'Frappé Chocolate', price: 8000, cost: 3200, category: 'bebidas-frias', active: true },
                { id: 8, name: 'Cold Brew', price: 5500, cost: 2000, category: 'bebidas-frias', active: true },
                { id: 9, name: 'Iced Latte', price: 6500, cost: 2300, category: 'bebidas-frias', active: true },
                { id: 10, name: 'Limonada Natural', price: 4000, cost: 1200, category: 'bebidas-frias', active: true },

                // Bebidas Sin Café
                { id: 11, name: 'Chocolate Caliente', price: 5000, cost: 1800, category: 'bebidas-sin-cafe', active: true },
                { id: 12, name: 'Té Chai Latte', price: 5500, cost: 2000, category: 'bebidas-sin-cafe', active: true },
                { id: 13, name: 'Té Verde', price: 3500, cost: 1000, category: 'bebidas-sin-cafe', active: true },
                { id: 14, name: 'Jugo de Naranja', price: 4500, cost: 1500, category: 'bebidas-sin-cafe', active: true },
                { id: 15, name: 'Agua', price: 2000, cost: 500, category: 'bebidas-sin-cafe', active: true },

                // Crêpes Dulces
                { id: 16, name: 'Crêpe Nutella', price: 8500, cost: 3000, category: 'crepes-dulces', active: true },
                { id: 17, name: 'Crêpe de Fresa', price: 9000, cost: 3200, category: 'crepes-dulces', active: true },
                { id: 18, name: 'Crêpe de Banana', price: 8500, cost: 3000, category: 'crepes-dulces', active: true },
                { id: 19, name: 'Crêpe de Manzana', price: 9000, cost: 3200, category: 'crepes-dulces', active: true },
                { id: 20, name: 'Crêpe Nutella & Fresa', price: 10500, cost: 3800, category: 'crepes-dulces', active: true },
                { id: 21, name: 'Crêpe Nutella & Banana', price: 10000, cost: 3600, category: 'crepes-dulces', active: true },
                { id: 22, name: 'Crêpe de Mermelada', price: 7500, cost: 2500, category: 'crepes-dulces', active: true },
                { id: 23, name: 'Crêpe Dulce de Leche', price: 8500, cost: 3000, category: 'crepes-dulces', active: true },
                { id: 24, name: 'Crêpe Tres Leches', price: 11000, cost: 4000, category: 'crepes-dulces', active: true },
                { id: 25, name: 'Crêpe Mixto de Frutas', price: 11500, cost: 4200, category: 'crepes-dulces', active: true },

                // Crêpes Salados
                { id: 26, name: 'Crêpe Jamón y Queso', price: 10000, cost: 3500, category: 'crepes-salados', active: true },
                { id: 27, name: 'Crêpe Solo Queso', price: 8500, cost: 2800, category: 'crepes-salados', active: true },
                { id: 28, name: 'Crêpe Pollo y Queso', price: 11000, cost: 4000, category: 'crepes-salados', active: true },
                { id: 29, name: 'Crêpe de Champiñones', price: 9500, cost: 3200, category: 'crepes-salados', active: true },
                { id: 30, name: 'Crêpe Espinaca y Queso', price: 9500, cost: 3200, category: 'crepes-salados', active: true },
                { id: 31, name: 'Crêpe de Atún', price: 10500, cost: 3800, category: 'crepes-salados', active: true }
            ];
            localStorage.setItem('pos_products', JSON.stringify(defaultProducts));
        }

        // Configuración del sistema
        if (!localStorage.getItem('pos_config')) {
            const defaultConfig = {
                businessName: 'Crêpes & Kaffee',
                address: 'Dirección del negocio',
                phone: 'Teléfono del negocio',
                currency: 'COP',
                maxTables: 7,
                backupInterval: 3600000, // 1 hora en milisegundos
                autoCloseOrders: false,
                printCopies: 1,
                lastBackup: null
            };
            localStorage.setItem('pos_config', JSON.stringify(defaultConfig));
        }

        // Inicializar otras estructuras de datos
        if (!localStorage.getItem('pos_sales')) {
            localStorage.setItem('pos_sales', JSON.stringify([]));
        }

        if (!localStorage.getItem('pos_orders')) {
            localStorage.setItem('pos_orders', JSON.stringify([]));
        }

        if (!localStorage.getItem('pos_tables')) {
            const defaultTables = [];
            for (let i = 1; i <= 7; i++) {
                defaultTables.push({
                    id: i,
                    numero: i,
                    estado: 'libre', // libre, ocupada, reservada, limpieza
                    capacidad: 4,
                    ubicacion: i <= 3 ? 'Terraza' : 'Interior',
                    pedidoActual: null,
                    reserva: null,
                    ultimaActividad: null
                });
            }
            localStorage.setItem('pos_tables', JSON.stringify(defaultTables));
        }
        
        // Verificar que las mesas tengan la estructura correcta
        const existingTables = JSON.parse(localStorage.getItem('pos_tables'));
        if (existingTables.length > 0 && !existingTables[0].hasOwnProperty('numero')) {
            // Actualizar estructura de mesas existentes
            const updatedTables = existingTables.map((table, index) => ({
                id: table.id || index + 1,
                numero: table.number || table.numero || index + 1,
                estado: table.status === 'available' ? 'libre' : table.estado || 'libre',
                capacidad: table.capacity || table.capacidad || 4,
                ubicacion: table.ubicacion || 'Interior',
                pedidoActual: table.pedidoActual || null,
                reserva: table.reserva || null,
                ultimaActividad: table.ultimaActividad || null
            }));
            localStorage.setItem('pos_tables', JSON.stringify(updatedTables));
        }

        if (!localStorage.getItem('pos_cash_sessions')) {
            localStorage.setItem('pos_cash_sessions', JSON.stringify([]));
        }
    }

    // Métodos para usuarios
    getUsers() {
        return JSON.parse(localStorage.getItem('pos_users') || '[]');
    }

    saveUsers(users) {
        localStorage.setItem('pos_users', JSON.stringify(users));
    }

    // Métodos para productos
    getProducts() {
        return JSON.parse(localStorage.getItem('pos_products') || '[]');
    }

    saveProducts(products) {
        localStorage.setItem('pos_products', JSON.stringify(products));
    }

    addProduct(product) {
        const products = this.getProducts();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: newId,
            ...product,
            createdAt: new Date().toISOString(),
            active: true
        };
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    }

    updateProduct(productId, updates) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveProducts(products);
            return products[index];
        }
        return null;
    }

    deleteProduct(productId) {
        const products = this.getProducts();
        const filteredProducts = products.filter(p => p.id !== productId);
        this.saveProducts(filteredProducts);
        return filteredProducts.length < products.length;
    }

    getProductById(productId) {
        const products = this.getProducts();
        return products.find(p => p.id === productId);
    }

    getProductsByCategory(category) {
        const products = this.getProducts();
        return products.filter(p => p.category === category && p.active);
    }

    getCategories() {
        const products = this.getProducts();
        const categories = [...new Set(products.map(p => p.category).filter(c => c))];
        return categories.sort((a, b) => a.localeCompare(b));
    }

    // Métodos para ventas
    getSales() {
        return JSON.parse(localStorage.getItem('pos_sales') || '[]');
    }

    saveSales(sales) {
        localStorage.setItem('pos_sales', JSON.stringify(sales));
    }

    // Métodos para pedidos
    getOrders() {
        return JSON.parse(localStorage.getItem('pos_orders') || '[]');
    }

    saveOrders(orders) {
        localStorage.setItem('pos_orders', JSON.stringify(orders));
    }

    saveOrder(order) {
        const orders = this.getOrders();
        const existingIndex = orders.findIndex(o => o.id === order.id);
        
        if (existingIndex >= 0) {
            orders[existingIndex] = order;
        } else {
            orders.push(order);
        }
        
        this.saveOrders(orders);
        return order;
    }

    deleteOrder(orderId) {
        const orders = this.getOrders();
        const filteredOrders = orders.filter(o => o.id !== orderId);
        this.saveOrders(filteredOrders);
        return filteredOrders;
    }

    getOrderById(orderId) {
        const orders = this.getOrders();
        return orders.find(o => o.id === orderId);
    }

    // Métodos para mesas
    getTables() {
        return JSON.parse(localStorage.getItem('pos_tables') || '[]');
    }

    saveTables(tables) {
        localStorage.setItem('pos_tables', JSON.stringify(tables));
    }

    addTable(table) {
        const tables = this.getTables();
        
        // Generar ID si no existe
        if (!table.id) {
            const maxId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) : 0;
            table.id = maxId + 1;
        }
        
        const existingIndex = tables.findIndex(t => t.id === table.id);
        
        if (existingIndex >= 0) {
            tables[existingIndex] = { ...tables[existingIndex], ...table };
        } else {
            tables.push({
                ...table,
                ultimaActividad: new Date().toISOString()
            });
        }
        
        this.saveTables(tables);
        return table;
    }

    updateTable(tableId, tableData) {
        const tables = this.getTables();
        const existingIndex = tables.findIndex(t => t.id === tableId);
        
        if (existingIndex >= 0) {
            tables[existingIndex] = { 
                ...tables[existingIndex], 
                ...tableData,
                ultimaActividad: new Date().toISOString()
            };
            this.saveTables(tables);
            return tables[existingIndex];
        }
        
        throw new Error('Mesa no encontrada');
    }

    updateTableStatus(tableId, estado, data = {}) {
        const tables = this.getTables();
        const table = tables.find(t => t.id === tableId);
        if (table) {
            table.estado = estado;
            table.ultimaActividad = new Date().toISOString();
            
            // Aplicar datos adicionales según el estado
            if (estado === 'ocupada' && data.pedido) {
                table.pedidoActual = data.pedido;
            } else if (estado === 'reservada' && data.reserva) {
                table.reserva = data.reserva;
            } else if (estado === 'libre') {
                table.pedidoActual = null;
                table.reserva = null;
            }
            
            this.saveTables(tables);
        }
        return table;
    }

    // Métodos para configuración
    getConfig() {
        return JSON.parse(localStorage.getItem('pos_config') || '{}');
    }

    saveConfig(config) {
        localStorage.setItem('pos_config', JSON.stringify(config));
    }

    // Métodos para sesiones de caja
    getCashSessions() {
        return JSON.parse(localStorage.getItem('pos_cash_sessions') || '[]');
    }

    saveCashSessions(sessions) {
        localStorage.setItem('pos_cash_sessions', JSON.stringify(sessions));
    }

    // Backup y restauración
    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                users: this.getUsers(),
                products: this.getProducts(),
                sales: this.getSales(),
                orders: this.getOrders(),
                tables: this.getTables(),
                config: this.getConfig(),
                cashSessions: this.getCashSessions()
            }
        };

        const config = this.getConfig();
        config.lastBackup = backup.timestamp;
        this.saveConfig(config);

        return backup;
    }

    restoreBackup(backupData) {
        try {
            const data = backupData.data;
            this.saveUsers(data.users || []);
            this.saveProducts(data.products || []);
            this.saveSales(data.sales || []);
            this.saveOrders(data.orders || []);
            this.saveTables(data.tables || []);
            this.saveConfig(data.config || {});
            this.saveCashSessions(data.cashSessions || []);
            return true;
        } catch (error) {
            console.error('Error al restaurar backup:', error);
            return false;
        }
    }

    // Limpiar datos (para desarrollo)
    clearAllData() {
        const keys = [
            'pos_users', 'pos_products', 'pos_sales', 'pos_orders',
            'pos_tables', 'pos_config', 'pos_cash_sessions',
            'pos_current_user', 'pos_current_cash_session'
        ];
        keys.forEach(key => localStorage.removeItem(key));
        this.initializeData();
    }

    // Utilidades
    generateId(collection) {
        const items = this[`get${collection}`]();
        return items.length > 0 ? Math.max(...items.map(item => item.id || 0)) + 1 : 1;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Instancia global de la base de datos
window.db = new Database();
