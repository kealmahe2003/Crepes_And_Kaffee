// Gestor de Pedidos
class PedidosManager {
    constructor() {
        // Validar dependencias
        if (typeof Database === 'undefined') {
            throw new Error('Database class is required but not found');
        }
        
        this.db = new Database();
        this.orders = [];
        this.filterStatus = 'all';
        this.sortBy = 'recent';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOrders();
        this.updateStats();
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        // Refrescar pedidos cada 30 segundos
        setInterval(() => {
            this.loadOrders();
            this.updateStats();
        }, 30000);
    }

    bindEvents() {
        // Filtros
        const statusFilter = document.querySelector('.filter-buttons');
        if (statusFilter) {
            statusFilter.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    // Remover active de todos los botones
                    statusFilter.querySelectorAll('.filter-btn').forEach(btn => 
                        btn.classList.remove('active'));
                    
                    // Agregar active al botón clickeado
                    e.target.classList.add('active');
                    
                    this.filterStatus = e.target.dataset.status;
                    this.loadOrders();
                }
            });
        }

        // Ordenamiento
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.loadOrders();
            });
        }

        // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadOrders();
                this.updateStats();
                this.showNotification('Pedidos actualizados', 'success');
            });
        }
    }

    loadOrders() {
        try {
            this.orders = this.db.getOrders();
            this.displayOrders();
            this.updateStats();
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            this.showNotification('Error al cargar pedidos', 'error');
        }
    }

    displayOrders() {
        const container = document.getElementById('ordersGrid');
        const emptyState = document.getElementById('emptyOrders');
        
        if (!container) {
            console.error('Contenedor ordersGrid no encontrado');
            return;
        }

        // Filtrar pedidos
        let filteredOrders = this.orders;
        
        if (this.filterStatus !== 'all') {
            filteredOrders = this.orders.filter(order => order.estado === this.filterStatus);
        }

        // Ordenar pedidos
        filteredOrders.sort((a, b) => {
            switch (this.sortBy) {
                case 'recent':
                    return new Date(b.timestamp) - new Date(a.timestamp);
                case 'oldest':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'amount':
                    return b.total - a.total;
                case 'table':
                    return (a.mesa || 0) - (b.mesa || 0);
                default:
                    return 0;
            }
        });

        if (filteredOrders.length === 0) {
            container.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        container.style.display = 'grid';
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        const timeElapsed = this.getTimeElapsed(order.timestamp);
        const statusClass = this.getStatusClass(order.estado);
        
        return `
            <div class="order-card ${statusClass}" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Pedido #${order.id}</h3>
                        <div class="order-meta">
                            <span class="order-time">
                                <i class="fas fa-clock"></i>
                                ${order.hora}
                            </span>
                            <span class="time-elapsed" style="color: #e53e3e; font-weight: bold;">
                                <i class="fas fa-stopwatch"></i>
                                ${timeElapsed}
                            </span>
                        </div>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.estado}">
                            ${this.getStatusLabel(order.estado)}
                        </span>
                    </div>
                </div>

                <div class="order-details">
                    <div class="order-type">
                        <i class="fas fa-${this.getOrderTypeIcon(order.tipo)}"></i>
                        ${this.getOrderTypeLabel(order.tipo)}
                        ${order.mesa ? `- Mesa ${order.mesa}` : ''}
                    </div>
                    
                    <div class="order-items">
                        ${order.items.map((item, index) => `
                            <div class="order-item" style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #f0f0f0;
                            ">
                                <div style="flex: 1;">
                                    <span style="font-weight: 500;">${item.productName}</span>
                                    <span style="color: #666; margin-left: 8px;">x${item.quantity}</span>
                                    <div style="font-size: 12px; color: #666; margin-top: 2px;">
                                        Estado: ${this.getItemStatusLabel(item.estado || 'pendiente')}
                                        ${item.inicioPreparacion ? ` - Iniciado: ${new Date(item.inicioPreparacion).toLocaleTimeString('es-ES')}` : ''}
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: bold;">$${item.subtotal.toLocaleString()}</span>
                                    ${this.getItemActions(item, order, index)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-total">
                        <strong>Total: $${order.total.toLocaleString()}</strong>
                    </div>
                </div>

                <div class="order-actions">
                    ${this.getOrderActions(order)}
                </div>
            </div>
        `;
    }

    getItemActions(item, order, index) {
        if (order.estado === 'pagado' || order.estado === 'cancelado' || order.estado === 'entregado') {
            return '';
        }

        const itemStatus = item.estado || 'pendiente';
        
        switch (itemStatus) {
            case 'pendiente':
                return `
                    <button class="item-action-btn start" onclick="pedidosManager.startPreparingItem('${order.id}', ${index})" style="
                        padding: 4px 8px;
                        border: none;
                        background: #2196f3;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        transition: background-color 0.2s;
                    " title="Iniciar preparación">
                        <i class="fas fa-play"></i>
                    </button>
                `;
            case 'preparando':
                return `
                    <button class="item-action-btn finish" onclick="pedidosManager.finishItem('${order.id}', ${index})" style="
                        padding: 4px 8px;
                        border: none;
                        background: #4caf50;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        transition: background-color 0.2s;
                    " title="Finalizar preparación">
                        <i class="fas fa-check"></i>
                    </button>
                `;
            case 'listo':
                return `
                    <span style="color: #4caf50; font-size: 11px;" title="Producto listo">
                        <i class="fas fa-check-circle"></i>
                    </span>
                `;
            default:
                return '';
        }
    }

    getStatusClass(status) {
        const classes = {
            'pendiente': 'pending',
            'preparando': 'preparing',
            'listo': 'ready',
            'entregado': 'delivered',
            'pagado': 'paid',
            'cancelado': 'cancelled'
        };
        return classes[status] || 'pending';
    }

    getOrderTypeIcon(type) {
        const icons = {
            'mesa': 'utensils',
            'llevar': 'shopping-bag',
            'domicilio': 'motorcycle'
        };
        return icons[type] || 'utensils';
    }

    getOrderTypeLabel(type) {
        const labels = {
            'mesa': 'Para comer aquí',
            'llevar': 'Para llevar',
            'domicilio': 'Domicilio'
        };
        return labels[type] || type;
    }

    getOrderActions(order) {
        switch (order.estado) {
            case 'pendiente':
                return `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn cancel" onclick="pedidosManager.cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                `;
            case 'preparando':
                return `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn ready-all" onclick="pedidosManager.markAllItemsReady('${order.id}')">
                        <i class="fas fa-check-double"></i>
                        Marcar Todo Listo
                    </button>
                `;
            case 'listo':
                return `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn deliver" onclick="pedidosManager.markAsDelivered('${order.id}')">
                        <i class="fas fa-utensils"></i>
                        Entregar
                    </button>
                    <button class="action-btn payment" onclick="pedidosManager.sacarCuenta('${order.id}')">
                        <i class="fas fa-receipt"></i>
                        Sacar Cuenta
                    </button>
                `;
            case 'entregado':
                return `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn payment" onclick="pedidosManager.sacarCuenta('${order.id}')">
                        <i class="fas fa-receipt"></i>
                        Sacar Cuenta
                    </button>
                `;
            case 'pagado':
                return `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                `;
            default:
                return `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                `;
        }
    }

    startPreparingItem(orderId, itemIndex) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            const item = order.items[itemIndex];
            if (!item) {
                this.showNotification('Producto no encontrado', 'error');
                return;
            }

            // Actualizar estado del item
            item.estado = 'preparando';
            item.inicioPreparacion = new Date().toISOString();

            // Verificar si algún item está en preparación para cambiar el estado del pedido
            const hasPreparingItems = order.items.some(i => i.estado === 'preparando');
            if (hasPreparingItems && order.estado === 'pendiente') {
                order.estado = 'preparando';
            }

            this.db.saveOrder(order);
            this.loadOrders();
            this.showNotification(`Iniciada preparación de ${item.productName}`, 'success');

        } catch (error) {
            console.error('Error al iniciar preparación:', error);
            this.showNotification('Error al iniciar preparación', 'error');
        }
    }

    finishItem(orderId, itemIndex) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            const item = order.items[itemIndex];
            if (!item) {
                this.showNotification('Producto no encontrado', 'error');
                return;
            }

            // Actualizar estado del item
            item.estado = 'listo';
            item.finalizacion = new Date().toISOString();

            // Verificar si todos los items están listos
            const allItemsReady = order.items.every(i => i.estado === 'listo');
            if (allItemsReady) {
                order.estado = 'listo';
                this.showNotification(`¡Pedido #${order.id} está listo para entregar!`, 'success');
                
                // Opcional: Reproducir sonido de notificación
                this.playNotificationSound();
            }

            this.db.saveOrder(order);
            this.loadOrders();
            this.showNotification(`${item.productName} terminado`, 'success');

        } catch (error) {
            console.error('Error al finalizar item:', error);
            this.showNotification('Error al finalizar preparación', 'error');
        }
    }

    markAllItemsReady(orderId) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            if (confirm(`¿Marcar todos los items del pedido #${order.id} como listos?`)) {
                const now = new Date().toISOString();
                
                // Marcar todos los items como listos
                order.items.forEach(item => {
                    if (item.estado !== 'listo') {
                        item.estado = 'listo';
                        if (!item.finalizacion) {
                            item.finalizacion = now;
                        }
                    }
                });

                // Cambiar estado del pedido
                order.estado = 'listo';

                this.db.saveOrder(order);
                this.loadOrders();
                this.showNotification(`¡Pedido #${order.id} está listo para entregar!`, 'success');
                this.playNotificationSound();
            }

        } catch (error) {
            console.error('Error al marcar pedido como listo:', error);
            this.showNotification('Error al actualizar pedido', 'error');
        }
    }

    markAsDelivered(orderId) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            if (confirm(`¿Marcar pedido #${order.id} como entregado?`)) {
                order.estado = 'entregado';
                order.fechaEntrega = new Date().toISOString();

                // Marcar todos los items como entregados
                order.items.forEach(item => {
                    item.estado = 'entregado';
                    if (!item.finalizacion) {
                        item.finalizacion = new Date().toISOString();
                    }
                });

                this.db.saveOrder(order);
                this.loadOrders();
                this.showNotification(`Pedido #${order.id} marcado como entregado`, 'success');
            }

        } catch (error) {
            console.error('Error al marcar como entregado:', error);
            this.showNotification('Error al marcar como entregado', 'error');
        }
    }

    cancelOrder(orderId) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            if (confirm(`¿Estás seguro de cancelar el pedido #${order.id}?`)) {
                order.estado = 'cancelado';
                order.fechaCancelacion = new Date().toISOString();

                // Si el pedido tiene mesa, liberarla
                if (order.mesa) {
                    const tables = this.db.getTables();
                    const table = tables.find(t => t.numero == order.mesa);
                    if (table && table.estado === 'ocupada') {
                        table.estado = 'libre';
                        this.db.updateTable(table.id, table);
                    }
                }

                this.db.saveOrder(order);
                this.loadOrders();
                this.showNotification(`Pedido #${order.id} cancelado`, 'warning');
            }

        } catch (error) {
            console.error('Error al cancelar pedido:', error);
            this.showNotification('Error al cancelar pedido', 'error');
        }
    }

    viewOrderDetails(orderId) {
        const orders = this.db.getOrders();
        const order = orders.find(o => o.id == orderId);
        
        if (!order) {
            this.showNotification('Pedido no encontrado', 'error');
            return;
        }

        this.showOrderModal(order);
    }

    showOrderModal(order) {
        const modal = document.createElement('div');
        modal.className = 'order-detail-modal';
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

        const timeElapsed = this.getTimeElapsed(order.timestamp);
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 16px;
                padding: 24px;
                max-width: 700px;
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
                    <h2 style="margin: 0; color: #2d3748;">Detalles del Pedido #${order.id}</h2>
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
                
                <div class="order-summary" style="margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p><strong>Estado:</strong> <span style="color: ${this.getStatusColor(order.estado)};">${this.getStatusLabel(order.estado)}</span></p>
                        <p><strong>Hora del pedido:</strong> ${order.hora}</p>
                        <p><strong>Tiempo transcurrido:</strong> <span style="color: #e53e3e; font-weight: bold;">${timeElapsed}</span></p>
                        ${order.mesa ? `<p><strong>Mesa:</strong> ${order.mesa}</p>` : ''}
                    </div>
                    <div>
                        <p><strong>Tipo:</strong> ${this.getOrderTypeLabel(order.tipo)}</p>
                        <p><strong>Total:</strong> $${order.total.toLocaleString()}</p>
                        ${order.metodoPago ? `<p><strong>Método de pago:</strong> ${order.metodoPago}</p>` : ''}
                        ${order.fechaPago ? `<p><strong>Pagado:</strong> ${new Date(order.fechaPago).toLocaleTimeString('es-ES')}</p>` : ''}
                    </div>
                </div>
                
                <div class="order-items-detail" style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">Productos:</h3>
                    ${order.items.map((item, index) => `
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 15px;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            margin-bottom: 10px;
                            background: ${this.getItemBackgroundColor(item.estado || 'pendiente')};
                        ">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; margin-bottom: 5px;">${item.productName}</div>
                                <div style="color: #666; font-size: 14px;">Cantidad: ${item.quantity}</div>
                                <div style="color: #666; font-size: 14px;">Estado: ${this.getItemStatusLabel(item.estado || 'pendiente')}</div>
                                ${item.inicioPreparacion ? `<div style="color: #666; font-size: 12px;">Inicio: ${new Date(item.inicioPreparacion).toLocaleTimeString('es-ES')}</div>` : ''}
                                ${item.finalizacion ? `<div style="color: #666; font-size: 12px;">Terminado: ${new Date(item.finalizacion).toLocaleTimeString('es-ES')}</div>` : ''}
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; font-size: 16px;">$${item.subtotal.toLocaleString()}</div>
                                <div style="margin-top: 10px;">
                                    ${this.getItemModalActions(item, order, index)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="modal-actions" style="
                    display: flex;
                    gap: 10px;
                    justify-content: space-between;
                ">
                    <div style="display: flex; gap: 10px;">
                        ${order.mesa ? `
                            <button onclick="window.location.href='mesas.html'" style="
                                padding: 10px 20px;
                                border: 1px solid #4caf50;
                                background: #4caf50;
                                color: white;
                                border-radius: 8px;
                                cursor: pointer;
                            ">Ver Mesa</button>
                        ` : ''}
                        ${this.getModalActionButtons(order)}
                    </div>
                    <button onclick="this.closest('.order-detail-modal').remove()" style="
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

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getModalActionButtons(order) {
        switch (order.estado) {
            case 'pendiente':
                return `
                    <button onclick="pedidosManager.cancelOrder('${order.id}'); this.closest('.order-detail-modal').remove();" style="
                        padding: 10px 20px;
                        border: 1px solid #f44336;
                        background: #f44336;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Cancelar Pedido</button>
                `;
            case 'preparando':
                return `
                    <button onclick="pedidosManager.markAllItemsReady('${order.id}'); this.closest('.order-detail-modal').remove();" style="
                        padding: 10px 20px;
                        border: 1px solid #2196f3;
                        background: #2196f3;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Marcar Todo Listo</button>
                `;
            case 'listo':
                return `
                    <button onclick="pedidosManager.markAsDelivered('${order.id}'); this.closest('.order-detail-modal').remove();" style="
                        padding: 10px 20px;
                        border: 1px solid #4caf50;
                        background: #4caf50;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Marcar Entregado</button>
                    <button onclick="pedidosManager.sacarCuenta('${order.id}'); this.closest('.order-detail-modal').remove();" style="
                        padding: 10px 20px;
                        border: 1px solid #2196f3;
                        background: #2196f3;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Sacar Cuenta</button>
                `;
            case 'entregado':
                return `
                    <button onclick="pedidosManager.sacarCuenta('${order.id}'); this.closest('.order-detail-modal').remove();" style="
                        padding: 10px 20px;
                        border: 1px solid #2196f3;
                        background: #2196f3;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Sacar Cuenta</button>
                `;
            default:
                return '';
        }
    }

    getItemModalActions(item, order, itemIndex) {
        if (order.estado === 'pagado' || order.estado === 'cancelado' || order.estado === 'entregado') {
            return '';
        }

        const itemStatus = item.estado || 'pendiente';
        
        switch (itemStatus) {
            case 'pendiente':
                return `
                    <button onclick="pedidosManager.startPreparingItem('${order.id}', ${itemIndex}); this.closest('.order-detail-modal').remove();" style="
                        padding: 6px 12px;
                        border: none;
                        background: #2196f3;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-play"></i> Iniciar
                    </button>
                `;
            case 'preparando':
                return `
                    <button onclick="pedidosManager.finishItem('${order.id}', ${itemIndex}); this.closest('.order-detail-modal').remove();" style="
                        padding: 6px 12px;
                        border: none;
                        background: #4caf50;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-check"></i> Finalizar
                    </button>
                `;
            case 'listo':
                return `
                    <span style="color: #4caf50; font-weight: bold; font-size: 12px;">
                        <i class="fas fa-check-circle"></i> Listo
                    </span>
                `;
            default:
                return '';
        }
    }

    getStatusColor(status) {
        const colors = {
            'pendiente': '#ff9800',
            'preparando': '#2196f3',
            'listo': '#4caf50',
            'entregado': '#9e9e9e',
            'pagado': '#38a169',
            'cancelado': '#f44336'
        };
        return colors[status] || '#666';
    }

    getStatusLabel(status) {
        const labels = {
            'pendiente': 'Pendiente',
            'preparando': 'Preparando',
            'listo': 'Listo',
            'entregado': 'Entregado',
            'pagado': 'Pagado',
            'cancelado': 'Cancelado'
        };
        return labels[status] || status;
    }

    getItemStatusLabel(status) {
        const labels = {
            'pendiente': 'Pendiente',
            'preparando': 'Preparando',
            'listo': 'Listo',
            'entregado': 'Entregado'
        };
        return labels[status] || status;
    }

    getItemBackgroundColor(status) {
        const colors = {
            'pendiente': '#fff3cd',
            'preparando': '#cce5ff',
            'listo': '#d4edda',
            'entregado': '#f8f9fa'
        };
        return colors[status] || '#ffffff';
    }

    getTimeElapsed(timestamp) {
        const now = new Date();
        const orderTime = new Date(timestamp);
        const diffMs = now - orderTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return `${diffMins} minutos`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;
            return `${diffHours}h ${remainingMins}min`;
        }
    }

    playNotificationSound() {
        try {
            // Crear un beep simple usando Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Mantener solo para errores importantes
            // console.log('No se pudo reproducir el sonido de notificación');
        }
    }

    updateStats() {
        try {
            const orders = this.db.getOrders();
            const today = new Date().toDateString();
            
            const todayOrders = orders.filter(order => 
                new Date(order.timestamp).toDateString() === today
            );

            // Calcular estadísticas
            const stats = {
                total: todayOrders.length,
                pendiente: todayOrders.filter(o => o.estado === 'pendiente').length,
                preparando: todayOrders.filter(o => o.estado === 'preparando').length,
                listo: todayOrders.filter(o => o.estado === 'listo').length,
                entregado: todayOrders.filter(o => o.estado === 'entregado').length,
                cancelado: todayOrders.filter(o => o.estado === 'cancelado').length,
                revenue: todayOrders
                    .filter(o => o.estado === 'pagado' || o.estado === 'entregado')
                    .reduce((sum, order) => sum + order.total, 0)
            };

            // Actualizar elementos del DOM
            this.updateStatsElements(stats);

        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        }
    }

    updateStatsElements(stats) {
        const elements = {
            'totalOrders': stats.total,
            'pendingOrders': stats.pendiente,
            'preparingOrders': stats.preparando,
            'readyOrders': stats.listo,
            'deliveredOrders': stats.entregado,
            'cancelledOrders': stats.cancelado,
            'todayRevenue': `$${stats.revenue.toLocaleString()}`
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;

        const colors = {
            'success': '#4caf50',
            'error': '#f44336',
            'warning': '#ff9800',
            'info': '#2196f3'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Función para sacar cuenta de un pedido
    sacarCuenta(orderId) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            // Crear modal de cuenta
            this.showCuentaModal(order);

        } catch (error) {
            console.error('Error al sacar cuenta:', error);
            this.showNotification('Error al generar cuenta', 'error');
        }
    }

    // Mostrar modal de cuenta
    showCuentaModal(order) {
        const modal = document.createElement('div');
        modal.className = 'cuenta-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        `;

        const total = order.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #333; margin-bottom: 10px;">🧾 Cuenta</h2>
                <p style="color: #666;">Mesa ${order.mesa || 'Para llevar'} - Pedido #${order.id}</p>
                <p style="color: #666; font-size: 14px;">${new Date(order.fecha).toLocaleString('es-ES')}</p>
            </div>

            <div style="border-top: 2px dashed #ddd; padding-top: 20px; margin-bottom: 20px;">
                ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${item.cantidad}x ${item.nombre}</span>
                        <span>$${(item.precio * item.cantidad).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>

            <div style="border-top: 2px solid #333; padding-top: 15px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                    <span>TOTAL:</span>
                    <span>$${total.toLocaleString()}</span>
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="pedidosManager.procesarPago('${order.id}', 'efectivo')" style="
                    padding: 12px 20px;
                    background: #4caf50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">💰 Pagar Efectivo</button>
                
                <button onclick="pedidosManager.procesarPago('${order.id}', 'tarjeta')" style="
                    padding: 12px 20px;
                    background: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">💳 Pagar Tarjeta</button>
                
                <button onclick="this.closest('.cuenta-modal').remove()" style="
                    padding: 12px 20px;
                    background: #666;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Cancelar</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Procesar pago
    procesarPago(orderId, metodoPago) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            const total = order.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

            // Actualizar estado del pedido
            order.estado = 'pagado';
            order.fechaPago = new Date().toISOString();
            order.metodoPago = metodoPago;
            order.totalPagado = total;

            // Guardar el pedido actualizado
            this.db.saveOrder(order);

            // Crear registro de venta
            const sale = {
                id: Date.now(),
                fecha: new Date().toISOString(),
                items: order.items,
                total: total,
                metodoPago: metodoPago,
                mesa: order.mesa,
                pedidoId: order.id,
                cajero: localStorage.getItem('currentUser') || 'Sistema'
            };

            // Guardar la venta
            this.db.saveSale(sale);

            // Si tiene mesa, liberarla
            if (order.mesa) {
                const tables = this.db.getTables();
                const table = tables.find(t => t.numero == order.mesa);
                if (table) {
                    table.estado = 'libre';
                    table.clienteActual = null;
                    table.pedidoActual = null;
                    table.horaLiberacion = new Date().toISOString();
                    this.db.saveTable(table);
                }
            }

            // Cerrar modal de cuenta
            const modal = document.querySelector('.cuenta-modal');
            if (modal) {
                modal.remove();
            }

            this.loadOrders();
            this.showNotification(`Pago procesado exitosamente - $${total.toLocaleString()}`, 'success');

        } catch (error) {
            console.error('Error al procesar pago:', error);
            this.showNotification('Error al procesar el pago', 'error');
        }
    }
}

// Inicializar el gestor cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.pedidosManager = new PedidosManager();
});

// Función auxiliar para refrescar datos
function refreshData() {
    if (window.pedidosManager) {
        window.pedidosManager.loadOrders();
        window.pedidosManager.updateStats();
    }
}

// Agregar estilos CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .order-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .order-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .action-btn {
        margin: 0 2px;
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s ease;
    }

    .action-btn.view {
        background: #e3f2fd;
        color: #1976d2;
    }

    .action-btn.view:hover {
        background: #bbdefb;
    }

    .action-btn.cancel {
        background: #ffebee;
        color: #d32f2f;
    }

    .action-btn.cancel:hover {
        background: #ffcdd2;
    }

    .action-btn.deliver {
        background: #e8f5e8;
        color: #388e3c;
    }

    .action-btn.deliver:hover {
        background: #c8e6c9;
    }

    .action-btn.ready-all {
        background: #e3f2fd;
        color: #1976d2;
    }

    .action-btn.ready-all:hover {
        background: #bbdefb;
    }

    .action-btn.payment {
        background: #f3e5f5;
        color: #7b1fa2;
    }

    .action-btn.payment:hover {
        background: #e1bee7;
    }

    .item-action-btn:hover {
        opacity: 0.8;
        transform: scale(1.1);
    }

    .no-orders {
        text-align: center;
        padding: 60px 20px;
        color: #666;
    }

    .no-orders i {
        font-size: 48px;
        margin-bottom: 20px;
        color: #ddd;
    }

    .no-orders h3 {
        margin-bottom: 10px;
        color: #333;
    }

    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
    }

    .status-pendiente {
        background: #fff3cd;
        color: #856404;
    }

    .status-preparando {
        background: #cce5ff;
        color: #0056b3;
        animation: pulse 2s infinite;
    }

    .status-listo {
        background: #d4edda;
        color: #155724;
        animation: glow 1.5s ease-in-out infinite alternate;
    }

    .status-entregado {
        background: #f8f9fa;
        color: #495057;
    }

    .status-pagado {
        background: #d1ecf1;
        color: #0c5460;
    }

    .status-cancelado {
        background: #f8d7da;
        color: #721c24;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    @keyframes glow {
        from { box-shadow: 0 0 5px #28a745; }
        to { box-shadow: 0 0 20px #28a745, 0 0 30px #28a745; }
    }

    .order-card.preparing {
        border-left: 4px solid #2196f3;
    }

    .order-card.ready {
        border-left: 4px solid #4caf50;
        background: linear-gradient(90deg, #f8fff8 0%, #ffffff 10%);
    }
`;

document.head.appendChild(style);

// Inicializar el gestor cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.pedidosManager = new PedidosManager();
});

// Función auxiliar para refrescar datos
function refreshData() {
    if (window.pedidosManager) {
        window.pedidosManager.loadOrders();
        window.pedidosManager.updateStats();
    }
}
