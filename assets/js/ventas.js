class SalesManager {
    constructor() {
        this.cart = [];
        this.currentOrder = {
            items: [],
            total: 0,
            customer: null,
            table: null,
            type: 'dine-in' // 'dine-in', 'takeout', 'delivery'
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
        
        // Refrescar mesas cuando la página regane el foco
        window.addEventListener('focus', () => {
            this.loadTables();
        });
    }

    setupNotifications() {
        // Crear contenedor de notificaciones si no existe
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
        
        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Evento para cerrar manualmente
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }

    loadProducts() {
        const products = this.db.getProducts().filter(p => p.active !== false);
        const categories = this.db.getCategories();
        
        console.log('Productos cargados:', products);
        console.log('Categorías encontradas:', categories);
        
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
                    <i class="fas fa-box-open" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                    <p>No hay productos disponibles</p>
                    <p style="color: #666; font-size: 14px;">Ve a Configuración para agregar productos</p>
                    <button onclick="window.location.href='configuracion.html'" style="margin-top: 16px; padding: 8px 16px; background: var(--primary-green); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Ir a Configuración
                    </button>
                </div>
            `;
            return;
        }
        
        productsContainer.innerHTML = products.map(product => `
            <div class="product-card" data-category="${product.category}" data-product-id="${product.id}">
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price.toLocaleString()}</div>
                </div>
                <button class="add-to-cart-btn" onclick="salesManager.addToCart(${product.id})">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>
        `).join('');
    }

    loadTables() {
        const tableSelect = document.getElementById('selectedTable');
        if (!tableSelect) return;
        
        // Actualizar select de mesas cada vez
        const availableTables = this.db.getTables().filter(table => table.estado === 'libre');
        const currentValue = tableSelect.value;
        
        tableSelect.innerHTML = `
            <option value="">Seleccionar Mesa</option>
            ${availableTables.map(table => 
                `<option value="${table.id}">Mesa ${table.numero} (${table.capacidad} personas)</option>`
            ).join('')}
        `;
        
        // Mantener selección actual si sigue siendo válida
        if (currentValue && availableTables.find(t => t.id == currentValue)) {
            tableSelect.value = currentValue;
        }
    }

    initializeOrderType() {
        const orderTypeInputs = document.querySelectorAll('input[name="order-type"]');
        orderTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.currentOrder.type = e.target.value;
                this.toggleTableSelection();
            });
        });
        
        this.toggleTableSelection();
    }

    toggleTableSelection() {
        const tableContainer = document.querySelector('.table-selection');
        if (!tableContainer) return;
        
        if (this.currentOrder.type === 'dine-in') {
            tableContainer.style.display = 'block';
        } else {
            tableContainer.style.display = 'none';
            this.currentOrder.table = null;
            document.getElementById('table-select').value = '';
        }
    }

    setupEventListeners() {
        // Filtros de categoría
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                this.filterProducts(e.target.dataset.category);
                document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        // Búsqueda de productos
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }

        // Selección de mesa
        const tableSelect = document.getElementById('selectedTable');
        if (tableSelect) {
            tableSelect.addEventListener('change', (e) => {
                this.currentOrder.table = e.target.value || null;
                this.updateCartDisplay(); // Actualizar el estado del botón
            });
        }

        // Tipo de orden
        const orderTypeSelect = document.getElementById('orderType');
        if (orderTypeSelect) {
            orderTypeSelect.addEventListener('change', (e) => {
                this.currentOrder.type = e.target.value;
                this.updateCartDisplay(); // Actualizar el estado del botón
            });
        }

        // Información del cliente
        const customerInput = document.getElementById('customer-name');
        if (customerInput) {
            customerInput.addEventListener('change', (e) => {
                this.currentOrder.customer = e.target.value;
            });
        }

        // Botones de acción
        const processOrderBtn = document.getElementById('process-order');
        if (processOrderBtn) {
            processOrderBtn.addEventListener('click', () => this.processOrder());
        }

        const clearCartBtn = document.getElementById('clearCart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }

        // Botón de enviar pedido
        const sendOrderBtn = document.getElementById('sendOrder');
        if (sendOrderBtn) {
            sendOrderBtn.addEventListener('click', () => this.sendOrder());
        }

        // Métodos de pago
        const paymentButtons = document.querySelectorAll('.payment-method-btn');
        paymentButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectPaymentMethod(e.target.dataset.method);
            });
        });
    }

    filterProducts(category) {
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
            const name = product.querySelector('h3').textContent.toLowerCase();
            const description = product.querySelector('.product-description').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }

    addToCart(productId) {
        const product = this.db.getProducts().find(p => p.id === productId);
        if (!product) {
            this.showNotification('Producto no encontrado', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item.product.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                product: product,
                quantity: 1,
                subtotal: product.price
            });
        }
        
        this.updateCartDisplay();
        this.showNotification(`${product.name} agregado al carrito`, 'success');
    }

    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.product.id === productId);
        if (index > -1) {
            const removedItem = this.cart[index];
            this.cart.splice(index, 1);
            this.updateCartDisplay();
            this.showNotification(`${removedItem.product.name} eliminado del carrito`, 'info');
        }
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.product.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                item.subtotal = item.product.price * newQuantity;
                this.updateCartDisplay();
            }
        }
    }

    updateCartDisplay() {
        const cartContainer = document.getElementById('cartItems');
        const subtotalElement = document.getElementById('subtotal');
        const cartTotalElement = document.getElementById('cartTotal');
        
        if (!cartContainer) {
            console.error('Contenedor del carrito no encontrado. ID esperado: cartItems');
            return;
        }

        if (this.cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>El carrito está vacío</p>
                    <span>Agrega productos para comenzar</span>
                </div>
            `;
        } else {
            cartContainer.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4 class="cart-item-name">${item.product.name}</h4>
                        <p class="cart-item-price">$${item.product.price.toLocaleString()}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="salesManager.updateQuantity(${item.product.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="salesManager.updateQuantity(${item.product.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-item-btn" onclick="salesManager.removeFromCart(${item.product.id})" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="cart-item-subtotal">$${item.subtotal.toLocaleString()}</div>
                </div>
            `).join('');
        }

        const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        const total = subtotal; // Sin impuestos
        
        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toLocaleString()}`;
        
        this.currentOrder.items = this.cart;
        this.currentOrder.total = total;

        // Habilitar/deshabilitar botón de enviar pedido
        const sendOrderBtn = document.getElementById('sendOrder');
        if (sendOrderBtn) {
            sendOrderBtn.disabled = this.cart.length === 0;
        }
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
                    subtotal: item.subtotal
                })),
                total: this.currentOrder.total,
                mesa: this.currentOrder.table,
                tipo: this.currentOrder.type,
                estado: 'pendiente',
                timestamp: new Date().toISOString(),
                fecha: new Date().toLocaleDateString('es-ES'),
                hora: new Date().toLocaleTimeString('es-ES')
            };

            // Guardar pedido en la base de datos
            this.db.saveOrder(order);

            // Si es para mesa, actualizar estado de la mesa
            if (order.mesa && order.tipo === 'mesa') {
                const tables = this.db.getTables();
                const table = tables.find(t => t.numero == order.mesa);
                if (table) {
                    table.estado = 'ocupada';
                    this.db.updateTable(table.id, table);
                    this.loadTables(); // Recargar lista de mesas
                }
            }

            // Limpiar carrito y formulario
            this.clearOrderForm();

            this.showNotification(`Pedido #${order.id} enviado exitosamente`, 'success');

            // Mostrar detalles del pedido
            this.showOrderDetailsModal(order);

        } catch (error) {
            console.error('Error al enviar el pedido:', error);
            this.showNotification('Error al enviar el pedido', 'error');
        }
    }

    validateOrderForSending() {
        if (this.cart.length === 0) {
            this.showNotification('El carrito está vacío', 'error');
            return false;
        }

        if (this.currentOrder.type === 'mesa' && !this.currentOrder.table) {
            this.showNotification('Selecciona una mesa para pedidos en local', 'error');
            return false;
        }

        return true;
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
                            <p style="margin: 8px 0;"><strong>Total:</strong> ${this.db.formatCurrency(order.total)}</p>
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
                                        <span>${item.quantity}x ${item.productName}</span>
                                        <span style="font-weight: 600;">${this.db.formatCurrency(item.subtotal)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 24px;
                ">
                    <button class="btn-secondary" style="
                        padding: 12px 20px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        color: #64748b;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cerrar</button>
                    <button class="btn-view-orders" style="
                        padding: 12px 20px;
                        border: none;
                        background: #6b9b7c;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Ver Pedidos</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners para el modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.btn-secondary').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.btn-view-orders').addEventListener('click', () => {
            modal.remove();
            window.location.href = 'pedidos.html';
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getOrderTypeLabel(type) {
        const labels = {
            'mesa': 'Para Mesa',
            'llevar': 'Para Llevar'
        };
        return labels[type] || type;
    }

    selectPaymentMethod(method) {
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.querySelector(`[data-method="${method}"]`).classList.add('selected');
        this.currentOrder.paymentMethod = method;
    }

    validateOrder() {
        if (this.cart.length === 0) {
            this.showNotification('El carrito está vacío', 'error');
            return false;
        }

        if (this.currentOrder.type === 'dine-in' && !this.currentOrder.table) {
            this.showNotification('Selecciona una mesa para pedidos en local', 'error');
            return false;
        }

        if (!this.currentOrder.paymentMethod) {
            this.showNotification('Selecciona un método de pago', 'error');
            return false;
        }

        return true;
    }

    processOrder() {
        if (!this.validateOrder()) {
            return;
        }

        try {
            const order = {
                id: Date.now(),
                items: this.cart.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.product.price,
                    subtotal: item.subtotal
                })),
                total: this.currentOrder.total,
                customer: this.currentOrder.customer || 'Cliente sin nombre',
                table: this.currentOrder.table,
                type: this.currentOrder.type,
                paymentMethod: this.currentOrder.paymentMethod,
                status: 'pending',
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString()
            };

            // Guardar orden en la base de datos
            this.db.addOrder(order);

            // Si es una mesa, actualizarla como ocupada
            if (order.table) {
                this.db.updateTableStatus(order.table, 'occupied');
                this.loadTables(); // Recargar lista de mesas
            }

            // Actualizar inventario (si se implementa)
            this.updateInventory(order.items);

            // Limpiar carrito y formulario
            this.clearOrderForm();

            this.showNotification(`Orden #${order.id} procesada exitosamente`, 'success');

            // Opcionalmente, abrir el módulo de pedidos
            this.showOrderDetails(order);

        } catch (error) {
            console.error('Error al procesar la orden:', error);
            this.showNotification('Error al procesar la orden', 'error');
        }
    }

    updateInventory(items) {
        // Implementar actualización de inventario si es necesario
        items.forEach(item => {
            const product = this.db.getProducts().find(p => p.id === item.productId);
            if (product && product.stock !== undefined) {
                product.stock -= item.quantity;
                this.db.updateProduct(product);
            }
        });
    }

    clearOrderForm() {
        this.cart = [];
        this.currentOrder = {
            items: [],
            total: 0,
            customer: null,
            table: null,
            type: 'dine-in'
        };

        this.updateCartDisplay();
        
        // Limpiar formulario
        const customerInput = document.getElementById('customer-name');
        if (customerInput) customerInput.value = '';
        
        const tableSelect = document.getElementById('table-select');
        if (tableSelect) tableSelect.value = '';
        
        // Resetear tipo de orden
        const orderTypeInputs = document.querySelectorAll('input[name="order-type"]');
        orderTypeInputs.forEach(input => {
            if (input.value === 'dine-in') {
                input.checked = true;
            } else {
                input.checked = false;
            }
        });
        
        // Limpiar método de pago
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.currentOrder.type = 'dine-in';
        this.currentOrder.paymentMethod = null;
        this.toggleTableSelection();
    }

    showOrderDetails(order) {
        const modal = document.createElement('div');
        modal.className = 'order-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Orden Procesada</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-summary">
                        <h3>Orden #${order.id}</h3>
                        <p><strong>Cliente:</strong> ${order.customer}</p>
                        <p><strong>Tipo:</strong> ${this.getOrderTypeLabel(order.type)}</p>
                        ${order.table ? `<p><strong>Mesa:</strong> ${order.table}</p>` : ''}
                        <p><strong>Pago:</strong> ${this.getPaymentMethodLabel(order.paymentMethod)}</p>
                        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                        
                        <h4>Productos:</h4>
                        <ul class="order-items">
                            ${order.items.map(item => `
                                <li>${item.quantity}x ${item.productName} - $${item.subtotal.toFixed(2)}</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cerrar</button>
                    <button class="btn-primary" onclick="salesManager.printReceipt(${order.id})">Imprimir Recibo</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cerrar modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getPaymentMethodLabel(method) {
        const labels = {
            'cash': 'Efectivo',
            'card': 'Tarjeta',
            'transfer': 'Transferencia'
        };
        return labels[method] || method;
    }

    printReceipt(orderId) {
        const order = this.db.getOrders().find(o => o.id === orderId);
        if (!order) {
            this.showNotification('Orden no encontrada', 'error');
            return;
        }

        const receiptWindow = window.open('', '_blank');
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Recibo - Orden #${order.id}</title>
                    <style>
                        body { font-family: monospace; font-size: 12px; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .order-info { margin-bottom: 15px; }
                        .items { margin-bottom: 15px; }
                        .total { font-weight: bold; border-top: 1px solid #000; padding-top: 10px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Crêpes & Kaffee</h1>
                        <p>Recibo de Venta</p>
                    </div>
                    
                    <div class="order-info">
                        <p><strong>Orden #:</strong> ${order.id}</p>
                        <p><strong>Fecha:</strong> ${order.date}</p>
                        <p><strong>Hora:</strong> ${order.time}</p>
                        <p><strong>Cliente:</strong> ${order.customer}</p>
                        <p><strong>Tipo:</strong> ${this.getOrderTypeLabel(order.type)}</p>
                        ${order.table ? `<p><strong>Mesa:</strong> ${order.table}</p>` : ''}
                        <p><strong>Pago:</strong> ${this.getPaymentMethodLabel(order.paymentMethod)}</p>
                    </div>
                    
                    <div class="items">
                        <p><strong>Productos:</strong></p>
                        ${order.items.map(item => `
                            <p>${item.quantity}x ${item.productName} - $${item.subtotal.toFixed(2)}</p>
                        `).join('')}
                    </div>
                    
                    <div class="total">
                        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p>¡Gracias por su compra!</p>
                        <p>Que disfrute su comida</p>
                    </div>
                </body>
            </html>
        `);
        
        receiptWindow.document.close();
        receiptWindow.print();
    }

    // Método para obtener estadísticas de ventas
    getSalesStats() {
        const orders = this.db.getOrders();
        const today = new Date().toLocaleDateString();
        
        const todayOrders = orders.filter(order => order.date === today);
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        
        return {
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
            todayRevenue: todayRevenue,
            averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0
        };
    }
}

// Inicializar el administrador de ventas cuando la página cargue
let salesManager;
document.addEventListener('DOMContentLoaded', () => {
    salesManager = new SalesManager();
});
