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
        
        // Propiedades para edición restringida
        this.editingRestrictedOrder = false;
        this.originalOrderState = null;
        this.currentEditingOrderId = null;
        
        this.init();
    }

    init() {
        try {
            // Verificar que tenemos acceso a auth para validación de caja
            if (window.auth) {
                console.log('[SalesManager] Auth available, cash session active:', window.auth.isCashSessionActive());
            }

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
            
            console.log('[SalesManager] Initialization completed successfully');
        } catch (error) {
            console.error('[SalesManager] Error during initialization:', error);
            this.showNotification('Error al inicializar la página de ventas: ' + error.message, 'error');
        }
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
        try {
            // Verificar que la base de datos esté disponible
            if (!this.db) {
                console.error('Database not initialized');
                this.showNotification('Error: Base de datos no disponible', 'error');
                return;
            }

            const products = this.db.getProducts().filter(p => p.active !== false);
            const categories = this.db.getCategories();
            
            // Verificar que hay productos
            if (!products || products.length === 0) {
                console.warn('No products found');
                this.showNotification('No hay productos disponibles', 'warning');
            }
            
            // Comentado para producción
            // console.log('Productos cargados:', products);
            // console.log('Categorías encontradas:', categories);
            
            this.renderCategories(categories);
            this.renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Error al cargar productos: ' + error.message, 'error');
        }
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

        console.log('addToCart - Carrito después de agregar:', this.cart);
        console.log('addToCart - Total calculado:', this.cart.reduce((sum, item) => sum + item.subtotal, 0));
        
        this.updateCartDisplay();
        this.showNotification(`${product.nombre || product.name} agregado al carrito`, 'success');
    }

    removeFromCart(productId) {
        console.log('removeFromCart - Eliminando producto:', productId);
        console.log('removeFromCart - Carrito antes:', this.cart);
        
        // Verificar si se puede eliminar en pedidos restringidos
        if (this.editingRestrictedOrder) {
            this.showNotification(
                `No se pueden eliminar productos de un pedido ${this.originalOrderState}. Solo se pueden agregar productos adicionales.`, 
                'error'
            );
            return;
        }
        
        this.cart = this.cart.filter(item => item.product.id !== productId);
        
        console.log('removeFromCart - Carrito después:', this.cart);
        console.log('removeFromCart - Total calculado:', this.cart.reduce((sum, item) => sum + item.subtotal, 0));
        
        this.updateCartDisplay();
        this.showNotification('Producto eliminado del carrito', 'info');
    }

    updateQuantity(productId, newQuantity) {
        console.log('updateQuantity - Producto:', productId, 'Nueva cantidad:', newQuantity);
        
        const item = this.cart.find(item => item.product.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                // En pedidos restringidos, no permitir reducir a 0 (eliminar)
                if (this.editingRestrictedOrder) {
                    this.showNotification(
                        `No se pueden eliminar productos de un pedido ${this.originalOrderState}. Cantidad mínima: 1`, 
                        'error'
                    );
                    return;
                }
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                item.subtotal = item.quantity * (item.product.precio || item.product.price);
                
                console.log('updateQuantity - Item actualizado:', item);
                console.log('updateQuantity - Total calculado:', this.cart.reduce((sum, item) => sum + item.subtotal, 0));
                
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
            cartContainer.innerHTML = this.cart.map(item => {
                const isRestricted = this.editingRestrictedOrder;
                const minusButtonClass = isRestricted ? 'quantity-btn minus disabled' : 'quantity-btn minus';
                const removeButtonClass = isRestricted ? 'remove-item disabled' : 'remove-item';
                const minusOnClick = isRestricted ? '' : `onclick="salesManager.updateQuantity(${item.product.id}, ${item.quantity - 1})"`;
                const removeOnClick = isRestricted ? '' : `onclick="salesManager.removeFromCart(${item.product.id})"`;
                const removeTitle = isRestricted ? `title="No se pueden eliminar productos de pedidos ${this.originalOrderState}"` : '';
                const minusTitle = isRestricted ? `title="No se puede reducir cantidad en pedidos ${this.originalOrderState}"` : '';
                
                return `
                <div class="cart-item" data-product-id="${item.product.id}">
                    <div class="item-info">
                        <h5>${item.product.nombre || item.product.name}</h5>
                        <p class="item-price">$${(item.product.precio || item.product.price).toLocaleString()}</p>
                    </div>
                    <div class="item-controls">
                        <button class="${minusButtonClass}" ${minusOnClick} ${minusTitle}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" onclick="salesManager.updateQuantity(${item.product.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-subtotal">$${item.subtotal.toLocaleString()}</div>
                    <button class="${removeButtonClass}" ${removeOnClick} ${removeTitle}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                `;
            }).join('');
        }

        if (sendOrderBtn) {
            const hasItems = this.cart.length > 0;
            const cashOpen = window.auth && window.auth.isCashSessionActive();
            
            sendOrderBtn.disabled = !hasItems || !cashOpen;
            
            // Actualizar texto del botón según el estado
            if (!cashOpen) {
                sendOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Caja Cerrada';
                sendOrderBtn.style.opacity = '0.5';
            } else if (!hasItems) {
                sendOrderBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Orden';
                sendOrderBtn.style.opacity = '0.5';
            } else {
                sendOrderBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Orden';
                sendOrderBtn.style.opacity = '1';
            }
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
            
            // Limpiar restricciones de edición
            this.editingRestrictedOrder = false;
            this.originalOrderState = null;
            this.currentEditingOrderId = null;
            
            this.updateCartDisplay();
            this.showNotification('Carrito vaciado', 'info');
        }
    }

    sendOrder() {
        console.log('=== ENVIANDO PEDIDO NUEVO ===');
        console.log('sendOrder - currentEditingOrderId:', this.currentEditingOrderId);
        
        // Verificar si estamos en modo edición (no debería enviar pedido nuevo)
        if (this.currentEditingOrderId) {
            console.warn('ADVERTENCIA: sendOrder ejecutado mientras está en modo edición');
            console.warn('Se debería ejecutar updateOrder en su lugar');
            return;
        }

        // Verificar que la caja esté abierta antes de permitir crear pedidos
        if (!window.auth || !window.auth.isCashSessionActive()) {
            if (window.auth && window.auth.showCashClosedNotification) {
                window.auth.showCashClosedNotification('registrar pedidos');
            } else {
                this.showNotification('La caja debe estar abierta para registrar pedidos', 'error');
            }
            return;
        }

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

            // Guardar el pedido (puede retornar un nuevo pedido si se está actualizando)
            const savedOrder = this.db.saveOrder(order);
            
            // Si se retornó un pedido diferente (actualización con ID nuevo), usar ese
            const finalOrder = savedOrder.id !== order.id ? savedOrder : order;
            
            console.log('[VentasManager] Pedido guardado:', finalOrder);

            // Actualizar mesa si es dine-in
            if (finalOrder.mesa && this.currentOrder.type === 'dine-in') {
                const tables = this.db.getTables();
                const table = tables.find(t => t.numero == finalOrder.mesa);
                if (table) {
                    table.estado = 'ocupada';
                    table.pedidoId = finalOrder.id; // Usar el ID del pedido final
                    table.ultimaActividad = new Date().toISOString();
                    this.db.updateTable(table.id, table);
                    this.loadTables(); // Recargar mesas disponibles
                }
            }

            this.clearOrderForm();
            this.showNotification(`Pedido #${finalOrder.id} enviado exitosamente`, 'success');
            this.showOrderDetailsModal(finalOrder);

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

    clearOrderFormWithoutExitingEditMode() {
        this.cart = [];
        this.currentOrder.table = null;
        
        // Limpiar restricciones de edición después de actualización exitosa
        this.editingRestrictedOrder = false;
        this.originalOrderState = null;
        this.currentEditingOrderId = null;
        
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
        
        // NO llamar removeEditingMode() para mantener el modo de edición
    }

    removeEditingMode() {
        // Restaurar botón original si está en modo de edición
        const confirmBtn = document.getElementById('confirmOrderBtn');
        if (confirmBtn) {
            // Limpiar listeners previos clonando el botón
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            // Configurar para modo normal
            newBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Orden';
            newBtn.onclick = () => this.sendOrder();
            
            console.log('removeEditingMode - Botón restaurado para enviar pedido');
        }
        
        // Limpiar flag de edición
        this.currentEditingOrderId = null;
        
        // Limpiar parámetros de URL si existen
        const url = new URL(window.location);
        url.searchParams.delete('editOrder');
        window.history.replaceState({}, document.title, url.toString());
        
        console.log('removeEditingMode - Modo de edición limpiado');
    }

    loadOrderForEditing(orderId) {
        try {
            console.log('=== CARGANDO PEDIDO PARA EDICIÓN ===');
            const orderIdNumber = parseInt(orderId);
            console.log('ID a cargar:', orderIdNumber);

            // Evitar cargas duplicadas del mismo pedido
            if (this.currentEditingOrderId === orderIdNumber) {
                console.log('Pedido ya está siendo editado, saltando carga duplicada');
                return;
            }

            // Buscar el pedido
            const orders = this.db.getOrders();
            const order = orders.find(o => parseInt(o.id) === orderIdNumber);
            
            if (!order) {
                this.showNotification('Pedido no encontrado para editar', 'error');
                return;
            }

            console.log('Pedido encontrado:', order);

            // Verificar si se puede editar
            const fullyBlockedStates = ['pagado', 'cancelado'];
            const restrictedStates = ['entregado', 'listo'];
            
            if (fullyBlockedStates.includes(order.estado)) {
                this.showNotification(`No se puede editar un pedido ${order.estado}`, 'error');
                return;
            }

            // Para pedidos entregados o listos, permitir agregar pero no eliminar
            if (restrictedStates.includes(order.estado)) {
                this.editingRestrictedOrder = true;
                this.originalOrderState = order.estado;
                this.showNotification(
                    `Editando pedido ${order.estado}: Puede agregar productos pero no eliminar los existentes`, 
                    'warning'
                );
            } else {
                this.editingRestrictedOrder = false;
                this.originalOrderState = null;
            }

            // Advertencia para items en preparación
            const itemsInPreparation = order.items.filter(item => item.estado === 'preparando');
            if (itemsInPreparation.length > 0) {
                const confirmEdit = confirm(
                    `Atención: Este pedido tiene ${itemsInPreparation.length} item(s) en preparación.\n` +
                    '¿Está seguro de que desea editarlo?'
                );
                if (!confirmEdit) return;
            }

            // Limpiar carrito actual
            this.cart = [];
            
            // Cargar items al carrito
            this.loadOrderItemsToCart(order.items);

            // Configurar pedido actual
            this.currentOrder.table = order.mesa;
            this.currentOrder.type = 'dine-in';
            this.currentOrder.total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
            
            // Actualizar interfaz
            this.updateOrderTypeSelection();
            this.selectTable(order.mesa);
            this.updateCartDisplay();
            
            // Cambiar botón a modo actualización
            this.setUpdateMode(orderIdNumber);
            
            // Marcar pedido como siendo editado
            this.currentEditingOrderId = orderIdNumber;
            
            this.showNotification(`Editando pedido #${orderIdNumber} - Mesa ${order.mesa}`, 'info');
            console.log('✅ Pedido cargado para edición exitosamente');

        } catch (error) {
            console.error('Error cargando pedido para edición:', error);
            this.showNotification(`Error al cargar pedido: ${error.message}`, 'error');
        }
    }

    loadOrderItemsToCart(items) {
        const products = this.db.getProducts();
        
        items.forEach(item => {
            // Buscar producto por ID o nombre
            let product = products.find(p => p.id === item.productId);
            
            if (!product) {
                product = products.find(p => 
                    (p.nombre || p.name) === (item.productName || item.nombre)
                );
            }
            
            if (product) {
                // Producto encontrado - usar datos actuales del producto
                const quantity = item.quantity || item.cantidad || 1;
                const price = product.precio || product.price || 0;
                
                this.cart.push({
                    product: product,
                    quantity: quantity,
                    subtotal: quantity * price
                });
            } else {
                // Producto no encontrado - crear temporal
                console.warn('Producto no encontrado, creando temporal:', item);
                const tempProduct = {
                    id: item.productId || `temp_${Date.now()}`,
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

        // Consolidar items duplicados
        this.consolidateCart();
    }

    setUpdateMode(orderId) {
        const confirmBtn = document.getElementById('confirmOrderBtn');
        if (confirmBtn) {
            // Limpiar listeners previos clonando el botón
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            // Configurar para modo actualización
            newBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Pedido';
            newBtn.onclick = () => this.updateOrder(orderId);
            
            console.log('setUpdateMode - Botón configurado para actualizar pedido:', orderId);
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

    // Actualizar pedido existente sin eliminar y recrear
    updateExistingOrder(originalOrderId) {
        try {
            console.log('=== ACTUALIZANDO PEDIDO EXISTENTE ===');
            console.log('ID del pedido a actualizar:', originalOrderId);

            const orderIdNumber = parseInt(originalOrderId);
            const orders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
            
            // Buscar el pedido original
            const orderIndex = orders.findIndex(o => parseInt(o.id) === orderIdNumber);
            if (orderIndex === -1) {
                console.error('Pedido no encontrado:', orderIdNumber);
                this.showNotification('Error: Pedido no encontrado', 'error');
                return false;
            }

            const originalOrder = orders[orderIndex];
            
            // Verificar si se puede editar
            if (['pagado', 'cancelado'].includes(originalOrder.estado)) {
                this.showNotification('No se puede editar un pedido pagado o cancelado', 'error');
                return false;
            }

            // Construir datos actualizados preservando información crítica
            console.log('Items actuales en cart:', this.cart);
            console.log('Items actuales en currentOrder:', this.currentOrder.items);
            console.log('Total actual en currentOrder:', this.currentOrder.total);
            
            // Validar que hay items para actualizar (usar this.cart que es donde están los items reales)
            if (!this.cart || this.cart.length === 0) {
                console.error('No hay items en el carrito para actualizar');
                this.showNotification('Error: No hay items en el carrito para actualizar', 'error');
                return false;
            }

            const updatedOrderData = {
                ...originalOrder, // Preservar toda la información original
                items: this.cart.map(item => ({
                    productId: item.product.id,
                    productName: item.product.nombre || item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.product.precio || item.product.price,
                    subtotal: item.subtotal,
                    estado: 'pendiente'
                })), // Convertir carrito al formato correcto
                total: this.currentOrder.total, // Actualizar total
                observaciones: this.currentOrder.observaciones || '', // Actualizar observaciones
                // Preservar: id, fecha, hora, mesa, estado, tipo
            };

            console.log('Datos del pedido actualizado:', updatedOrderData);

            // Actualizar el pedido en el array
            orders[orderIndex] = updatedOrderData;

            // Guardar en localStorage
            localStorage.setItem('pos_orders', JSON.stringify(orders));

            console.log('✅ Pedido actualizado exitosamente');
            return true;

        } catch (error) {
            console.error('Error actualizando pedido existente:', error);
            return false;
        }
    }

    updateOrder(originalOrderId) {
        // Validación de caja abierta
        if (!window.auth || !window.auth.isCashSessionActive()) {
            if (window.auth && window.auth.showCashClosedNotification) {
                window.auth.showCashClosedNotification('actualizar pedidos');
            } else {
                this.showNotification('La caja debe estar abierta para actualizar pedidos', 'error');
            }
            return;
        }

        // Validación del pedido
        if (!this.validateOrderForSending()) {
            return;
        }

        try {
            console.log('=== INICIANDO ACTUALIZACIÓN DE PEDIDO ===');
            console.log('ID del pedido a actualizar:', originalOrderId);

            // Usar actualización in-place en lugar de delete+create
            const success = this.updateExistingOrder(originalOrderId);
            if (!success) {
                return;
            }

            // Limpiar interfaz y notificar (sin salir del modo edición)
            this.clearOrderFormWithoutExitingEditMode();
            this.updateCartDisplay();
            this.showNotification('Pedido actualizado exitosamente', 'success');

            console.log('=== ACTUALIZACIÓN COMPLETADA EXITOSAMENTE ===');

        } catch (error) {
            console.error('Error crítico en updateOrder:', error);
            this.showNotification(`Error al actualizar pedido: ${error.message}`, 'error');
        }
    }

    // Eliminar pedido por ID de forma atómica
    deleteOrderById(orderId) {
        try {
            const orderIdNumber = parseInt(orderId);
            const orders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
            
            console.log('Eliminando pedido ID:', orderIdNumber);
            console.log('Total pedidos antes:', orders.length);
            
            // Buscar el pedido original
            const originalOrder = orders.find(o => parseInt(o.id) === orderIdNumber);
            if (!originalOrder) {
                console.error('Pedido no encontrado para eliminar:', orderIdNumber);
                return false;
            }

            // Verificar si se puede editar
            if (['pagado', 'cancelado'].includes(originalOrder.estado)) {
                this.showNotification('No se puede editar un pedido pagado o cancelado', 'error');
                return false;
            }

            // Filtrar (eliminar) el pedido
            const filteredOrders = orders.filter(o => parseInt(o.id) !== orderIdNumber);
            
            console.log('Total pedidos después:', filteredOrders.length);
            
            // Guardar inmediatamente
            localStorage.setItem('pos_orders', JSON.stringify(filteredOrders));
            
            // Verificar que se eliminó
            const verification = JSON.parse(localStorage.getItem('pos_orders') || '[]');
            const stillExists = verification.find(o => parseInt(o.id) === orderIdNumber);
            
            if (stillExists) {
                console.error('FALLO: El pedido no se eliminó correctamente');
                return false;
            }

            console.log('✅ Pedido eliminado exitosamente');
            return true;

        } catch (error) {
            console.error('Error eliminando pedido:', error);
            return false;
        }
    }

    // Construir datos del nuevo pedido
    buildNewOrderData() {
        const newId = this.generateUniqueOrderId();
        
        const orderData = {
            id: newId,
            mesa: this.currentOrder.table || null,
            tipo: this.getOrderTypeSpanish(this.currentOrder.type),
            items: this.cart.map(item => ({
                productId: item.product.id,
                productName: item.product.nombre || item.product.name,
                nombre: item.product.nombre || item.product.name,
                quantity: item.quantity,
                cantidad: item.quantity,
                unitPrice: item.product.precio || item.product.price,
                precio: item.product.precio || item.product.price,
                subtotal: item.subtotal,
                estado: 'pendiente'
            })),
            total: this.cart.reduce((sum, item) => sum + item.subtotal, 0),
            estado: 'pendiente',
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}),
            cliente: null,
            // Marcas de actualización
            esActualizacion: true,
            fechaActualizacion: new Date().toISOString()
        };

        console.log('Nuevo pedido construido:', orderData);
        return orderData;
    }

    // Generar ID único y simple
    generateUniqueOrderId() {
        const orders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
        const existingIds = orders.map(o => parseInt(o.id) || 0);
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const newId = maxId + 1;
        
        console.log('Generando nuevo ID:', newId);
        return newId;
    }

    // Guardar nuevo pedido
    saveNewOrder(orderData) {
        try {
            const orders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
            orders.push(orderData);
            localStorage.setItem('pos_orders', JSON.stringify(orders));
            
            // Verificar que se guardó
            const verification = JSON.parse(localStorage.getItem('pos_orders') || '[]');
            const savedOrder = verification.find(o => parseInt(o.id) === orderData.id);
            
            if (!savedOrder) {
                throw new Error('No se pudo verificar que el pedido se guardó');
            }

            console.log('✅ Nuevo pedido guardado con ID:', orderData.id);
            
            // Registrar en logs si está disponible
            if (this.db.addOrderLog) {
                this.db.addOrderLog(orderData.id, 'created_from_update', 
                    `Pedido creado por actualización - Items: ${orderData.items.length}, Total: $${orderData.total}`);
            }

            return orderData.id;

        } catch (error) {
            console.error('Error guardando nuevo pedido:', error);
            throw error;
        }
    }

    // Actualizar asignación de mesa
    updateTableAssignment(oldOrderId, newOrderId) {
        try {
            if (!this.currentOrder.table) return;

            const tables = this.db.getTables();
            const tableNumber = this.currentOrder.table;
            const table = tables.find(t => t.numero === tableNumber);
            
            if (table && table.pedidoId && parseInt(table.pedidoId) === parseInt(oldOrderId)) {
                table.pedidoId = newOrderId;
                table.estado = 'ocupada';
                localStorage.setItem('pos_tables', JSON.stringify(tables));
                console.log('✅ Mesa actualizada con nuevo pedido ID:', newOrderId);
            }

        } catch (error) {
            console.error('Error actualizando asignación de mesa:', error);
        }
    }

    // Finalizar actualización y limpiar interfaz
    finishOrderUpdate(newOrderId) {
        // Limpiar formulario
        this.clearOrderForm();
        
        // Restaurar botón original
        const confirmBtn = document.getElementById('confirmOrderBtn');
        if (confirmBtn) {
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Orden';
            confirmBtn.onclick = () => this.sendOrder();
        }
        
        // Notificar éxito
        this.showNotification(`✅ Pedido actualizado exitosamente - Nuevo ID: #${newOrderId}`, 'success');
        
        // Notificar a otras pestañas
        this.triggerStorageEvent();
        
        // Redirigir después de un momento
        setTimeout(() => {
            window.location.href = 'mesas.html?updated=true';
        }, 2000);
    }

    // Disparar evento de storage para sincronizar pestañas
    triggerStorageEvent() {
        // Trigger storage event para sincronización
        const event = new Event('storage');
        event.key = 'pos_orders';
        event.newValue = localStorage.getItem('pos_orders');
        window.dispatchEvent(event);
    }

    updateTableAssignmentForNewOrder(oldTableNumber, newTableNumber, newOrderId) {
        try {
            const tables = this.db.getTables();
            
            // Liberar mesa anterior si cambió
            if (oldTableNumber && oldTableNumber !== newTableNumber) {
                const oldTable = tables.find(t => t.numero == oldTableNumber);
                if (oldTable) {
                    oldTable.estado = 'libre';
                    oldTable.pedidoId = null;
                    oldTable.ultimaActividad = new Date().toISOString();
                    this.db.updateTable(oldTable.id, oldTable);
                    console.log('updateTableAssignmentForNewOrder - Mesa anterior liberada:', oldTableNumber);
                }
            }
            
            // Asignar nueva mesa
            if (newTableNumber) {
                const newTable = tables.find(t => t.numero == newTableNumber);
                if (newTable) {
                    newTable.estado = 'ocupada';
                    newTable.pedidoId = newOrderId;
                    newTable.ultimaActividad = new Date().toISOString();
                    this.db.updateTable(newTable.id, newTable);
                    console.log('updateTableAssignmentForNewOrder - Nueva mesa asignada:', newTableNumber, 'con pedido:', newOrderId);
                }
            }
            
        } catch (error) {
            console.error('updateTableAssignmentForNewOrder - Error:', error);
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
    // Evitar doble inicialización
    if (window.salesManager) {
        console.log('SalesManager ya está inicializado, saltando inicialización duplicada');
        return;
    }
    
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

// Función auxiliar para refrescar datos
function refreshData() {
    if (window.salesManager) {
        window.salesManager.loadProducts();
        window.salesManager.loadTables();
    }
}
