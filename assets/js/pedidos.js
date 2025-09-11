// Gestión de Pedidos - Sistema POS Crêpes & Kaffee

class PedidosManager {
    constructor() {
        this.db = new Database();
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadOrders();
        this.setupNotifications();
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

    setupEventListeners() {
        // Filtros de estado
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Búsqueda
        const searchInput = document.getElementById('search-orders');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.setSearch(e.target.value);
            });
        }

        // Eventos de actualización automática
        this.setupAutoRefresh();
    }

    setupAutoRefresh() {
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.loadOrders();
        }, 30000);
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.loadOrders();
    }

    setSearch(search) {
        this.currentSearch = search.toLowerCase();
        this.loadOrders();
    }

    loadOrders() {
        const orders = this.db.getOrders();
        
        // Si no hay pedidos, crear algunos de ejemplo para testing
        if (orders.length === 0) {
            this.createSampleOrders();
            const newOrders = this.db.getOrders();
            const filteredOrders = this.filterOrders(newOrders);
            this.renderOrders(filteredOrders);
            this.updateStats(newOrders);
        } else {
            const filteredOrders = this.filterOrders(orders);
            this.renderOrders(filteredOrders);
            this.updateStats(orders);
        }
    }

    createSampleOrders() {
        const sampleOrders = [
            {
                id: Date.now() + 1,
                timestamp: new Date().toISOString(),
                customer: 'Juan Pérez',
                table: 3,
                type: 'dine-in',
                status: 'pending',
                items: [
                    { productId: 1, productName: 'Americano', quantity: 2, price: 4500, subtotal: 9000 },
                    { productId: 5, productName: 'Crêpe Nutella', quantity: 1, price: 8500, subtotal: 8500 }
                ],
                total: 17500,
                paymentMethod: 'cash'
            },
            {
                id: Date.now() + 2,
                timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutos atrás
                customer: 'María García',
                table: 1,
                type: 'dine-in',
                status: 'preparing',
                items: [
                    { productId: 2, productName: 'Cappuccino', quantity: 1, price: 5500, subtotal: 5500 },
                    { productId: 6, productName: 'Crêpe Jamón y Queso', quantity: 1, price: 9000, subtotal: 9000 }
                ],
                total: 14500,
                paymentMethod: 'card'
            },
            {
                id: Date.now() + 3,
                timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutos atrás
                customer: 'Carlos López',
                table: null,
                type: 'takeout',
                status: 'ready',
                items: [
                    { productId: 4, productName: 'Frappé Vainilla', quantity: 2, price: 7500, subtotal: 15000 }
                ],
                total: 15000,
                paymentMethod: 'transfer'
            }
        ];

        sampleOrders.forEach(order => {
            this.db.saveOrder(order);
        });
    }

    filterOrders(orders) {
        let filtered = orders;

        // Filtro por estado
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(order => order.status === this.currentFilter);
        }

        // Filtro por búsqueda
        if (this.currentSearch) {
            filtered = filtered.filter(order => 
                order.id.toString().includes(this.currentSearch) ||
                order.customer.toLowerCase().includes(this.currentSearch) ||
                (order.table && order.table.toString().includes(this.currentSearch))
            );
        }

        // Ordenar por fecha (más recientes primero)
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    renderOrders(orders) {
        const container = document.getElementById('ordersGrid');
        if (!container) {
            console.error('Contenedor de pedidos no encontrado. ID esperado: ordersGrid');
            return;
        }

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-receipt fa-3x"></i>
                    <h3>No hay pedidos</h3>
                    <p>No se encontraron pedidos con los filtros actuales</p>
                    <button onclick="window.location.href='ventas.html'" class="btn-create-order">
                        <i class="fas fa-plus"></i>
                        Crear Nuevo Pedido
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        const statusColors = {
            'pending': '#ff9800',
            'preparing': '#2196f3',
            'ready': '#4caf50',
            'delivered': '#9e9e9e',
            'cancelled': '#f44336'
        };

        const statusLabels = {
            'pending': 'Pendiente',
            'preparing': 'Preparando',
            'ready': 'Listo',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };

        const statusIcons = {
            'pending': 'clock',
            'preparing': 'utensils',
            'ready': 'check-circle',
            'delivered': 'check-double',
            'cancelled': 'times-circle'
        };

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3 class="order-number">Pedido #${order.id}</h3>
                        <div class="order-time">${this.formatDateTime(order.timestamp)}</div>
                    </div>
                    <div class="order-status" style="background-color: ${statusColors[order.status]}">
                        <i class="fas fa-${statusIcons[order.status]}"></i>
                        ${statusLabels[order.status]}
                    </div>
                </div>

                <div class="order-details">
                    <div class="customer-info">
                        <i class="fas fa-user"></i>
                        <span>${order.customer}</span>
                        ${order.table ? `<i class="fas fa-chair"></i><span>Mesa ${order.table}</span>` : ''}
                    </div>
                    
                    <div class="order-type">
                        <i class="fas fa-${this.getOrderTypeIcon(order.type)}"></i>
                        ${this.getOrderTypeLabel(order.type)}
                    </div>
                </div>

                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span class="item-quantity">${item.quantity}x</span>
                            <span class="item-name">${item.productName}</span>
                            <span class="item-price">$${item.subtotal.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="order-footer">
                    <div class="order-total">
                        <strong>Total: $${order.total.toFixed(2)}</strong>
                    </div>
                    <div class="order-actions">
                        ${this.getOrderActions(order)}
                    </div>
                </div>
            </div>
        `;
    }

    getOrderTypeIcon(type) {
        const icons = {
            'dine-in': 'utensils',
            'takeout': 'shopping-bag',
            'delivery': 'motorcycle'
        };
        return icons[type] || 'utensils';
    }

    getOrderTypeLabel(type) {
        const labels = {
            'dine-in': 'Para comer aquí',
            'takeout': 'Para llevar',
            'delivery': 'Domicilio'
        };
        return labels[type] || type;
    }

    getOrderActions(order) {
        switch (order.status) {
            case 'pending':
                return `
                    <button class="btn btn-primary" onclick="pedidosManager.updateOrderStatus(${order.id}, 'preparing')">
                        <i class="fas fa-play"></i> Preparar
                    </button>
                    <button class="btn btn-danger" onclick="pedidosManager.cancelOrder(${order.id})">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                `;
            case 'preparing':
                return `
                    <button class="btn btn-success" onclick="pedidosManager.updateOrderStatus(${order.id}, 'ready')">
                        <i class="fas fa-check"></i> Marcar Listo
                    </button>
                    <button class="btn btn-danger" onclick="pedidosManager.cancelOrder(${order.id})">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                `;
            case 'ready':
                return `
                    <button class="btn btn-success" onclick="pedidosManager.updateOrderStatus(${order.id}, 'delivered')">
                        <i class="fas fa-check-double"></i> Entregar
                    </button>
                `;
            case 'delivered':
            case 'cancelled':
                return `
                    <button class="btn btn-secondary" onclick="pedidosManager.viewOrderDetails(${order.id})">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                `;
            default:
                return '';
        }
    }

    updateOrderStatus(orderId, newStatus) {
        try {
            const order = this.db.getOrders().find(o => o.id === orderId);
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            order.status = newStatus;
            order.lastUpdated = new Date().toISOString();

            // Si se marca como entregado y es mesa, liberar la mesa
            if (newStatus === 'delivered' && order.table) {
                this.db.updateTableStatus(order.table, 'libre');
            }

            this.db.updateOrder(order);
            this.loadOrders();
            this.showNotification(`Pedido #${orderId} actualizado a ${this.getStatusLabel(newStatus)}`, 'success');

        } catch (error) {
            console.error('Error al actualizar pedido:', error);
            this.showNotification('Error al actualizar el pedido', 'error');
        }
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'preparing': 'Preparando',
            'ready': 'Listo',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return labels[status] || status;
    }

    cancelOrder(orderId) {
        if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
            return;
        }

        try {
            const order = this.db.getOrders().find(o => o.id === orderId);
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            order.status = 'cancelled';
            order.cancelledAt = new Date().toISOString();

            // Si tenía mesa asignada, liberarla
            if (order.table) {
                this.db.updateTableStatus(order.table, 'libre');
            }

            this.db.updateOrder(order);
            this.loadOrders();
            this.showNotification(`Pedido #${orderId} cancelado`, 'info');

        } catch (error) {
            console.error('Error al cancelar pedido:', error);
            this.showNotification('Error al cancelar el pedido', 'error');
        }
    }

    viewOrderDetails(orderId) {
        const order = this.db.getOrders().find(o => o.id === orderId);
        if (!order) {
            this.showNotification('Pedido no encontrado', 'error');
            return;
        }

        this.showOrderModal(order);
    }

    showOrderModal(order) {
        const modal = document.createElement('div');
        modal.className = 'order-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Detalles del Pedido #${order.id}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-detail-info">
                        <div class="info-group">
                            <label>Cliente:</label>
                            <span>${order.customer}</span>
                        </div>
                        <div class="info-group">
                            <label>Fecha y Hora:</label>
                            <span>${this.formatDateTime(order.timestamp)}</span>
                        </div>
                        <div class="info-group">
                            <label>Tipo:</label>
                            <span>${this.getOrderTypeLabel(order.type)}</span>
                        </div>
                        ${order.table ? `
                            <div class="info-group">
                                <label>Mesa:</label>
                                <span>${order.table}</span>
                            </div>
                        ` : ''}
                        <div class="info-group">
                            <label>Estado:</label>
                            <span>${this.getStatusLabel(order.status)}</span>
                        </div>
                        <div class="info-group">
                            <label>Método de Pago:</label>
                            <span>${this.getPaymentMethodLabel(order.paymentMethod)}</span>
                        </div>
                    </div>

                    <div class="order-detail-items">
                        <h3>Productos</h3>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Cantidad</th>
                                    <th>Producto</th>
                                    <th>Precio Unit.</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.quantity}</td>
                                        <td>${item.productName}</td>
                                        <td>$${item.unitPrice.toFixed(2)}</td>
                                        <td>$${item.subtotal.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td><strong>$${order.total.toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cerrar</button>
                    <button class="btn btn-primary" onclick="pedidosManager.printOrder(${order.id})">Imprimir</button>
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

    printOrder(orderId) {
        const order = this.db.getOrders().find(o => o.id === orderId);
        if (!order) {
            this.showNotification('Pedido no encontrado', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Pedido #${order.id}</title>
                    <style>
                        body { font-family: monospace; font-size: 12px; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .order-info { margin-bottom: 15px; }
                        .items { margin-bottom: 15px; }
                        .total { font-weight: bold; border-top: 1px solid #000; padding-top: 10px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Crêpes & Kaffee</h1>
                        <p>Pedido #${order.id}</p>
                    </div>
                    
                    <div class="order-info">
                        <p><strong>Cliente:</strong> ${order.customer}</p>
                        <p><strong>Fecha:</strong> ${this.formatDateTime(order.timestamp)}</p>
                        <p><strong>Tipo:</strong> ${this.getOrderTypeLabel(order.type)}</p>
                        ${order.table ? `<p><strong>Mesa:</strong> ${order.table}</p>` : ''}
                        <p><strong>Estado:</strong> ${this.getStatusLabel(order.status)}</p>
                    </div>
                    
                    <div class="items">
                        <table>
                            <thead>
                                <tr>
                                    <th>Cant.</th>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.quantity}</td>
                                        <td>${item.productName}</td>
                                        <td>$${item.unitPrice.toFixed(2)}</td>
                                        <td>$${item.subtotal.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="total">
                        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    }

    updateStats(orders) {
        const stats = {
            all: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length
        };

        // Actualizar badges en los filtros
        Object.keys(stats).forEach(status => {
            const badge = document.querySelector(`[data-filter="${status}"] .badge`);
            if (badge) {
                badge.textContent = stats[status];
            }
        });
    }

    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Inicializar cuando la página cargue
let pedidosManager;
document.addEventListener('DOMContentLoaded', () => {
    pedidosManager = new PedidosManager();
});
