// Sistema de Base de Datos Local para Crêpes & Kaffee
class Database {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar estructura de datos si no existe
        this.initializeData();
        this.initializeCashSessions();
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

    getUserById(userId) {
        const users = this.getUsers();
        console.log('getUserById - Buscando usuario:', userId);
        console.log('getUserById - Lista de usuarios:', users);
        
        // Buscar por ID (puede ser string o number)
        const user = users.find(user => {
            console.log('Comparando:', user.id, 'con', userId, 'tipos:', typeof user.id, typeof userId);
            return user.id == userId || user.id === userId;
        });
        
        console.log('getUserById - Usuario encontrado:', user);
        return user || null;
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

    saveSale(sale) {
        const sales = this.getSales();
        const existingIndex = sales.findIndex(s => s.id === sale.id);
        
        if (existingIndex >= 0) {
            sales[existingIndex] = sale;
        } else {
            sales.push(sale);
        }
        
        this.saveSales(sales);
    }

    // Métodos para pedidos
    getOrders() {
        return JSON.parse(localStorage.getItem('pos_orders') || '[]');
    }

    saveOrders(orders) {
        localStorage.setItem('pos_orders', JSON.stringify(orders));
    }

    saveOrder(order) {
        console.log('=== DEBUG saveOrder INICIO ===');
        console.log('saveOrder - Pedido a guardar:', order);
        console.log('saveOrder - localStorage antes:', localStorage.getItem('pos_orders'));
        
        const orders = this.getOrders();
        const existingIndex = orders.findIndex(o => o.id == order.id); // Usar == para comparación flexible
        
        console.log('saveOrder - Buscando pedido con ID:', order.id);
        console.log('saveOrder - Índice encontrado:', existingIndex);
        console.log('saveOrder - Total pedidos antes:', orders.length);
        console.log('saveOrder - Orders antes:', orders.map(o => ({id: o.id, mesa: o.mesa, total: o.total})));
        
        let logAction = '';
        let logDetails = '';
        
        if (existingIndex >= 0) {
            console.log('saveOrder - Encontrado pedido existente en índice:', existingIndex);
            
            const previousOrder = orders[existingIndex];
            console.log('saveOrder - Pedido anterior:', previousOrder);
            
            // Verificar si es solo un cambio de estado o una actualización de contenido
            const isStatusChange = previousOrder.estado !== order.estado && 
                                 JSON.stringify(previousOrder.items) === JSON.stringify(order.items) &&
                                 previousOrder.total === order.total;
            
            if (isStatusChange) {
                // Solo cambio de estado - actualizar directamente
                console.log('saveOrder - Solo cambio de estado, actualizando directamente');
                logAction = 'status_changed';
                logDetails = `Estado cambiado de "${previousOrder.estado}" a "${order.estado}"`;
                orders[existingIndex] = order;
            } else {
                // Actualización de contenido - cancelar anterior y crear nuevo
                console.log('saveOrder - Actualización de contenido detectada - aplicando estrategia CANCELAR + CREAR NUEVO');
                
                // 1. Marcar el pedido anterior como cancelado
                const cancelledOrder = { ...previousOrder };
                cancelledOrder.estado = 'cancelado';
                cancelledOrder.fechaCancelacion = new Date().toISOString();
                cancelledOrder.motivoCancelacion = 'Actualizado - Reemplazado por nuevo pedido';
                orders[existingIndex] = cancelledOrder;
                
                console.log('saveOrder - Pedido anterior marcado como cancelado:', cancelledOrder);
                
                // Si el pedido cancelado tenía una mesa, no la liberamos aquí porque 
                // el nuevo pedido la va a usar. La mesa se quedará con el mismo número
                // pero se actualizará con el nuevo pedido ID más adelante
                
                // 2. Crear un nuevo pedido con ID fresco
                const newOrder = { ...order };
                newOrder.id = Date.now(); // ID completamente nuevo
                newOrder.timestamp = new Date().toISOString();
                newOrder.hora = new Date().toLocaleTimeString('es-ES');
                newOrder.pedidoAnteriorId = previousOrder.id; // Referencia al pedido cancelado
                
                // Agregar el nuevo pedido
                orders.push(newOrder);
                
                console.log('saveOrder - Nuevo pedido creado con ID:', newOrder.id);
                console.log('saveOrder - Nuevo pedido:', newOrder);
                
                // Logs para ambas acciones
                this.addOrderLog(previousOrder.id, 'cancelled_for_update', `Pedido cancelado por actualización - Reemplazado por pedido #${newOrder.id}`);
                
                logAction = 'created_from_update';
                logDetails = `Nuevo pedido creado reemplazando #${previousOrder.id} - Mesa: ${newOrder.mesa || 'N/A'}, Items: ${newOrder.items.length}, Total: $${newOrder.total}`;
                
                // Guardar y retornar el nuevo pedido
                this.saveOrders(orders);
                this.addOrderLog(newOrder.id, logAction, logDetails);
                
                console.log('saveOrder - localStorage después:', localStorage.getItem('pos_orders'));
                console.log('saveOrder - Total pedidos después:', orders.length);
                console.log('=== DEBUG saveOrder FIN - NUEVO PEDIDO CREADO ===');
                
                return newOrder; // Retornar el nuevo pedido
            }
        } else {
            console.log('saveOrder - Agregando nuevo pedido');
            logAction = 'created';
            logDetails = `Nuevo pedido creado - Mesa: ${order.mesa || 'N/A'}, Items: ${order.items.length}, Total: $${order.total}`;
            orders.push(order);
        }
        
        // Para casos normales (nuevo pedido o solo cambio de estado)
        this.saveOrders(orders);
        
        // Registrar el cambio en los logs
        this.addOrderLog(order.id, logAction, logDetails);
        
        console.log('saveOrder - localStorage después:', localStorage.getItem('pos_orders'));
        console.log('saveOrder - Total pedidos después:', orders.length);
        console.log('saveOrder - Orders después:', orders.map(o => ({id: o.id, mesa: o.mesa, total: o.total})));
        console.log('=== DEBUG saveOrder FIN ===');
        return order;
    }

    updateOrder(orderId, orderData) {
        const orders = this.getOrders();
        const existingIndex = orders.findIndex(o => o.id == orderId);
        
        if (existingIndex >= 0) {
            orders[existingIndex] = { ...orders[existingIndex], ...orderData };
            this.saveOrders(orders);
            return orders[existingIndex];
        }
        
        return null;
    }

    addSale(sale) {
        const sales = this.getSales();
        sales.push(sale);
        this.saveSales(sales);
        
        // Disparar evento personalizado para notificar que se completó una venta
        const saleCompletedEvent = new CustomEvent('saleCompleted', {
            detail: { sale: sale }
        });
        window.dispatchEvent(saleCompletedEvent);
        
        return sale;
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

    saveTable(table) {
        const tables = this.getTables();
        const existingIndex = tables.findIndex(t => t.id === table.id || t.numero === table.numero);
        
        if (existingIndex >= 0) {
            tables[existingIndex] = table;
        } else {
            tables.push(table);
        }
        
        this.saveTables(tables);
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
        console.log('[Database] Creando respaldo completo del sistema...');
        
        const backup = {
            timestamp: new Date().toISOString(),
            version: '2.0', // Incrementado para indicar respaldo mejorado
            systemInfo: {
                backupType: 'complete',
                createdBy: this.getCurrentUser()?.name || 'Sistema',
                description: 'Respaldo completo incluyendo todos los datos de ventas, reportes y análisis'
            },
            data: {
                // Datos básicos del sistema
                users: this.getUsers(),
                products: this.getProducts(),
                tables: this.getTables(),
                config: this.getConfig(),
                
                // Datos de ventas y transacciones
                sales: this.getSales(),
                orders: this.getOrders(),
                orderLogs: this.getOrderLogs(),
                cashSessions: this.getCashSessions(),
                
                // Datos de reportes y análisis (para poder recrear reportes históricos)
                categories: this.getCategories(),
                
                // Datos calculados para backup completo de reportes
                analytics: {
                    // Resumen ejecutivo del último año
                    executiveSummary: this.getExecutiveSummary('year'),
                    
                    // Análisis de ventas generales (últimos 365 días)
                    salesAnalytics: this.getSalesAnalytics(
                        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        new Date().toISOString().split('T')[0]
                    ),
                    
                    // Top productos vendidos (histórico completo)
                    topSellingProducts: this.getTopSellingProducts(50), // Top 50 productos
                    
                    // Análisis por categorías (histórico completo) 
                    categoryAnalytics: this.getCategoryAnalytics(),
                    
                    // Análisis de métodos de pago (histórico completo)
                    paymentMethodAnalytics: this.getPaymentMethodAnalytics(),
                    
                    // Tendencias de ventas (últimos 90 días)
                    salesTrends: this.getDailySalesTrends(90),
                    
                    // Rendimiento de cajeros (histórico completo)
                    cashierPerformance: this.getCashierPerformance()
                },
                
                // Metadata adicional para restore
                backupMetadata: {
                    totalSales: this.getSales().length,
                    totalOrders: this.getOrders().length,
                    totalUsers: this.getUsers().length,
                    totalProducts: this.getProducts().length,
                    totalTables: this.getTables().length,
                    totalCashSessions: this.getCashSessions().length,
                    totalOrderLogs: this.getOrderLogs().length,
                    dateRange: {
                        firstSale: this.getSales().length > 0 ? 
                            Math.min(...this.getSales().map(s => new Date(s.fecha || s.timestamp || Date.now()).getTime())) : null,
                        lastSale: this.getSales().length > 0 ? 
                            Math.max(...this.getSales().map(s => new Date(s.fecha || s.timestamp || Date.now()).getTime())) : null
                    }
                }
            }
        };

        // Actualizar configuración con timestamp del último backup
        const config = this.getConfig();
        config.lastBackup = backup.timestamp;
        this.saveConfig(config);

        console.log('[Database] Respaldo completado:', {
            timestamp: backup.timestamp,
            totalItems: Object.keys(backup.data).length,
            metadata: backup.data.backupMetadata
        });

        return backup;
    }

    restoreBackup(backupData) {
        try {
            console.log('[Database] Iniciando restauración de respaldo...');
            
            const data = backupData.data;
            const backupVersion = backupData.version || '1.0';
            
            console.log('[Database] Versión del respaldo:', backupVersion);
            
            // Restaurar datos básicos del sistema
            this.saveUsers(data.users || []);
            this.saveProducts(data.products || []);
            this.saveTables(data.tables || []);
            this.saveConfig(data.config || {});
            
            // Restaurar datos de ventas y transacciones
            this.saveSales(data.sales || []);
            this.saveOrders(data.orders || []);
            this.saveCashSessions(data.cashSessions || []);
            
            // Restaurar logs de pedidos (si existen)
            if (data.orderLogs) {
                localStorage.setItem('pos_order_logs', JSON.stringify(data.orderLogs));
                console.log('[Database] Logs de pedidos restaurados:', data.orderLogs.length, 'entradas');
            }
            
            // Si es un backup versión 2.0 o superior, mostrar información adicional
            if (backupVersion >= '2.0' && data.backupMetadata) {
                console.log('[Database] Información del respaldo:', {
                    totalSales: data.backupMetadata.totalSales,
                    totalOrders: data.backupMetadata.totalOrders,
                    totalUsers: data.backupMetadata.totalUsers,
                    totalProducts: data.backupMetadata.totalProducts,
                    dateRange: data.backupMetadata.dateRange
                });
                
                // Los datos de analytics no se restauran directamente ya que se calculan dinámicamente,
                // pero están disponibles en el backup para referencia
                if (data.analytics) {
                    console.log('[Database] Datos de análisis disponibles en el respaldo (no se restauran directamente)');
                }
            }
            
            console.log('[Database] Restauración completada exitosamente');
            return true;
        } catch (error) {
            console.error('[Database] Error al restaurar backup:', error);
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

    // === SISTEMA DE CAJA REGISTRADORA ===
    
    // Inicializar estructura de sesiones de caja
    initializeCashSessions() {
        if (!localStorage.getItem('pos_cash_sessions')) {
            localStorage.setItem('pos_cash_sessions', JSON.stringify([]));
        }
        if (!localStorage.getItem('pos_current_cash_session')) {
            localStorage.setItem('pos_current_cash_session', JSON.stringify(null));
        }
    }

    // Abrir sesión de caja
    openCashSession(userId, initialAmount = 0, notes = '', userName = null) {
        const currentSession = this.getCurrentCashSession();
        if (currentSession && currentSession.status === 'open') {
            throw new Error('Ya hay una sesión de caja abierta');
        }

        // Obtener nombre de usuario
        let userDisplayName = userName;
        if (!userDisplayName) {
            const user = this.getUserById(userId);
            userDisplayName = user?.name || 'Usuario';
        }

        const session = {
            id: Date.now(),
            userId: userId,
            userName: userDisplayName,
            openedAt: new Date().toISOString(),
            closedAt: null,
            status: 'open',
            initialAmount: initialAmount,
            finalAmount: null,
            totalSales: 0,
            totalCash: initialAmount,
            totalCard: 0,
            totalTransfers: 0,
            totalMixed: 0,
            cashFromMixed: 0,
            cardFromMixed: 0,
            difference: 0,
            notes: notes,
            transactions: [],
            movements: [{
                type: 'opening',
                amount: initialAmount,
                description: 'Apertura de caja',
                timestamp: new Date().toISOString(),
                userId: userId
            }]
        };

        // Guardar sesión
        const sessions = this.getCashSessions();
        sessions.push(session);
        localStorage.setItem('pos_cash_sessions', JSON.stringify(sessions));
        localStorage.setItem('pos_current_cash_session', JSON.stringify(session));

        return session;
    }

    // Cerrar sesión de caja
    closeCashSession(finalAmount, notes = '') {
        const currentSession = this.getCurrentCashSession();
        if (!currentSession || currentSession.status !== 'open') {
            throw new Error('No hay una sesión de caja abierta');
        }

        // Calcular totales
        const sales = this.getSales();
        const sessionSales = sales.filter(sale => 
            new Date(sale.timestamp) >= new Date(currentSession.openedAt)
        );

        const totals = sessionSales.reduce((acc, sale) => {
            acc.totalSales += sale.total;
            switch(sale.metodoPago) {
                case 'efectivo':
                    acc.totalCash += sale.total;
                    break;
                case 'tarjeta':
                    acc.totalCard += sale.total;
                    break;
                case 'transferencia':
                    acc.totalTransfers += sale.total;
                    break;
                case 'mixto':
                    acc.totalMixed += sale.total;
                    // Desglosar pagos mixtos
                    if (sale.paymentData && sale.paymentData.cashAmount) {
                        acc.cashFromMixed += sale.paymentData.cashAmount;
                        // IMPORTANTE: La parte en efectivo también se suma al total de efectivo de caja
                        acc.totalCash += sale.paymentData.cashAmount;
                    }
                    if (sale.paymentData && sale.paymentData.cardAmount) {
                        acc.cardFromMixed += sale.paymentData.cardAmount;
                        // La parte de transferencia se suma al total de transferencias
                        acc.totalTransfers += sale.paymentData.cardAmount;
                    }
                    break;
            }
            return acc;
        }, { totalSales: 0, totalCash: 0, totalCard: 0, totalTransfers: 0, totalMixed: 0, cashFromMixed: 0, cardFromMixed: 0 });

        // Calcular diferencia
        const expectedCash = currentSession.totalCash + totals.totalCash;
        const difference = finalAmount - expectedCash;

        // Actualizar sesión
        currentSession.closedAt = new Date().toISOString();
        currentSession.status = 'closed';
        currentSession.finalAmount = finalAmount;
        currentSession.totalSales = totals.totalSales;
        currentSession.totalCash = totals.totalCash;
        currentSession.totalCard = totals.totalCard;
        currentSession.totalTransfers = totals.totalTransfers;
        currentSession.totalMixed = totals.totalMixed;
        currentSession.cashFromMixed = totals.cashFromMixed;
        currentSession.cardFromMixed = totals.cardFromMixed;
        currentSession.difference = difference;
        currentSession.notes += (currentSession.notes ? '\n' : '') + notes;

        // Agregar movimiento de cierre
        currentSession.movements.push({
            type: 'closing',
            amount: finalAmount,
            description: 'Cierre de caja',
            timestamp: new Date().toISOString(),
            difference: difference
        });

        // Guardar cambios
        const sessions = this.getCashSessions();
        const index = sessions.findIndex(s => s.id === currentSession.id);
        if (index !== -1) {
            sessions[index] = currentSession;
        }
        localStorage.setItem('pos_cash_sessions', JSON.stringify(sessions));
        localStorage.setItem('pos_current_cash_session', JSON.stringify(null));

        return currentSession;
    }

    // Agregar movimiento de caja
    addCashMovement(type, amount, description, userId) {
        const currentSession = this.getCurrentCashSession();
        if (!currentSession || currentSession.status !== 'open') {
            throw new Error('No hay una sesión de caja abierta');
        }

        const movement = {
            type: type, // 'in' (entrada), 'out' (salida), 'sale' (venta)
            amount: amount,
            description: description,
            timestamp: new Date().toISOString(),
            userId: userId
        };

        currentSession.movements.push(movement);

        // Actualizar total de efectivo
        if (type === 'in') {
            currentSession.totalCash += amount;
        } else if (type === 'out') {
            currentSession.totalCash -= amount;
        }

        // Guardar cambios
        const sessions = this.getCashSessions();
        const index = sessions.findIndex(s => s.id === currentSession.id);
        if (index !== -1) {
            sessions[index] = currentSession;
        }
        localStorage.setItem('pos_cash_sessions', JSON.stringify(sessions));
        localStorage.setItem('pos_current_cash_session', JSON.stringify(currentSession));

        // Disparar evento personalizado para notificar movimiento de caja
        const cashMovementEvent = new CustomEvent('cashMovementAdded', {
            detail: { movement: movement, session: currentSession }
        });
        window.dispatchEvent(cashMovementEvent);

        return movement;
    }

    // Obtener sesión actual
    getCurrentCashSession() {
        const session = localStorage.getItem('pos_current_cash_session');
        return session ? JSON.parse(session) : null;
    }

    // Obtener todas las sesiones
    getCashSessions() {
        return JSON.parse(localStorage.getItem('pos_cash_sessions') || '[]');
    }

    // Verificar si hay sesión abierta
    hasCashSessionOpen() {
        const session = this.getCurrentCashSession();
        return session && session.status === 'open';
    }

    // Obtener resumen de caja del día
    getDailyCashSummary(date = new Date()) {
        const dateStr = date.toDateString();
        const sessions = this.getCashSessions();
        const sales = this.getSales();

        const daySessions = sessions.filter(session => 
            new Date(session.openedAt).toDateString() === dateStr
        );

        const daySales = sales.filter(sale => 
            new Date(sale.timestamp).toDateString() === dateStr
        );

        return {
            sessions: daySessions,
            totalSessions: daySessions.length,
            totalSales: daySales.reduce((sum, sale) => sum + sale.total, 0),
            totalTransactions: daySales.length,
            paymentMethods: daySales.reduce((acc, sale) => {
                acc[sale.metodoPago] = (acc[sale.metodoPago] || 0) + sale.total;
                return acc;
            }, {})
        };
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

    // === MÉTODOS DE ANALÍTICAS Y REPORTES ===
    
    // Obtener análisis de ventas por período
    getSalesAnalytics(startDate, endDate) {
        const sales = this.getSales();
        const products = this.getProducts();
        const users = this.getUsers();
        
        // Filtrar ventas por período
        const periodSales = sales.filter(sale => {
            const saleDate = new Date(sale.timestamp || sale.fecha);
            return saleDate >= startDate && saleDate <= endDate;
        });
        
        // Calcular métricas básicas
        const totalSales = periodSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalTransactions = periodSales.length;
        const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        
        // Calcular costos y ganancias
        let totalCost = 0;
        const productSalesMap = new Map();
        
        periodSales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const cost = (product.cost || 0) * item.quantity;
                    totalCost += cost;
                    
                    // Acumular ventas por producto
                    const key = item.productId;
                    if (!productSalesMap.has(key)) {
                        productSalesMap.set(key, {
                            productId: item.productId,
                            productName: item.productName,
                            quantitySold: 0,
                            revenue: 0,
                            cost: 0,
                            profit: 0
                        });
                    }
                    
                    const productSale = productSalesMap.get(key);
                    productSale.quantitySold += item.quantity;
                    productSale.revenue += item.subtotal;
                    productSale.cost += cost;
                    productSale.profit = productSale.revenue - productSale.cost;
                }
            });
        });
        
        const totalProfit = totalSales - totalCost;
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
        
        return {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            overview: {
                totalSales,
                totalCost,
                totalProfit,
                profitMargin,
                totalTransactions,
                avgTicket
            },
            productSales: Array.from(productSalesMap.values())
                .sort((a, b) => b.revenue - a.revenue)
        };
    }
    
    // Obtener productos más vendidos
    getTopSellingProducts(limit = 10, startDate = null, endDate = null) {
        const sales = this.getSales();
        const products = this.getProducts();
        
        // Filtrar por fecha si se especifica
        const filteredSales = startDate && endDate ? 
            sales.filter(sale => {
                const saleDate = new Date(sale.timestamp || sale.fecha);
                return saleDate >= startDate && saleDate <= endDate;
            }) : sales;
        
        const productStats = new Map();
        
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const key = item.productId;
                if (!productStats.has(key)) {
                    const product = products.find(p => p.id === item.productId);
                    productStats.set(key, {
                        productId: item.productId,
                        productName: item.productName,
                        category: product ? product.category : 'sin-categoria',
                        quantitySold: 0,
                        revenue: 0,
                        cost: 0,
                        profit: 0,
                        avgPrice: product ? (product.price || product.precio) : 0,
                        costPerUnit: product ? (product.cost || 0) : 0
                    });
                }
                
                const stats = productStats.get(key);
                stats.quantitySold += item.quantity;
                stats.revenue += item.subtotal;
                stats.cost += (stats.costPerUnit * item.quantity);
                stats.profit = stats.revenue - stats.cost;
            });
        });
        
        return Array.from(productStats.values())
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, limit);
    }
    
    // Obtener análisis por categorías
    getCategoryAnalytics(startDate = null, endDate = null) {
        const sales = this.getSales();
        const products = this.getProducts();
        
        const filteredSales = startDate && endDate ? 
            sales.filter(sale => {
                const saleDate = new Date(sale.timestamp || sale.fecha);
                return saleDate >= startDate && saleDate <= endDate;
            }) : sales;
        
        const categoryStats = new Map();
        
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const category = product ? product.category : 'sin-categoria';
                
                if (!categoryStats.has(category)) {
                    categoryStats.set(category, {
                        category,
                        quantitySold: 0,
                        revenue: 0,
                        cost: 0,
                        profit: 0,
                        itemCount: 0
                    });
                }
                
                const stats = categoryStats.get(category);
                stats.quantitySold += item.quantity;
                stats.revenue += item.subtotal;
                stats.cost += (product ? (product.cost || 0) : 0) * item.quantity;
                stats.profit = stats.revenue - stats.cost;
                stats.itemCount++;
            });
        });
        
        return Array.from(categoryStats.values())
            .sort((a, b) => b.revenue - a.revenue);
    }
    
    // Obtener tendencias diarias
    getDailySalesTrends(days = 30) {
        const sales = this.getSales();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        const dailyStats = new Map();
        
        // Inicializar todos los días con ceros
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            dailyStats.set(dateKey, {
                date: dateKey,
                sales: 0,
                cost: 0,
                profit: 0,
                transactions: 0,
                avgTicket: 0
            });
        }
        
        // Procesar ventas
        const products = this.getProducts();
        sales.forEach(sale => {
            const saleDate = new Date(sale.timestamp || sale.fecha);
            if (saleDate >= startDate && saleDate <= endDate) {
                const dateKey = saleDate.toISOString().split('T')[0];
                const dayStats = dailyStats.get(dateKey);
                
                if (dayStats) {
                    dayStats.sales += sale.total;
                    dayStats.transactions++;
                    
                    // Calcular costos
                    let saleCost = 0;
                    sale.items.forEach(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (product) {
                            saleCost += (product.cost || 0) * item.quantity;
                        }
                    });
                    
                    dayStats.cost += saleCost;
                    dayStats.profit = dayStats.sales - dayStats.cost;
                    dayStats.avgTicket = dayStats.transactions > 0 ? dayStats.sales / dayStats.transactions : 0;
                }
            }
        });
        
        return Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    
    // Obtener métricas de rendimiento por cajero
    getCashierPerformance(startDate = null, endDate = null) {
        const sales = this.getSales();
        const cashSessions = this.getCashSessions();
        const users = this.getUsers();
        
        const filteredSales = startDate && endDate ? 
            sales.filter(sale => {
                const saleDate = new Date(sale.timestamp || sale.fecha);
                return saleDate >= startDate && saleDate <= endDate;
            }) : sales;
        
        const cashierStats = new Map();
        
        // Analizar sesiones de caja
        cashSessions.forEach(session => {
            if (startDate && endDate) {
                const sessionDate = new Date(session.openedAt);
                if (sessionDate < startDate || sessionDate > endDate) return;
            }
            
            const userId = session.userId;
            if (!cashierStats.has(userId)) {
                const user = users.find(u => u.id === userId);
                cashierStats.set(userId, {
                    userId,
                    userName: session.userName || (user ? user.name : 'Usuario desconocido'),
                    sessionsCount: 0,
                    totalSessionTime: 0,
                    totalSales: 0,
                    totalTransactions: 0,
                    avgSessionSales: 0,
                    avgTransactionValue: 0,
                    cashDifferences: 0
                });
            }
            
            const stats = cashierStats.get(userId);
            stats.sessionsCount++;
            stats.totalSales += session.totalSales || 0;
            stats.cashDifferences += Math.abs(session.difference || 0);
            
            if (session.closedAt) {
                const sessionDuration = new Date(session.closedAt) - new Date(session.openedAt);
                stats.totalSessionTime += sessionDuration;
            }
        });
        
        // Calcular promedios
        cashierStats.forEach(stats => {
            stats.avgSessionSales = stats.sessionsCount > 0 ? stats.totalSales / stats.sessionsCount : 0;
            stats.avgTransactionValue = stats.totalTransactions > 0 ? stats.totalSales / stats.totalTransactions : 0;
            stats.avgSessionTimeHours = stats.totalSessionTime / (1000 * 60 * 60); // en horas
        });
        
        return Array.from(cashierStats.values())
            .sort((a, b) => b.totalSales - a.totalSales);
    }
    
    // Obtener análisis de métodos de pago
    getPaymentMethodAnalytics(startDate = null, endDate = null) {
        const sales = this.getSales();
        
        const filteredSales = startDate && endDate ? 
            sales.filter(sale => {
                const saleDate = new Date(sale.timestamp || sale.fecha);
                return saleDate >= startDate && saleDate <= endDate;
            }) : sales;
        
        const paymentStats = {
            efectivo: { count: 0, total: 0 },
            tarjeta: { count: 0, total: 0 },
            transferencia: { count: 0, total: 0 },
            mixto: { count: 0, total: 0, cashPart: 0, cardPart: 0 }
        };
        
        filteredSales.forEach(sale => {
            const method = sale.metodoPago || 'efectivo';
            if (paymentStats[method]) {
                paymentStats[method].count++;
                paymentStats[method].total += sale.total;
                
                if (method === 'mixto' && sale.paymentData) {
                    paymentStats[method].cashPart += sale.paymentData.cashAmount || 0;
                    paymentStats[method].cardPart += sale.paymentData.cardAmount || 0;
                    
                    // Sumar la parte en efectivo de pagos mixtos al total de efectivo
                    if (sale.paymentData.cashAmount) {
                        paymentStats.efectivo.total += sale.paymentData.cashAmount;
                    }
                    // Sumar la parte de transferencia de pagos mixtos al total de transferencias
                    if (sale.paymentData.cardAmount) {
                        paymentStats.transferencia.total += sale.paymentData.cardAmount;
                    }
                }
            }
        });
        
        // Calcular porcentajes
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalTransactions = filteredSales.length;
        
        Object.keys(paymentStats).forEach(method => {
            const stats = paymentStats[method];
            stats.percentage = totalSales > 0 ? (stats.total / totalSales) * 100 : 0;
            stats.avgTicket = stats.count > 0 ? stats.total / stats.count : 0;
            stats.transactionPercentage = totalTransactions > 0 ? (stats.count / totalTransactions) * 100 : 0;
        });
        
        return paymentStats;
    }
    
    // Obtener resumen ejecutivo
    getExecutiveSummary(period = 'month') {
        const today = new Date();
        let startDate, endDate = new Date(today);
        
        switch (period) {
            case 'today':
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);
        }
        
        const analytics = this.getSalesAnalytics(startDate, endDate);
        const topProducts = this.getTopSellingProducts(5, startDate, endDate);
        const categoryAnalytics = this.getCategoryAnalytics(startDate, endDate);
        const paymentAnalytics = this.getPaymentMethodAnalytics(startDate, endDate);
        const cashierPerformance = this.getCashierPerformance(startDate, endDate);
        
        return {
            period: {
                type: period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                label: this.getPeriodLabel(period)
            },
            overview: analytics.overview,
            topProducts,
            categoryAnalytics,
            paymentAnalytics,
            cashierPerformance,
            trends: this.getDailySalesTrends(30)
        };
    }
    
    // ===== SISTEMA DE LOGS DE CAMBIOS =====
    
    initializeOrderLogs() {
        if (!localStorage.getItem('pos_order_logs')) {
            localStorage.setItem('pos_order_logs', JSON.stringify([]));
        }
    }
    
    getOrderLogs() {
        this.initializeOrderLogs();
        return JSON.parse(localStorage.getItem('pos_order_logs')) || [];
    }
    
    addOrderLog(orderId, action, details, userId = null) {
        try {
            const logs = this.getOrderLogs();
            const currentUser = this.getCurrentUser();
            
            const logEntry = {
                id: Date.now(),
                orderId: orderId,
                action: action, // 'created', 'updated', 'cancelled', 'status_changed', 'item_added', 'item_removed'
                details: details,
                timestamp: new Date().toISOString(),
                userId: userId || (currentUser ? currentUser.id : null),
                userName: userId ? this.getUserById(userId)?.name : (currentUser ? currentUser.name : 'Sistema'),
                date: new Date().toLocaleDateString('es-ES'),
                time: new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})
            };
            
            logs.push(logEntry);
            
            // Mantener solo los últimos 1000 logs para evitar usar demasiado espacio
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('pos_order_logs', JSON.stringify(logs));
            console.log('Log agregado:', logEntry);
            
        } catch (error) {
            console.error('Error al agregar log:', error);
        }
    }
    
    getOrderLogsById(orderId) {
        const logs = this.getOrderLogs();
        return logs.filter(log => log.orderId == orderId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    clearOldLogs(daysToKeep = 30) {
        try {
            const logs = this.getOrderLogs();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const filteredLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
            localStorage.setItem('pos_order_logs', JSON.stringify(filteredLogs));
            
            console.log(`Logs limpiados. Eliminados: ${logs.length - filteredLogs.length}, Mantenidos: ${filteredLogs.length}`);
        } catch (error) {
            console.error('Error al limpiar logs:', error);
        }
    }
    
    getCurrentUser() {
        const currentSession = localStorage.getItem('pos_current_user');
        if (currentSession) {
            try {
                return JSON.parse(currentSession);
            } catch (error) {
                console.error('Error al obtener usuario actual:', error);
                return null;
            }
        }
        return null;
    }
    
    getPeriodLabel(period) {
        const today = new Date();
        switch (period) {
            case 'today': return 'Hoy';
            case 'week': return 'Últimos 7 días';
            case 'month': return 'Último mes';
            case 'year': return 'Último año';
            default: return 'Período personalizado';
        }
    }
}

// Instancia global de la base de datos
window.db = new Database();
