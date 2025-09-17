// Gestor de Pedidos - Versión Limpia con Diagnósticos
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
        console.log('[PedidosManager] Inicializando...');
        this.bindEvents();
        this.loadOrders();
        this.updateStats();
        this.startAutoRefresh();
        this.setupStorageListener();
        console.log('[PedidosManager] ✅ Inicialización completada');
    }

    setupStorageListener() {
        // Escuchar cambios de localStorage desde otras pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === 'pos_orders') {
                console.log('[PedidosManager] Detectado cambio en pedidos desde otra pestaña');
                this.loadOrders();
                this.updateStats();
            }
        });
    }

    startAutoRefresh() {
        // Refrescar pedidos cada 30 segundos
        setInterval(() => {
            this.loadOrders();
            this.updateStats();
        }, 30000);
    }

    bindEvents() {
        console.log('[PedidosManager] Enlazando eventos...');
        
        // Filtros
        const statusFilter = document.querySelector('.filter-buttons');
        if (statusFilter) {
            statusFilter.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    // Remover active de todos los botones
                    statusFilter.querySelectorAll('.filter-btn').forEach(btn => 
                        btn.classList.remove('active')
                    );
                    
                    // Agregar active al botón clickeado
                    e.target.classList.add('active');
                    
                    // Establecer filtro
                    this.filterStatus = e.target.getAttribute('data-status');
                    this.displayOrders();
                }
            });
        }
        
        // Ordenamiento
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.displayOrders();
            });
        }
        
        console.log('[PedidosManager] ✅ Eventos enlazados');
    }

    loadOrders() {
        try {
            console.log('[PedidosManager] === CARGANDO PEDIDOS ===');
            
            // Verificar elementos DOM
            const ordersGrid = document.getElementById('ordersGrid');
            const emptyOrders = document.getElementById('emptyOrders');
            
            console.log('[PedidosManager] Elementos DOM encontrados:', {
                ordersGrid: !!ordersGrid,
                emptyOrders: !!emptyOrders
            });
            
            if (!ordersGrid) {
                console.error('[PedidosManager] ❌ ERROR: No se encontró #ordersGrid');
                return;
            }
            
            if (!emptyOrders) {
                console.error('[PedidosManager] ❌ ERROR: No se encontró #emptyOrders');
                return;
            }
            
            // Obtener pedidos de la base de datos
            console.log('[PedidosManager] Obteniendo pedidos de la base de datos...');
            const allOrders = this.db.getOrders();
            
            console.log('[PedidosManager] Pedidos obtenidos de localStorage:', {
                cantidad: allOrders.length,
                pedidos: allOrders.map(o => ({ id: o.id, estado: o.estado, mesa: o.mesa }))
            });
            
            // Filtrar pedidos - SOLO excluir pagados y cancelados
            const filteredOrders = allOrders.filter(order => {
                const shouldExclude = order.estado === 'pagado' || order.estado === 'cancelado';
                if (shouldExclude) {
                    console.log(`[PedidosManager] Excluyendo pedido ${order.id} - estado: ${order.estado}`);
                }
                return !shouldExclude;
            });
            
            console.log('[PedidosManager] Pedidos después del filtrado:', {
                cantidad: filteredOrders.length,
                pedidos: filteredOrders.map(o => ({ id: o.id, estado: o.estado, mesa: o.mesa }))
            });
            
            this.orders = filteredOrders;
            this.displayOrders();
            
            // Ejecutar limpieza de mesas huérfanas después de cargar pedidos
            this.cleanupOrphanedTables();
            
            console.log('[PedidosManager] ✅ Carga de pedidos completada');
            
        } catch (error) {
            console.error('[PedidosManager] ❌ ERROR en loadOrders:', error);
            this.showNotification('Error al cargar pedidos', 'error');
        }
    }

    displayOrders() {
        try {
            console.log('[PedidosManager] === MOSTRANDO PEDIDOS ===');
            
            const ordersGrid = document.getElementById('ordersGrid');
            const emptyOrders = document.getElementById('emptyOrders');
            
            if (!ordersGrid || !emptyOrders) {
                console.error('[PedidosManager] ❌ ERROR: Elementos DOM no encontrados en displayOrders');
                return;
            }
            
            console.log('[PedidosManager] Pedidos a mostrar:', {
                total: this.orders.length,
                filtro: this.filterStatus
            });
            
            // Aplicar filtros adicionales
            let filteredOrders = [...this.orders];
            
            if (this.filterStatus !== 'all') {
                const beforeFilter = filteredOrders.length;
                filteredOrders = filteredOrders.filter(order => order.estado === this.filterStatus);
                console.log(`[PedidosManager] Filtro '${this.filterStatus}' aplicado: ${beforeFilter} -> ${filteredOrders.length} pedidos`);
            }
            
            // Aplicar ordenamiento
            this.sortOrders(filteredOrders);
            
            console.log('[PedidosManager] Pedidos finales a renderizar:', filteredOrders.length);
            
            if (filteredOrders.length === 0) {
                console.log('[PedidosManager] No hay pedidos para mostrar - mostrando mensaje vacío');
                ordersGrid.style.display = 'none';
                emptyOrders.style.display = 'block';
                return;
            }
            
            // Generar HTML
            console.log('[PedidosManager] Generando HTML para los pedidos...');
            const orderCards = filteredOrders.map((order, index) => {
                console.log(`[PedidosManager] Generando card ${index + 1}/${filteredOrders.length} para pedido:`, order.id);
                return this.createOrderCard(order);
            });
            
            console.log('[PedidosManager] Cards HTML generadas:', orderCards.length);
            
            // Insertar HTML
            const finalHTML = orderCards.join('');
            console.log('[PedidosManager] HTML final - longitud:', finalHTML.length);
            
            ordersGrid.innerHTML = finalHTML;
            console.log('[PedidosManager] ✅ HTML insertado en ordersGrid');
            
            // Mostrar grid, ocultar mensaje vacío
            ordersGrid.style.display = 'grid';
            emptyOrders.style.display = 'none';
            
            console.log('[PedidosManager] ✅ Visualización de pedidos completada');
            
        } catch (error) {
            console.error('[PedidosManager] ❌ ERROR en displayOrders:', error);
            this.showNotification('Error al mostrar pedidos', 'error');
        }
    }

    createOrderCard(order) {
        try {
            console.log('[PedidosManager] Generando card para pedido:', order.id);
            
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
                                    ${order.hora || 'Sin hora'}
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
                            <i class="fas fa-${this.getOrderTypeIcon(order.tipo || 'dine-in')}"></i>
                            ${this.getOrderTypeLabel(order.tipo || 'dine-in')}
                            ${order.mesa ? `- Mesa ${order.mesa}` : ''}
                        </div>
                        <div class="order-items">
                            ${(order.items || []).map((item, index) => `
                                <div class="order-item">
                                    <div>
                                        <span style="font-weight: 500;">${item.productName || 'Producto'}</span>
                                        <span style="color: #666; margin-left: 8px;">x${item.quantity || 1}</span>
                                    </div>
                                    <span style="font-weight: bold;">$${(item.subtotal || 0).toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-total">
                            <strong>Total: $${(order.total || 0).toLocaleString()}</strong>
                        </div>
                    </div>

                    <div class="order-actions">
                        ${this.getOrderActions(order)}
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('[PedidosManager] Error generando card para pedido', order.id, ':', error);
            return `
                <div class="order-card error">
                    <div class="order-header">
                        <h3>Error en Pedido #${order.id}</h3>
                    </div>
                    <div class="order-details">
                        <p>Error al mostrar este pedido</p>
                    </div>
                </div>
            `;
        }
    }

    getTimeElapsed(timestamp) {
        try {
            const now = new Date();
            const orderTime = new Date(timestamp);
            const diffMs = now - orderTime;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffMinutes < 60) {
                return `${diffMinutes} min`;
            } else {
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                return `${hours}h ${minutes}m`;
            }
        } catch (error) {
            console.error('[PedidosManager] Error calculando tiempo transcurrido:', error);
            return 'N/A';
        }
    }

    getStatusClass(estado) {
        const statusClasses = {
            'pendiente': 'status-pending',
            'preparando': 'status-preparing',
            'listo': 'status-ready',
            'entregado': 'status-delivered',
            'pagado': 'status-paid',
            'cancelado': 'status-cancelled'
        };
        return statusClasses[estado] || 'status-unknown';
    }

    getStatusLabel(estado) {
        const statusLabels = {
            'pendiente': 'Pendiente',
            'preparando': 'Preparando',
            'listo': 'Listo',
            'entregado': 'Entregado',
            'pagado': 'Pagado',
            'cancelado': 'Cancelado'
        };
        return statusLabels[estado] || estado;
    }

    getOrderTypeIcon(tipo) {
        const icons = {
            'dine-in': 'utensils',
            'takeaway': 'shopping-bag',
            'delivery': 'truck'
        };
        return icons[tipo] || 'utensils';
    }

    getOrderTypeLabel(tipo) {
        const labels = {
            'dine-in': 'Para comer aquí',
            'takeaway': 'Para llevar',
            'delivery': 'Delivery'
        };
        return labels[tipo] || 'Para comer aquí';
    }

    getOrderActions(order) {
        if (order.estado === 'pagado' || order.estado === 'cancelado') {
            return `
                <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i>
                    Ver Detalles
                </button>
            `;
        }

        let actions = '';
        
        switch (order.estado) {
            case 'pendiente':
                actions = `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn edit" onclick="pedidosManager.startOrder('${order.id}')">
                        <i class="fas fa-play"></i>
                        Iniciar
                    </button>
                    <button class="action-btn cancel" onclick="pedidosManager.cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                `;
                break;
            case 'preparando':
                actions = `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn ready-all" onclick="pedidosManager.finishOrder('${order.id}')">
                        <i class="fas fa-check"></i>
                        Marcar Listo
                    </button>
                    <button class="action-btn cancel" onclick="pedidosManager.cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                `;
                break;
            case 'listo':
                actions = `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn deliver" onclick="pedidosManager.deliverOrder('${order.id}')">
                        <i class="fas fa-utensils"></i>
                        Entregar
                    </button>
                `;
                break;
            case 'entregado':
                actions = `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn payment" onclick="pedidosManager.showBillModal('${order.id}')">
                        <i class="fas fa-receipt"></i>
                        Sacar Cuenta
                    </button>
                `;
                break;
        }
        
        return actions;
    }

    sortOrders(orders) {
        switch (this.sortBy) {
            case 'recent':
                orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                orders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'table':
                orders.sort((a, b) => (a.mesa || 0) - (b.mesa || 0));
                break;
            case 'status':
                const statusOrder = ['pendiente', 'preparando', 'listo', 'entregado'];
                orders.sort((a, b) => {
                    const aIndex = statusOrder.indexOf(a.estado);
                    const bIndex = statusOrder.indexOf(b.estado);
                    return aIndex - bIndex;
                });
                break;
        }
    }

    updateStats() {
        try {
            const stats = {
                total: this.orders.length,
                pendiente: this.orders.filter(o => o.estado === 'pendiente').length,
                preparando: this.orders.filter(o => o.estado === 'preparando').length,
                listo: this.orders.filter(o => o.estado === 'listo').length,
                entregado: this.orders.filter(o => o.estado === 'entregado').length
            };

            // Actualizar contadores en la UI
            document.getElementById('totalOrders').textContent = stats.total;
            document.getElementById('pendingOrders').textContent = stats.pendiente;
            document.getElementById('preparingOrders').textContent = stats.preparando;
            document.getElementById('readyOrders').textContent = stats.listo;
            document.getElementById('deliveredOrders').textContent = stats.entregado;

        } catch (error) {
            console.error('[PedidosManager] Error actualizando estadísticas:', error);
        }
    }

    // Acciones de pedidos
    startOrder(orderId) {
        try {
            console.log('[PedidosManager] Iniciando pedido:', orderId);
            this.updateOrderStatus(orderId, 'preparando');
            this.showNotification(`Pedido #${orderId} iniciado`, 'success');
        } catch (error) {
            console.error('[PedidosManager] Error iniciando pedido:', error);
            this.showNotification('Error al iniciar pedido', 'error');
        }
    }

    finishOrder(orderId) {
        try {
            console.log('[PedidosManager] Terminando pedido:', orderId);
            this.updateOrderStatus(orderId, 'listo');
            this.showNotification(`Pedido #${orderId} listo para entregar`, 'success');
        } catch (error) {
            console.error('[PedidosManager] Error terminando pedido:', error);
            this.showNotification('Error al terminar pedido', 'error');
        }
    }

    deliverOrder(orderId) {
        try {
            console.log('[PedidosManager] Entregando pedido:', orderId);
            this.updateOrderStatus(orderId, 'entregado');
            this.showNotification(`Pedido #${orderId} entregado`, 'success');
        } catch (error) {
            console.error('[PedidosManager] Error entregando pedido:', error);
            this.showNotification('Error al entregar pedido', 'error');
        }
    }

    cancelOrder(orderId) {
        try {
            if (confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
                console.log('[PedidosManager] Cancelando pedido:', orderId);
                
                // Obtener el pedido antes de cancelarlo para liberar la mesa
                const order = this.orders.find(o => o.id == orderId);
                if (!order) {
                    console.error('[PedidosManager] Pedido no encontrado para cancelar:', orderId);
                    this.showNotification('Pedido no encontrado', 'error');
                    return;
                }
                
                console.log('[PedidosManager] Pedido a cancelar:', order);
                
                // Actualizar estado del pedido a cancelado
                this.updateOrderStatus(orderId, 'cancelado');
                
                // Si el pedido tenía una mesa asignada, liberarla
                if (order.mesa) {
                    console.log('[PedidosManager] Liberando mesa:', order.mesa);
                    this.releaseTable(order.mesa, orderId);
                }
                
                this.showNotification(`Pedido #${orderId} cancelado exitosamente`, 'success');
            }
        } catch (error) {
            console.error('[PedidosManager] Error cancelando pedido:', error);
            this.showNotification('Error al cancelar pedido', 'error');
        }
    }

    releaseTable(tableNumber, orderId) {
        try {
            console.log(`[PedidosManager] Liberando mesa ${tableNumber} del pedido ${orderId}`);
            
            const tables = this.db.getTables();
            const table = tables.find(t => t.numero == tableNumber);
            
            if (table) {
                console.log('[PedidosManager] Mesa encontrada antes de liberar:', table);
                
                // Verificar que la mesa realmente tenga este pedido asignado
                if (table.pedidoId == orderId || table.pedidoActual == orderId) {
                    table.estado = 'libre';
                    table.clienteActual = null;
                    table.pedidoActual = null;
                    table.pedidoId = null;
                    table.horaLiberacion = new Date().toISOString();
                    table.ultimaActividad = new Date().toISOString();
                    
                    this.db.saveTable(table);
                    console.log('[PedidosManager] Mesa liberada exitosamente:', table);
                    
                    // Notificar a otras pestañas del cambio
                    this.triggerStorageUpdate();
                } else {
                    console.log(`[PedidosManager] La mesa ${tableNumber} no estaba asignada a este pedido ${orderId}`);
                }
            } else {
                console.log(`[PedidosManager] Mesa ${tableNumber} no encontrada en la base de datos`);
            }
        } catch (error) {
            console.error('[PedidosManager] Error liberando mesa:', error);
        }
    }

    showBillModal(orderId) {
        try {
            console.log('[PedidosManager] Mostrando factura para pedido:', orderId);
            
            const order = this.orders.find(o => o.id == orderId);
            if (!order) {
                console.error('[PedidosManager] Pedido no encontrado:', orderId);
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            // Generar contenido de la factura
            const billContent = this.generateBillContent(order);
            
            // Mostrar modal de factura
            const modal = document.createElement('div');
            modal.className = 'bill-modal';
            modal.innerHTML = `
                <div class="bill-modal-content">
                    <div class="bill-header">
                        <h2>Factura - Pedido #${order.id}</h2>
                        <button class="close-btn" onclick="this.closest('.bill-modal').remove()">×</button>
                    </div>
                    <div class="bill-body">
                        ${billContent}
                    </div>
                    <div class="bill-footer">
                        <button class="action-btn info" onclick="pedidosManager.printBill('${orderId}')">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                        <button class="action-btn success" onclick="pedidosManager.markAsPaid('${orderId}')">
                            <i class="fas fa-check"></i> Marcar como Pagado
                        </button>
                        <button class="action-btn" onclick="this.closest('.bill-modal').remove()">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('[PedidosManager] Error mostrando factura:', error);
            this.showNotification('Error al mostrar factura', 'error');
        }
    }

    generateBillContent(order) {
        const itemsHtml = order.items.map(item => `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toLocaleString()}</td>
                <td>$${item.subtotal.toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <div class="bill-info">
                <p><strong>Mesa:</strong> ${order.mesa || 'N/A'}</p>
                <p><strong>Hora:</strong> ${order.hora}</p>
                <p><strong>Tipo:</strong> ${this.getOrderTypeLabel(order.tipo)}</p>
            </div>
            <table class="bill-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>Total</strong></td>
                        <td><strong>$${order.total.toLocaleString()}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;
    }

    markAsPaid(orderId) {
        try {
            console.log('[PedidosManager] Marcando como pagado:', orderId);
            
            // Obtener el pedido antes de marcarlo como pagado para liberar la mesa
            const order = this.orders.find(o => o.id == orderId);
            if (!order) {
                console.error('[PedidosManager] Pedido no encontrado para marcar como pagado:', orderId);
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }
            
            // Actualizar estado del pedido a pagado
            this.updateOrderStatus(orderId, 'pagado');
            
            // Si el pedido tenía una mesa asignada, marcarla para limpieza
            if (order.mesa) {
                console.log('[PedidosManager] Marcando mesa para limpieza:', order.mesa);
                this.markTableForCleanup(order.mesa, orderId);
            }
            
            // Cerrar modal
            const modal = document.querySelector('.bill-modal');
            if (modal) {
                modal.remove();
            }
            
            this.showNotification('Pedido marcado como pagado', 'success');
            
        } catch (error) {
            console.error('[PedidosManager] Error marcando como pagado:', error);
            this.showNotification('Error al marcar como pagado', 'error');
        }
    }

    markTableForCleanup(tableNumber, orderId) {
        try {
            console.log(`[PedidosManager] Marcando mesa ${tableNumber} para limpieza después del pago del pedido ${orderId}`);
            
            const tables = this.db.getTables();
            const table = tables.find(t => t.numero == tableNumber);
            
            if (table) {
                console.log('[PedidosManager] Mesa encontrada antes de marcar para limpieza:', table);
                
                // Verificar que la mesa realmente tenga este pedido asignado
                if (table.pedidoId == orderId || table.pedidoActual == orderId) {
                    table.estado = 'limpieza';
                    table.clienteActual = null;
                    table.pedidoActual = null;
                    table.pedidoId = null;
                    table.horaLiberacion = new Date().toISOString();
                    table.ultimaActividad = new Date().toISOString();
                    
                    this.db.saveTable(table);
                    console.log('[PedidosManager] Mesa marcada para limpieza exitosamente:', table);
                    
                    // Notificar a otras pestañas del cambio
                    this.triggerStorageUpdate();
                } else {
                    console.log(`[PedidosManager] La mesa ${tableNumber} no estaba asignada a este pedido ${orderId}`);
                }
            } else {
                console.log(`[PedidosManager] Mesa ${tableNumber} no encontrada en la base de datos`);
            }
        } catch (error) {
            console.error('[PedidosManager] Error marcando mesa para limpieza:', error);
        }
    }

    viewOrderDetails(orderId) {
        try {
            console.log('[PedidosManager] Mostrando detalles del pedido:', orderId);
            
            const order = this.orders.find(o => o.id == orderId);
            if (!order) {
                console.error('[PedidosManager] Pedido no encontrado:', orderId);
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            // Crear modal de detalles
            const modal = document.createElement('div');
            modal.className = 'details-modal';
            modal.innerHTML = `
                <div class="details-modal-content">
                    <div class="details-header">
                        <h2>Detalles del Pedido #${order.id}</h2>
                        <button class="close-btn" onclick="this.closest('.details-modal').remove()">×</button>
                    </div>
                    <div class="details-body">
                        <div class="detail-section">
                            <h3>Información General</h3>
                            <p><strong>Estado:</strong> <span class="status-badge status-${order.estado}">${this.getStatusLabel(order.estado)}</span></p>
                            <p><strong>Mesa:</strong> ${order.mesa || 'N/A'}</p>
                            <p><strong>Tipo:</strong> ${this.getOrderTypeLabel(order.tipo || 'dine-in')}</p>
                            <p><strong>Hora del pedido:</strong> ${order.hora || 'N/A'}</p>
                            <p><strong>Tiempo transcurrido:</strong> ${this.getTimeElapsed(order.timestamp)}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Productos</h3>
                            <div class="items-list">
                                ${(order.items || []).map(item => `
                                    <div class="detail-item">
                                        <div class="item-info">
                                            <span class="item-name">${item.productName || 'Producto'}</span>
                                            <span class="item-quantity">Cantidad: ${item.quantity || 1}</span>
                                            <span class="item-price">Precio unitario: $${(item.price || 0).toLocaleString()}</span>
                                        </div>
                                        <div class="item-total">
                                            <strong>$${(item.subtotal || 0).toLocaleString()}</strong>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Total del Pedido</h3>
                            <div class="order-total-detail">
                                <strong>$${(order.total || 0).toLocaleString()}</strong>
                            </div>
                        </div>
                        
                        ${order.pedidoAnteriorId ? `
                            <div class="detail-section">
                                <h3>Información de Actualización</h3>
                                <p><em>Este pedido reemplazó al pedido #${order.pedidoAnteriorId}</em></p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="details-footer">
                        <button class="action-btn" onclick="this.closest('.details-modal').remove()">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('[PedidosManager] Error mostrando detalles:', error);
            this.showNotification('Error al mostrar detalles', 'error');
        }
    }

    updateOrderStatus(orderId, newStatus) {
        try {
            console.log(`[PedidosManager] Actualizando pedido ${orderId} a estado:`, newStatus);
            
            // Obtener todos los pedidos
            const allOrders = this.db.getOrders();
            const orderIndex = allOrders.findIndex(o => o.id == orderId);
            
            if (orderIndex === -1) {
                throw new Error('Pedido no encontrado');
            }
            
            // Actualizar estado
            allOrders[orderIndex].estado = newStatus;
            
            // Si se marca como pagado, agregar fecha de pago
            if (newStatus === 'pagado') {
                allOrders[orderIndex].fechaPago = new Date().toISOString();
            }
            
            // Guardar en localStorage
            localStorage.setItem('pos_orders', JSON.stringify(allOrders));
            
            // Recargar pedidos
            this.loadOrders();
            this.updateStats();
            
            // Notificar a otras pestañas
            this.triggerStorageUpdate();
            
            console.log(`[PedidosManager] ✅ Pedido ${orderId} actualizado a:`, newStatus);
            
        } catch (error) {
            console.error('[PedidosManager] Error actualizando estado del pedido:', error);
            throw error;
        }
    }

    triggerStorageUpdate() {
        const event = new Event('storage');
        event.key = 'pos_orders';
        event.newValue = localStorage.getItem('pos_orders');
        window.dispatchEvent(event);
    }

    // Función para limpiar mesas huérfanas (sin pedidos activos)
    cleanupOrphanedTables() {
        try {
            console.log('[PedidosManager] Limpiando mesas huérfanas...');
            
            const tables = this.db.getTables();
            const orders = this.db.getOrders();
            
            // Obtener pedidos activos (no cancelados ni pagados)
            const activeOrders = orders.filter(o => !['cancelado', 'pagado'].includes(o.estado));
            const activeOrderIds = activeOrders.map(o => o.id);
            
            let tablesUpdated = 0;
            
            tables.forEach(table => {
                // Si la mesa tiene un pedido asignado pero ese pedido ya no existe o no está activo
                if ((table.pedidoId || table.pedidoActual) && 
                    !activeOrderIds.includes(table.pedidoId) && 
                    !activeOrderIds.includes(table.pedidoActual)) {
                    
                    console.log(`[PedidosManager] Mesa ${table.numero} tiene pedido inactivo ${table.pedidoId || table.pedidoActual}, liberando...`);
                    
                    table.estado = 'libre';
                    table.clienteActual = null;
                    table.pedidoActual = null;
                    table.pedidoId = null;
                    table.horaLiberacion = new Date().toISOString();
                    table.ultimaActividad = new Date().toISOString();
                    
                    this.db.saveTable(table);
                    tablesUpdated++;
                }
            });
            
            if (tablesUpdated > 0) {
                console.log(`[PedidosManager] ✅ ${tablesUpdated} mesa(s) liberada(s) por limpieza de huérfanas`);
                this.triggerStorageUpdate();
            } else {
                console.log('[PedidosManager] No se encontraron mesas huérfanas para limpiar');
            }
            
        } catch (error) {
            console.error('[PedidosManager] Error en limpieza de mesas huérfanas:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[PedidosManager] ===== INICIALIZANDO PÁGINA DE PEDIDOS =====');
    
    try {
        // Crear instancia del gestor de pedidos
        window.pedidosManager = new PedidosManager();
        console.log('[PedidosManager] ✅ Gestor de pedidos creado exitosamente');
        
        // Ejecutar diagnósticos automáticos
        setTimeout(() => {
            console.log('[PedidosManager] === EJECUTANDO DIAGNÓSTICOS AUTOMÁTICOS ===');
            
            // Diagnóstico 1: Verificar localStorage
            const orders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
            console.log('[DIAGNÓSTICO] Pedidos en localStorage:', orders.length);
            
            // Diagnóstico 2: Verificar DOM
            const ordersGrid = document.getElementById('ordersGrid');
            const emptyOrders = document.getElementById('emptyOrders');
            console.log('[DIAGNÓSTICO] Elementos DOM:', {
                ordersGrid: !!ordersGrid,
                emptyOrders: !!emptyOrders
            });
            
            // Diagnóstico 3: Verificar instancia
            console.log('[DIAGNÓSTICO] Instancia pedidosManager:', !!window.pedidosManager);
            console.log('[DIAGNÓSTICO] Pedidos cargados en memoria:', window.pedidosManager.orders.length);
            
            console.log('[PedidosManager] === DIAGNÓSTICOS COMPLETADOS ===');
        }, 1000);
        
    } catch (error) {
        console.error('[PedidosManager] ❌ ERROR en inicialización:', error);
        alert('Error al inicializar el gestor de pedidos: ' + error.message);
    }
});

// Funciones globales de diagnóstico
window.crearPedidoPrueba = function() {
    const testOrder = {
        id: Date.now(),
        mesa: 1,
        items: [
            {
                productName: "Café Americano",
                quantity: 2,
                price: 3000,
                subtotal: 6000
            }
        ],
        total: 6000,
        timestamp: new Date().toISOString(),
        hora: new Date().toLocaleTimeString('es-ES'),
        estado: "pendiente",
        tipo: "dine-in"
    };
    
    const orders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
    orders.push(testOrder);
    localStorage.setItem('pos_orders', JSON.stringify(orders));
    
    // También crear/actualizar la mesa
    const tables = JSON.parse(localStorage.getItem('pos_tables') || '[]');
    let table = tables.find(t => t.numero == 1);
    if (!table) {
        table = {
            id: Date.now(),
            numero: 1,
            capacidad: 4,
            estado: 'ocupada',
            pedidoId: testOrder.id,
            pedidoActual: testOrder.id,
            clienteActual: 'Cliente Prueba',
            ultimaActividad: new Date().toISOString()
        };
        tables.push(table);
    } else {
        table.estado = 'ocupada';
        table.pedidoId = testOrder.id;
        table.pedidoActual = testOrder.id;
        table.clienteActual = 'Cliente Prueba';
        table.ultimaActividad = new Date().toISOString();
    }
    
    localStorage.setItem('pos_tables', JSON.stringify(tables));
    
    console.log('[TEST] Pedido de prueba creado:', testOrder);
    console.log('[TEST] Mesa actualizada:', table);
    
    // Recargar pedidos
    if (window.pedidosManager) {
        window.pedidosManager.loadOrders();
    }
    
    return testOrder;
};

// Función para verificar estado de mesas
window.verificarMesas = function() {
    const tables = JSON.parse(localStorage.getItem('pos_tables') || '[]');
    const orders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
    
    console.log('=== ESTADO DE MESAS ===');
    tables.forEach(table => {
        console.log(`Mesa ${table.numero}:`, {
            estado: table.estado,
            pedidoId: table.pedidoId,
            pedidoActual: table.pedidoActual,
            clienteActual: table.clienteActual
        });
        
        // Verificar si el pedido existe
        if (table.pedidoId || table.pedidoActual) {
            const pedidoId = table.pedidoId || table.pedidoActual;
            const pedido = orders.find(o => o.id == pedidoId);
            if (pedido) {
                console.log(`  -> Pedido encontrado: Estado ${pedido.estado}`);
            } else {
                console.log(`  -> ⚠️ Pedido ${pedidoId} NO ENCONTRADO - Mesa huérfana`);
            }
        }
    });
    
    console.log('=== PEDIDOS ACTIVOS ===');
    const activePedidos = orders.filter(o => !['cancelado', 'pagado'].includes(o.estado));
    activePedidos.forEach(order => {
        console.log(`Pedido ${order.id}:`, {
            estado: order.estado,
            mesa: order.mesa
        });
    });
};

window.probarHTML = function() {
    const ordersGrid = document.getElementById('ordersGrid');
    if (!ordersGrid) {
        console.error('[TEST] No se encontró ordersGrid');
        return false;
    }
    
    const testHTML = `
        <div class="order-card" style="border: 2px solid red; padding: 20px; margin: 10px;">
            <h3>PEDIDO DE PRUEBA DIRECTO</h3>
            <p>Si ves esto, la inyección de HTML funciona</p>
        </div>
    `;
    
    ordersGrid.innerHTML = testHTML;
    console.log('[TEST] HTML inyectado directamente en ordersGrid');
    return true;
};

// Estilos CSS
const style = document.createElement('style');
style.textContent = `
    .bill-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .bill-modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
    }

    .bill-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    }

    .bill-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
    }

    .bill-table th,
    .bill-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .bill-table th {
        background-color: #f5f5f5;
        font-weight: bold;
    }

    .bill-footer {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
    }

    .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s ease;
        margin: 0 2px;
    }

    .action-btn.view {
        background: #e3f2fd;
        color: #1976d2;
    }

    .action-btn.view:hover {
        background: #bbdefb;
    }

    .action-btn.edit {
        background: #e8f5e8;
        color: #388e3c;
    }

    .action-btn.edit:hover {
        background: #c8e6c9;
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

    .action-btn.success {
        background-color: #4CAF50;
        color: white;
    }

    .action-btn.success:hover {
        background-color: #45a049;
    }

    .action-btn.info {
        background-color: #2196F3;
        color: white;
    }

    .action-btn.info:hover {
        background-color: #0b7dda;
    }

    .action-btn.warning {
        background-color: #ff9800;
        color: white;
    }

    .action-btn.warning:hover {
        background-color: #e68900;
    }

    .action-btn.danger {
        background-color: #f44336;
        color: white;
    }

    .action-btn.danger:hover {
        background-color: #da190b;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        border-left: 4px solid #4CAF50;
        max-width: 300px;
    }

    .notification.error {
        border-left-color: #f44336;
    }

    .notification.warning {
        border-left-color: #ff9800;
    }

    .notification.info {
        border-left-color: #2196F3;
    }

    .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .details-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .details-modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 700px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
    }

    .details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    .details-body {
        margin-bottom: 20px;
    }

    .detail-section {
        margin-bottom: 20px;
        padding: 15px;
        background: #f9f9f9;
        border-radius: 4px;
    }

    .detail-section h3 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 16px;
    }

    .detail-section p {
        margin: 5px 0;
        color: #666;
    }

    .items-list {
        margin-top: 10px;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: white;
        border-radius: 4px;
        margin-bottom: 8px;
        border: 1px solid #eee;
    }

    .item-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .item-name {
        font-weight: bold;
        color: #333;
    }

    .item-quantity, .item-price {
        font-size: 12px;
        color: #666;
    }

    .item-total {
        font-weight: bold;
        color: #2196F3;
    }

    .order-total-detail {
        font-size: 18px;
        color: #2196F3;
        text-align: center;
        padding: 10px;
        background: white;
        border-radius: 4px;
        border: 2px solid #2196F3;
    }

    .details-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
`;
document.head.appendChild(style);