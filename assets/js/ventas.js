class SalesManager {
    constructor() {
        // Validar dependencias
        if (typeof Database === 'undefined') {
            throw new Error('Database class is required but not found');
        }
        
        this.cart = [];
        this.currentOrder = {
            items: [],
            total: 0,
            customer: null,
            table: null,
            type: 'dine-in'
        };
        this.db = new Database();
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.setupNotifications();
        this.updateCartDisplay();
        this.loadTables();
        this.initializeOrderType();
        this.checkUrlParams();
        
        window.addEventListener('focus', () => {
            this.loadTables();
        });
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const mesa = urlParams.get('mesa');
        const editOrderId = urlParams.get('editOrder');
        
        if (mesa) {
            this.currentOrder.type = 'dine-in';
            this.currentOrder.table = mesa;
            this.updateOrderTypeSelection();
            this.selectTable(mesa);
            this.showNotification(`Mesa ${mesa} seleccionada`, 'info');
        }

        if (editOrderId) {
            this.loadOrderForEditing(editOrderId);
        }
    }

    updateOrderTypeSelection() {
        const typeButtons = document.querySelectorAll('.order-type-btn');
        typeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === this.currentOrder.type) {
                btn.classList.add('active');
            }
        });
        this.updateTableSelection();
    }

    selectTable(tableNumber) {
        const tableButtons = document.querySelectorAll('.table-btn');
        tableButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.table == tableNumber) {
                btn.classList.add('selected');
            }
        });
    }

    setupNotifications() {
        if (!document.querySelector('.notifications-container')) {
            const container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'success') {
        const container = document.querySelector('.notifications-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }

    loadProducts() {
        const products = this.db.getProducts().filter(p => p.active !== false);
        const categories = this.db.getCategories();
        
        // Comentado para producción
        // console.log('Productos cargados:', products);
        // console.log('Categorías encontradas:', categories);
        
        this.renderCategories(categories);
        this.renderProducts(products);
    }

    renderCategories(categories) {
        const categoriesContainer = document.getElementById('categories');
        if (!categoriesContainer) return;
        
        const categoryLabels = {
            'bebidas-calientes': 'Bebidas Calientes',
            'bebidas-frias': 'Bebidas Frías',
            'crepes-dulces': 'Crêpes Dulces',
            'crepes-salados': 'Crêpes Salados',
            'postres': 'Postres',
            'extras': 'Extras'
        };
        
        categoriesContainer.innerHTML = `
            <button class="category-btn active" data-category="all">Todos</button>
            ${categories.map(category => 
                `<button class="category-btn" data-category="${category}">
                    ${categoryLabels[category] || category}
                </button>`
            ).join('')}
        `;
    }

    renderProducts(products) {
        const productsContainer = document.getElementById('productsList');
        if (!productsContainer) {
            console.error('Contenedor de productos no encontrado. ID esperado: productsList');
            return;
        }

        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products">
                    <p>No hay productos disponibles</p>
                </div>
            `;
            return;
        }

        productsContainer.innerHTML = products.map(product => 
            this.createProductCard(product)
        ).join('');
    }

    createProductCard(product) {
        const price = product.precio || product.price || 0;
        const name = product.nombre || product.name || 'Sin nombre';
        const category = product.categoria || product.category || '';
        
        return `
            <div class="product-card clickable" data-category="${category}" data-product-id="${product.id}" onclick="salesManager.addToCart(${product.id})">
                <div class="product-info">
                    <h4 class="product-name">${name}</h4>
                    <div class="product-price">$${price.toLocaleString()}</div>
                </div>
                <div class="product-add-indicator">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                document.querySelectorAll('.category-btn').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
                
                const category = e.target.dataset.category;
                this.filterByCategory(category);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('order-type-btn')) {
                document.querySelectorAll('.order-type-btn').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
                
                this.currentOrder.type = e.target.dataset.type;
                this.updateTableSelection();
                this.updateCartDisplay();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('table-btn')) {
                document.querySelectorAll('.table-btn').forEach(btn => 
                    btn.classList.remove('selected'));
                e.target.classList.add('selected');
                
                this.currentOrder.table = e.target.dataset.table;
                this.updateCartDisplay();
            }
        });

        const sendOrderBtn = document.getElementById('confirmOrderBtn');
        if (sendOrderBtn) {
            sendOrderBtn.addEventListener('click', () => this.sendOrder());
        }

        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }
    }

    filterByCategory(category) {
        const products = document.querySelectorAll('.product-card');
        products.forEach(product => {
            if (category === 'all' || product.dataset.category === category) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }

    searchProducts(searchTerm) {
        const products = document.querySelectorAll('.product-card');
        const term = searchTerm.toLowerCase();
        
        products.forEach(product => {
            const name = product.querySelector('.product-name').textContent.toLowerCase();
            
            if (name.includes(term)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }

    addToCart(productId) {
        const products = this.db.getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            this.showNotification('Producto no encontrado', 'error');
            return;
        }

        // Efecto visual en la tarjeta del producto
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (productCard) {
            const indicator = productCard.querySelector('.product-add-indicator i');
            
            // Cambiar icono a checkmark temporalmente
            if (indicator) {
                const originalIcon = indicator.className;
                indicator.className = 'fas fa-check';
            }
            
            productCard.classList.add('adding-to-cart');
            
            setTimeout(() => {
                productCard.classList.remove('adding-to-cart');
                // Restaurar icono original
                if (indicator) {
                    indicator.className = 'fas fa-plus';
                }
            }, 600);
        }

        const existingItem = this.cart.find(item => item.product.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.subtotal = existingItem.quantity * (product.precio || product.price);
        } else {
            this.cart.push({
                product: product,
                quantity: 1,
                subtotal: product.precio || product.price
            });
        }

        this.updateCartDisplay();
        this.showNotification(`${product.nombre || product.name} agregado al carrito`, 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.product.id !== productId);
        this.updateCartDisplay();
        this.showNotification('Producto eliminado del carrito', 'info');
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.product.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                item.subtotal = item.quantity * (item.product.precio || item.product.price);
                this.updateCartDisplay();
            }
        }
    }

    updateCartDisplay() {
        const cartContainer = document.getElementById('cartItems');
        const cartTotal = document.getElementById('totalAmount');
        const cartCount = document.getElementById('cartCount');
        const sendOrderBtn = document.getElementById('confirmOrderBtn');

        if (!cartContainer) return;

        this.currentOrder.total = this.cart.reduce((total, item) => total + item.subtotal, 0);

        if (cartCount) {
            cartCount.textContent = this.cart.reduce((count, item) => count + item.quantity, 0);
        }

        if (cartTotal) {
            cartTotal.textContent = `$${this.currentOrder.total.toLocaleString()}`;
        }

        if (this.cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>El carrito está vacío</p>
                </div>
            `;
        } else {
            cartContainer.innerHTML = this.cart.map(item => `
                <div class="cart-item" data-product-id="${item.product.id}">
                    <div class="item-info">
                        <h5>${item.product.nombre || item.product.name}</h5>
                        <p class="item-price">$${(item.product.precio || item.product.price).toLocaleString()}</p>
                    </div>
                    <div class="item-controls">
                        <button class="quantity-btn minus" onclick="salesManager.updateQuantity(${item.product.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" onclick="salesManager.updateQuantity(${item.product.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-subtotal">$${item.subtotal.toLocaleString()}</div>
                    <button class="remove-item" onclick="salesManager.removeFromCart(${item.product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        if (sendOrderBtn) {
            sendOrderBtn.disabled = this.cart.length === 0;
        }
    }

    initializeOrderType() {
        const defaultTypeBtn = document.querySelector('.order-type-btn[data-type="dine-in"]');
        if (defaultTypeBtn) {
            defaultTypeBtn.classList.add('active');
        }
        this.updateTableSelection();
    }

    updateTableSelection() {
        const tablesContainer = document.getElementById('tableSelection');
        if (!tablesContainer) return;

        if (this.currentOrder.type === 'dine-in') {
            tablesContainer.style.display = 'block';
            this.loadTables();
        } else {
            tablesContainer.style.display = 'none';
            this.currentOrder.table = null;
        }
    }

    loadTables() {
        const tablesContainer = document.getElementById('tablesGrid');
        if (!tablesContainer) return;

        const tables = this.db.getTables();
        const availableTables = tables.filter(table => table.estado === 'libre');

        if (availableTables.length === 0) {
            tablesContainer.innerHTML = `
                <div class="no-tables">
                    <p>No hay mesas disponibles</p>
                    <button class="btn btn-secondary" onclick="window.location.href='mesas.html'">
                        <i class="fas fa-plus"></i>
                        Ir a Mesas
                    </button>
                </div>
            `;
            return;
        }

        tablesContainer.innerHTML = availableTables.map(table => `
            <button class="table-btn ${this.currentOrder.table == table.numero ? 'selected' : ''}" 
                    data-table="${table.numero}">
                <i class="fas fa-chair"></i>
                <span class="table-number">Mesa ${table.numero}</span>
                ${table.capacidad ? `<small class="table-capacity">${table.capacidad} personas</small>` : ''}
            </button>
        `).join('');
    }

    clearCart() {
        if (this.cart.length === 0) {
            this.showNotification('El carrito ya está vacío', 'info');
            return;
        }
        
        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            this.cart = [];
            this.updateCartDisplay();
            this.showNotification('Carrito vaciado', 'info');
        }
    }

    sendOrder() {
        if (!this.validateOrderForSending()) {
            return;
        }

        try {
            const order = {
                id: Date.now(),
                items: this.cart.map(item => ({
                    productId: item.product.id,
                    productName: item.product.nombre || item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.product.precio || item.product.price,
                    subtotal: item.subtotal,
                    estado: 'pendiente'
                })),
                total: this.currentOrder.total,
                mesa: this.currentOrder.table,
                tipo: this.getOrderTypeSpanish(this.currentOrder.type),
                estado: 'pendiente',
                timestamp: new Date().toISOString(),
                fecha: new Date().toLocaleDateString('es-ES'),
                hora: new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})
            };

            // Guardar el pedido
            this.db.saveOrder(order);

            // Actualizar mesa si es dine-in
            if (order.mesa && this.currentOrder.type === 'dine-in') {
                const tables = this.db.getTables();
                const table = tables.find(t => t.numero == order.mesa);
                if (table) {
                    table.estado = 'ocupada';
                    table.pedidoId = order.id;
                    table.ultimaActividad = new Date().toISOString();
                    this.db.updateTable(table.id, table);
                    this.loadTables(); // Recargar mesas disponibles
                }
            }

            this.clearOrderForm();
            this.showNotification(`Pedido #${order.id} enviado exitosamente`, 'success');
            this.showOrderDetailsModal(order);

        } catch (error) {
            console.error('Error al enviar el pedido:', error);
            this.showNotification('Error al enviar el pedido. Intenta nuevamente.', 'error');
        }
    }

    getOrderTypeSpanish(type) {
        const types = {
            'dine-in': 'mesa',
            'takeout': 'llevar',
            'delivery': 'domicilio'
        };
        return types[type] || type;
    }

    validateOrderForSending() {
        if (this.cart.length === 0) {
            this.showNotification('El carrito está vacío', 'error');
            return false;
        }

        if (this.currentOrder.type === 'dine-in' && !this.currentOrder.table) {
            this.showNotification('Selecciona una mesa para pedidos en local', 'error');
            return false;
        }

        return true;
    }

    clearOrderForm() {
        this.cart = [];
        this.currentOrder.table = null;
        
        document.querySelectorAll('.table-btn').forEach(btn => 
            btn.classList.remove('selected'));
        
        document.querySelectorAll('.order-type-btn').forEach(btn => 
            btn.classList.remove('active'));
        const defaultTypeBtn = document.querySelector('.order-type-btn[data-type="dine-in"]');
        if (defaultTypeBtn) {
            defaultTypeBtn.classList.add('active');
        }
        
        this.currentOrder.type = 'dine-in';
        this.updateCartDisplay();
        this.updateTableSelection();
        
        // Limpiar modo de edición
        this.removeEditingMode();
    }

    loadOrderForEditing(orderId) {
        try {
            // Convertir orderId a número para comparación consistente
            const orderIdToLoad = parseInt(orderId);
            
            console.log('loadOrderForEditing - ID a cargar:', orderIdToLoad);
            
            const orders = this.db.getOrders();
            console.log('loadOrderForEditing - Total pedidos en DB:', orders.length);
            console.log('loadOrderForEditing - IDs disponibles:', orders.map(o => ({id: o.id, tipo: typeof o.id})));
            
            const order = orders.find(o => parseInt(o.id) === orderIdToLoad);
            
            if (!order) {
                this.showNotification('Pedido no encontrado para editar', 'error');
                console.error('loadOrderForEditing - Pedido no encontrado con ID:', orderIdToLoad);
                return;
            }

            console.log('loadOrderForEditing - Pedido encontrado:', order);

            // Verificar si el pedido se puede editar
            if (['pagado', 'cancelado'].includes(order.estado)) {
                this.showNotification('No se puede editar un pedido pagado o cancelado', 'error');
                return;
            }

            // Limpiar carrito actual
            this.cart = [];
            
            // Cargar items del pedido al carrito
            order.items.forEach(item => {
                const products = this.db.getProducts();
                // Buscar producto por ID o por nombre si no se encuentra por ID
                let product = products.find(p => p.id === item.productId);
                
                if (!product) {
                    // Intentar buscar por nombre como fallback
                    product = products.find(p => 
                        (p.nombre || p.name) === (item.productName || item.nombre)
                    );
                }
                
                if (product) {
                    // Agregar al carrito con la cantidad correcta
                    const quantity = item.quantity || item.cantidad || 1;
                    const price = product.precio || product.price || 0;
                    
                    this.cart.push({
                        product: product,
                        quantity: quantity,
                        subtotal: quantity * price
                    });
                } else {
                    console.warn('Producto no encontrado:', {
                        productId: item.productId, 
                        productName: item.productName || item.nombre
                    });
                    // Crear producto temporal para mantener el item
                    const tempProduct = {
                        id: item.productId,
                        nombre: item.productName || item.nombre || 'Producto no encontrado',
                        precio: item.unitPrice || item.precio || 0,
                        categoria: 'Sin categoría'
                    };
                    
                    this.cart.push({
                        product: tempProduct,
                        quantity: item.quantity || item.cantidad || 1,
                        subtotal: item.subtotal || 0
                    });
                }
            });

            // Consolidar items duplicados en el carrito
            this.consolidateCart();

            // Configurar mesa y tipo de pedido
            this.currentOrder.table = order.mesa;
            this.currentOrder.type = 'dine-in';
            this.currentOrder.total = order.total || this.cart.reduce((sum, item) => sum + item.subtotal, 0);
            
            // Actualizar interfaz
            this.updateOrderTypeSelection();
            this.selectTable(order.mesa);
            this.updateCartDisplay();
            
            // Cambiar el texto del botón para indicar que es una edición
            const confirmBtn = document.getElementById('confirmOrderBtn');
            if (confirmBtn) {
                confirmBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Pedido';
                confirmBtn.onclick = () => this.updateOrder(orderIdToLoad);
            }
            
            // Mostrar información de que se está editando
            this.showNotification(`Editando pedido #${orderIdToLoad} - Mesa ${order.mesa}`, 'info');

        } catch (error) {
            console.error('Error al cargar pedido para edición:', error);
            this.showNotification(`Error al cargar pedido: ${error.message}`, 'error');
        }
    }

    consolidateCart() {
        const consolidated = [];
        
        this.cart.forEach(item => {
            const existing = consolidated.find(ci => ci.product.id === item.product.id);
            if (existing) {
                existing.quantity += item.quantity;
                existing.subtotal = existing.quantity * (existing.product.precio || existing.product.price);
            } else {
                consolidated.push({ ...item });
            }
        });
        
        this.cart = consolidated;
    }

    updateOrder(originalOrderId) {
        // Función de debug temporal
        console.log('=== DEBUG: Estado completo antes de actualizar ===');
        console.log('localStorage pos_orders:', localStorage.getItem('pos_orders'));
        const allOrders = this.db.getOrders();
        console.log('Todos los pedidos:', allOrders);
        console.log('Pedido a actualizar ID:', originalOrderId, 'tipo:', typeof originalOrderId);
        console.log('Cart actual:', this.cart);
        console.log('Current order:', this.currentOrder);
        
        if (!this.validateOrderForSending()) {
            return;
        }

        try {
            // Convertir originalOrderId a número para comparación consistente
            const orderIdToUpdate = parseInt(originalOrderId);
            
            console.log('updateOrder - ID a actualizar:', orderIdToUpdate);
            
            // Obtener la orden original para mantener datos importantes
            const orders = this.db.getOrders();
            console.log('updateOrder - Total pedidos en DB:', orders.length);
            console.log('updateOrder - IDs de pedidos:', orders.map(o => o.id));
            
            const originalOrder = orders.find(o => parseInt(o.id) === orderIdToUpdate);
            
            if (!originalOrder) {
                console.error('updateOrder - Pedido no encontrado con ID:', orderIdToUpdate);
                this.showNotification('Pedido no encontrado para actualizar', 'error');
                return;
            }

            console.log('updateOrder - Pedido original encontrado:', originalOrder);

            // Verificar si el pedido se puede editar
            if (['pagado', 'cancelado'].includes(originalOrder.estado)) {
                this.showNotification('No se puede editar un pedido pagado o cancelado', 'error');
                return;
            }

            // Determinar el estado apropiado (mantener estado actual si está en proceso)
            let nuevoEstado = originalOrder.estado;

            // Crear orden actualizada manteniendo datos importantes del original
            const updatedOrder = {
                ...originalOrder, // Mantener todos los datos originales
                id: orderIdToUpdate, // Asegurar ID como número
                items: this.cart.map(item => ({
                    productId: item.product.id,
                    productName: item.product.nombre || item.product.name,
                    nombre: item.product.nombre || item.product.name, // Compatibilidad
                    quantity: item.quantity,
                    cantidad: item.quantity, // Compatibilidad
                    unitPrice: item.product.precio || item.product.price,
                    precio: item.product.precio || item.product.price, // Compatibilidad
                    subtotal: item.subtotal,
                    estado: 'pendiente' // Solo los nuevos items empiezan pendientes
                })),
                total: this.currentOrder.total,
                mesa: this.currentOrder.table,
                tipo: this.getOrderTypeSpanish(this.currentOrder.type),
                estado: nuevoEstado, // Mantener estado actual si no está terminado
                fechaActualizacion: new Date().toISOString(),
                horaActualizacion: new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})
            };

            console.log('updateOrder - Pedido actualizado a guardar:', updatedOrder);

            // Usar el método saveOrder que ya existe y funciona correctamente
            const savedOrder = this.db.saveOrder(updatedOrder);
            console.log('updateOrder - Resultado de saveOrder:', savedOrder);
            
            // Verificar que se guardó correctamente
            const verifyOrders = this.db.getOrders();
            const verifyOrder = verifyOrders.find(o => parseInt(o.id) === orderIdToUpdate);
            console.log('updateOrder - Verificación - Pedido después de guardar:', verifyOrder);
            console.log('=== DEBUG: Estado completo después de actualizar ===');
            console.log('localStorage pos_orders después:', localStorage.getItem('pos_orders'));
            console.log('Todos los pedidos después:', verifyOrders);
            
            // Actualizar la mesa si cambió
            if (originalOrder.mesa !== updatedOrder.mesa) {
                this.updateTableAssignment(originalOrder.mesa, updatedOrder.mesa, orderIdToUpdate);
            }
            
            this.clearOrderForm();
            
            // Restaurar botón original
            const confirmBtn = document.getElementById('confirmOrderBtn');
            if (confirmBtn) {
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Orden';
                confirmBtn.onclick = () => this.sendOrder();
            }
            
            this.showNotification(`Pedido #${orderIdToUpdate} actualizado exitosamente`, 'success');
            
            // Redirigir de vuelta a mesas después de un momento con parámetro de actualización
            setTimeout(() => {
                window.location.href = 'mesas.html?updated=true';
            }, 2000);

        } catch (error) {
            console.error('updateOrder - Error:', error);
            this.showNotification(`Error al actualizar el pedido: ${error.message}`, 'error');
        }
    }

    updateTableAssignment(oldTableNumber, newTableNumber, orderId) {
        try {
            // Liberar mesa anterior si cambió
            if (oldTableNumber && oldTableNumber !== newTableNumber) {
                const tables = this.db.getTables();
                const oldTable = tables.find(t => t.numero == oldTableNumber);
                if (oldTable && oldTable.pedidoId == orderId) {
                    oldTable.estado = 'libre';
                    oldTable.pedidoId = null;
                    oldTable.ultimaActividad = new Date().toISOString();
                    this.db.updateTable(oldTable.id, oldTable);
                }
            }

            // Asignar nueva mesa
            if (newTableNumber) {
                const tables = this.db.getTables();
                const newTable = tables.find(t => t.numero == newTableNumber);
                if (newTable) {
                    newTable.estado = 'ocupada';
                    newTable.pedidoId = orderId;
                    newTable.ultimaActividad = new Date().toISOString();
                    this.db.updateTable(newTable.id, newTable);
                }
            }
        } catch (error) {
            console.error('Error al actualizar asignación de mesa:', error);
        }
    }

    showEditingMode(order) {
        // Crear o actualizar banner de edición
        let editBanner = document.getElementById('edit-mode-banner');
        if (!editBanner) {
            editBanner = document.createElement('div');
            editBanner.id = 'edit-mode-banner';
            editBanner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff9800;
                color: white;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                z-index: 1001;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(editBanner);
            
            // Ajustar el padding del body para el banner
            document.body.style.paddingTop = '50px';
        }
        
        editBanner.innerHTML = `
            <i class="fas fa-edit"></i>
            EDITANDO PEDIDO #${order.id} - Mesa ${order.mesa} 
            <small style="margin-left: 20px;">
                Original: ${order.hora} | Total anterior: $${order.total.toLocaleString()}
            </small>
        `;
    }

    removeEditingMode() {
        const editBanner = document.getElementById('edit-mode-banner');
        if (editBanner) {
            editBanner.remove();
            document.body.style.paddingTop = '0';
        }
    }

    showOrderDetailsModal(order) {
        const modal = document.createElement('div');
        modal.className = 'order-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 16px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e2e8f0;
                ">
                    <h2 style="margin: 0; color: #2d3748;">Pedido Enviado</h2>
                    <button class="close-modal" style="
                        background: #f3f4f6;
                        border: none;
                        border-radius: 50%;
                        width: 32px;
                        height: 32px;
                        font-size: 18px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-summary" style="color: #2d3748;">
                        <div style="
                            background: #f0fdf4;
                            border: 1px solid #d1fae5;
                            border-radius: 8px;
                            padding: 16px;
                            margin-bottom: 20px;
                            text-align: center;
                        ">
                            <h3 style="margin: 0 0 8px 0; color: #10b981;">Pedido #${order.id}</h3>
                            <p style="margin: 0; color: #059669;">Estado: Pendiente</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <p style="margin: 8px 0;"><strong>Fecha:</strong> ${order.fecha}</p>
                            <p style="margin: 8px 0;"><strong>Hora:</strong> ${order.hora}</p>
                            <p style="margin: 8px 0;"><strong>Tipo:</strong> ${this.getOrderTypeLabel(order.tipo)}</p>
                            ${order.mesa ? `<p style="margin: 8px 0;"><strong>Mesa:</strong> ${order.mesa}</p>` : ''}
                            <p style="margin: 8px 0;"><strong>Total:</strong> $${order.total.toLocaleString()}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 12px 0;">Productos:</h4>
                            <div style="
                                background: #f8f9fa;
                                border-radius: 8px;
                                padding: 16px;
                            ">
                                ${order.items.map(item => `
                                    <div style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        padding: 8px 0;
                                        border-bottom: 1px solid #e2e8f0;
                                    ">
                                        <div>
                                            <span style="font-weight: 500;">${item.productName}</span>
                                            <span style="color: #666; margin-left: 8px;">x${item.quantity}</span>
                                        </div>
                                        <span style="font-weight: bold;">$${item.subtotal.toLocaleString()}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions" style="
                    display: flex;
                    gap: 10px;
                    justify-content: space-between;
                    margin-top: 20px;
                ">
                    <div style="display: flex; gap: 10px;">
                        <button class="goto-pedidos" style="
                            padding: 10px 20px;
                            border: 1px solid #2196f3;
                            background: #2196f3;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">
                            <i class="fas fa-clipboard-list"></i> Ver en Pedidos
                        </button>
                        ${order.mesa ? `
                            <button class="goto-mesas" style="
                                padding: 10px 20px;
                                border: 1px solid #4caf50;
                                background: #4caf50;
                                color: white;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 500;
                            ">
                                <i class="fas fa-chair"></i> Ver Mesa
                            </button>
                        ` : ''}
                    </div>
                    <button class="close-action" style="
                        padding: 10px 20px;
                        border: 1px solid #e2e8f0;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.close-action').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.goto-pedidos').addEventListener('click', () => {
            modal.remove();
            window.location.href = 'pedidos.html';
        });

        const gotoMesasBtn = modal.querySelector('.goto-mesas');
        if (gotoMesasBtn) {
            gotoMesasBtn.addEventListener('click', () => {
                modal.remove();
                window.location.href = 'mesas.html';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getOrderTypeLabel(tipo) {
        const labels = {
            'mesa': 'Para comer aquí',
            'llevar': 'Para llevar',
            'domicilio': 'Domicilio',
            'dine-in': 'Para comer aquí',
            'takeout': 'Para llevar',
            'delivery': 'Domicilio'
        };
        return labels[tipo] || tipo;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.salesManager = new SalesManager();
});

function refreshData() {
    if (window.salesManager) {
        window.salesManager.loadProducts();
        window.salesManager.loadTables();
    }
}

const style = document.createElement('style');
style.textContent = `
    .notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 3000;
    }

    .notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        min-width: 250px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .notification.success { background-color: #4caf50; }
    .notification.error { background-color: #f44336; }
    .notification.warning { background-color: #ff9800; }
    .notification.info { background-color: #2196f3; }

    .close-notification {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        margin-left: 10px;
    }

    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    .product-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
    .add-to-cart-btn { transition: background-color 0.2s ease; }
    .add-to-cart-btn:hover { background-color: #1976d2; }
    .category-btn { transition: all 0.2s ease; }
    .category-btn:hover { background-color: #e3f2fd; }
    .category-btn.active { background-color: #2196f3; color: white; }
    .order-type-btn { transition: all 0.2s ease; }
    .order-type-btn:hover { background-color: #e8f5e8; }
    .order-type-btn.active { background-color: #4caf50; color: white; }
    .table-btn { transition: all 0.2s ease; }
    .table-btn:hover { background-color: #fff3e0; }
    .table-btn.selected { background-color: #ff9800; color: white; }
    .cart-item { transition: background-color 0.2s ease; }
    .cart-item:hover { background-color: #f8f9fa; }
    .quantity-btn { transition: background-color 0.2s ease; }
    .quantity-btn:hover { background-color: #e0e0e0; }
    .remove-item { transition: color 0.2s ease; }
    .remove-item:hover { color: #f44336; }

    .empty-cart {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }

    .empty-cart i {
        font-size: 48px;
        margin-bottom: 16px;
        color: #ddd;
    }

    .no-products, .no-tables {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }

    .placeholder-image {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 150px;
        background-color: #f5f5f5;
        color: #999;
        font-size: 32px;
    }
`;

document.head.appendChild(style);

// Inicializar el gestor cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.salesManager = new SalesManager();
    } catch (error) {
        console.error('Error al inicializar SalesManager:', error);
        alert('Error al cargar el sistema de ventas. Verifique que todos los archivos estén cargados correctamente.');
    }
});

// Función auxiliar para refrescar datos
function refreshData() {
    if (window.salesManager) {
        window.salesManager.loadProducts();
        window.salesManager.loadTables();
    }
}
