// Gestor de Pedidos - Versión Actualizada v2.2 - 18 Sept 2025
// Última actualización: Debug detallado para toLocaleString error

console.log('🚀 [PEDIDOS.JS] ARCHIVO CARGADO - VERSION 2.6 - TIMESTAMP:', new Date().toLocaleTimeString());

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
                return !(order.estado === 'pagado' || order.estado === 'cancelado');
            });
            
            const excludedCount = allOrders.length - filteredOrders.length;
            if (excludedCount > 0) {
                console.log(`[PedidosManager] Excluyendo ${excludedCount} pedidos pagados/cancelados`);
            }
            
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
                    <button class="action-btn cancel" onclick="pedidosManager.cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                `;
                break;
            case 'entregado':
                actions = `
                    <button class="action-btn view" onclick="pedidosManager.viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="action-btn payment" onclick="pedidosManager.printBill('${order.id}')">
                        <i class="fas fa-receipt"></i>
                        Sacar Cuenta
                    </button>
                    <button class="action-btn cancel" onclick="pedidosManager.cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i>
                        Cancelar
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
            console.log('[PedidosManager] 📊 === ACTUALIZANDO ESTADÍSTICAS === v2.0 -', new Date().toLocaleTimeString());
            console.log('[PedidosManager] 📋 Total pedidos cargados:', this.orders.length);
            
            const stats = {
                total: this.orders.length,
                pendiente: this.orders.filter(o => o.estado === 'pendiente').length,
                preparando: this.orders.filter(o => o.estado === 'preparando').length,
                listo: this.orders.filter(o => o.estado === 'listo').length,
                entregado: this.orders.filter(o => o.estado === 'entregado').length
            };
            
            console.log('[PedidosManager] 📊 Estadísticas calculadas:', stats);
            
            // Calcular total de ingresos en proceso
            const totalRevenue = this.orders.reduce((sum, order) => sum + (order.total || 0), 0);
            console.log('[PedidosManager] 💰 Total en proceso:', totalRevenue);

            // Actualizar contadores en la UI solo si los elementos existen
            this.updateStatElement('totalOrders', stats.total);
            this.updateStatElement('pendingOrders', stats.pendiente);
            this.updateStatElement('totalRevenue', `$${totalRevenue.toLocaleString()}`);
            
            console.log('[PedidosManager] ✅ Estadísticas actualizadas exitosamente');

        } catch (error) {
            console.error('[PedidosManager] ❌ Error crítico actualizando estadísticas:', error);
            console.error('[PedidosManager] 📚 Stack trace:', error.stack);
        }
    }
    
    // Método auxiliar para actualizar elementos de estadísticas de forma segura
    updateStatElement(elementId, value) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`[PedidosManager] ✅ ${elementId} actualizado a:`, value);
            } else {
                console.warn(`[PedidosManager] ⚠️ Elemento ${elementId} no encontrado en DOM`);
            }
        } catch (error) {
            console.error(`[PedidosManager] ❌ Error actualizando ${elementId}:`, error);
        }
    }

    // Acciones de pedidos
    startOrder(orderId) {
        try {
            console.log('[PedidosManager] 🚀 INICIANDO PEDIDO');
            console.log('[PedidosManager] 📋 ID del pedido:', orderId, typeof orderId);
            console.log('[PedidosManager] 📊 Pedidos cargados:', this.orders.length);
            
            // Buscar el pedido
            const order = this.orders.find(o => o.id == orderId);
            console.log('[PedidosManager] 🔍 Pedido encontrado:', order);
            
            if (!order) {
                console.error('[PedidosManager] ❌ Pedido no encontrado en lista local');
                console.error('[PedidosManager] 📋 IDs disponibles:', this.orders.map(o => o.id));
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }
            
            console.log('[PedidosManager] 📦 Estado actual del pedido:', order.estado);
            console.log('[PedidosManager] 🔄 Cambiando estado a: preparando');
            
            this.updateOrderStatus(orderId, 'preparando');
            this.showNotification(`Pedido #${orderId} iniciado`, 'success');
            
            console.log('[PedidosManager] ✅ Pedido iniciado exitosamente');
            
        } catch (error) {
            console.error('[PedidosManager] ❌ Error crítico iniciando pedido:', error);
            console.error('[PedidosManager] 📚 Stack trace:', error.stack);
            this.showNotification('Error al iniciar pedido: ' + error.message, 'error');
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
            // Obtener el pedido para mostrar un mensaje apropiado
            const order = this.orders.find(o => o.id == orderId);
            if (!order) {
                console.error('[PedidosManager] Pedido no encontrado para cancelar:', orderId);
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            // Mensaje de confirmación específico según el estado
            let confirmMessage = '¿Estás seguro de que quieres cancelar este pedido?';
            if (order.estado === 'listo') {
                confirmMessage = 'Este pedido ya está listo para entregar. ¿Estás seguro de que quieres cancelarlo?';
            } else if (order.estado === 'entregado') {
                confirmMessage = 'Este pedido ya fue entregado. ¿Estás seguro de que quieres cancelarlo?';
            }

            if (confirm(confirmMessage)) {
                console.log('[PedidosManager] Cancelando pedido:', orderId);
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
            console.log('[PedidosManager] ⚡ === INICIO showBillModal v2.4 ===');
            console.log('[PedidosManager] ⚡ Iniciando showBillModal para pedido:', orderId);
            console.log('[PedidosManager] 📋 Órdenes disponibles:', this.orders.length);
            console.log('[PedidosManager] 🔍 Buscando pedido con ID:', orderId, typeof orderId);
            
            const order = this.orders.find(o => o.id == orderId);
            console.log('[PedidosManager] 📦 Pedido encontrado:', order);
            
            if (!order) {
                console.error('[PedidosManager] ❌ Pedido no encontrado:', orderId);
                console.error('[PedidosManager] 📊 IDs disponibles:', this.orders.map(o => o.id));
                this.showNotification('Pedido no encontrado', 'error');
                return;
            }

            // Validar estructura del pedido
            if (!this.validateOrderStructure(order)) {
                console.error('[PedidosManager] ❌ Estructura de pedido inválida:', order);
                this.showNotification('Error: Datos del pedido incompletos', 'error');
                return;
            }

            console.log('[PedidosManager] ✅ Pedido válido, generando contenido de factura');
            
            // Generar contenido de la factura
            const billContent = this.generateBillContent(order);
            console.log('[PedidosManager] 📄 Contenido de factura generado');
            
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
                        <button class="action-btn success" onclick="pedidosManager.showPaymentModal('${orderId}')">
                            <i class="fas fa-credit-card"></i> Pagar
                        </button>
                        <button class="action-btn" onclick="this.closest('.bill-modal').remove()">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            console.log('[PedidosManager] ✅ Modal de factura agregado al DOM');
            
        } catch (error) {
            console.error('[PedidosManager] ❌ Error crítico en showBillModal:', error);
            console.error('[PedidosManager] 📚 Stack trace:', error.stack);
            this.showNotification('Error al mostrar factura: ' + error.message, 'error');
        }
    }

    printBill(orderId) {
        try {
            console.log('[PedidosManager] 🖨️ Imprimiendo cuenta para pedido:', orderId);
            
            const order = this.orders.find(o => o.id == orderId);
            if (!order) {
                this.showNotification('No se encontró el pedido para imprimir', 'warning');
                return;
            }
            
            if (!order.items || order.items.length === 0) {
                this.showNotification('El pedido no tiene productos válidos para imprimir', 'warning');
                return;
            }

            // Calcular total si no existe
            if (!order.total) {
                order.total = order.items.reduce((sum, item) => sum + (item.subtotal || item.precio * item.cantidad || 0), 0);
            }

            // Crear ventana de impresión optimizada para 80mm
            const printWindow = window.open('', '_blank', 'width=300,height=700');
            const currentDate = new Date().toLocaleDateString('es-ES');
            const currentTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Cuenta Pedido #${orderId}</title>
                    <style>
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                        
                        body { 
                            font-family: 'Courier New', monospace; 
                            font-size: 11px; 
                            font-weight: bold;
                            margin: 0;
                            padding: 4mm;
                            line-height: 1.2;
                            width: 72mm;
                            color: #000;
                        }
                        
                        .header { 
                            text-align: center; 
                            margin-bottom: 12px; 
                            border-bottom: 1px dashed #000;
                            padding-bottom: 8px;
                        }
                        
                        .header h2 {
                            margin: 0 0 4px 0;
                            font-size: 14px;
                            font-weight: bold;
                        }
                        
                        .header p {
                            margin: 2px 0;
                            font-size: 10px;
                            font-weight: bold;
                        }
                        
                        .info-line {
                            display: flex;
                            justify-content: space-between;
                            margin: 3px 0;
                            font-size: 10px;
                            font-weight: bold;
                        }
                        
                        .separator {
                            border-top: 1px dashed #000;
                            margin: 8px 0;
                        }
                        
                        .item { 
                            margin: 6px 0; 
                            font-size: 10px;
                            font-weight: bold;
                            word-wrap: break-word;
                        }
                        
                        .item-line {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 2px;
                        }
                        
                        .item-name {
                            flex: 1;
                            margin-right: 8px;
                            font-weight: bold;
                            line-height: 1.1;
                        }
                        
                        .item-total {
                            white-space: nowrap;
                            font-weight: bold;
                            min-width: 20mm;
                            text-align: right;
                        }
                        
                        .item-details {
                            font-size: 9px;
                            color: #000;
                            font-weight: bold;
                            margin-left: 2px;
                            display: flex;
                            justify-content: space-between;
                        }
                        
                        .total { 
                            border-top: 2px solid #000; 
                            margin-top: 12px; 
                            padding-top: 8px; 
                            font-weight: bold; 
                        }
                        
                        .total-line {
                            display: flex;
                            justify-content: space-between;
                            font-size: 13px;
                            font-weight: bold;
                            margin: 4px 0;
                        }
                        
                        .footer {
                            text-align: center;
                            margin-top: 12px;
                            border-top: 1px dashed #000;
                            padding-top: 8px;
                            font-size: 9px;
                            font-weight: bold;
                            line-height: 1.3;
                        }
                        
                        @media print { 
                            body { 
                                margin: 0; 
                                padding: 2mm;
                            } 
                            button { display: none; }
                            .no-print { display: none; }
                        }
                        
                        @media screen {
                            body {
                                border: 1px solid #ccc;
                                background: white;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>CREPES & KAFFEE</h2>
                        <p>Restaurante y Cafetería</p>
                    </div>
                    
                    <div class="info-line">
                        <span>${order.mesa ? 'Mesa:' : 'Pedido:'}</span>
                        <span><strong>${order.mesa ? order.mesa : 'Directo'}</strong></span>
                    </div>
                    <div class="info-line">
                        <span>Pedido #:</span>
                        <span><strong>${orderId}</strong></span>
                    </div>
                    <div class="info-line">
                        <span>Fecha:</span>
                        <span>${currentDate}</span>
                    </div>
                    <div class="info-line">
                        <span>Hora:</span>
                        <span>${currentTime}</span>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="font-weight: bold; margin-bottom: 6px; font-size: 10px;">PRODUCTOS:</div>
                    
                    <div class="items">
                        ${order.items.map(item => `
                            <div class="item">
                                <div class="item-line">
                                    <span class="item-name">${item.quantity || item.cantidad}x ${item.productName || item.nombre}</span>
                                    <span class="item-total">$${(item.subtotal || 0).toLocaleString()}</span>
                                </div>
                                <div class="item-details">
                                    <span>@ $${(item.price || item.precio || 0).toLocaleString()} c/u</span>
                                    <span></span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="total">
                        <div class="total-line">
                            <span>TOTAL A PAGAR:</span>
                            <span>$${order.total.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>¡Gracias por su visita!</p>
                        <p>Vuelva pronto</p>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 15px;">
                        <button onclick="window.print()" style="
                            background: #2563eb;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                        ">🖨️ Imprimir</button>
                        <button onclick="window.close()" style="
                            background: #6b7280;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            margin-left: 8px;
                        ">❌ Cerrar</button>
                    </div>
                    
                    <script>
                        // Auto-imprimir después de cargar
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            
            // Esperar un momento y luego imprimir
            setTimeout(() => {
                printWindow.print();
            }, 250);
            
            this.showNotification('Cuenta enviada a impresión', 'success');
            
        } catch (error) {
            console.error('[PedidosManager] ❌ Error al imprimir cuenta:', error);
            this.showNotification('Error al imprimir la cuenta', 'error');
        }
    }

    // Nuevo método para validar estructura del pedido
    validateOrderStructure(order) {
        console.log('[PedidosManager] 🔍 Validando estructura del pedido:', order.id);
        
        if (!order) {
            console.error('[PedidosManager] ❌ Pedido es null o undefined');
            return false;
        }
        
        if (!order.id) {
            console.error('[PedidosManager] ❌ Pedido sin ID');
            return false;
        }
        
        if (!order.items || !Array.isArray(order.items)) {
            console.error('[PedidosManager] ❌ Pedido sin items o items no es array:', order.items);
            return false;
        }
        
        if (order.items.length === 0) {
            console.error('[PedidosManager] ❌ Pedido con array de items vacío');
            return false;
        }
        
        // Validar cada item
        for (let i = 0; i < order.items.length; i++) {
            const item = order.items[i];
            console.log('[PedidosManager] 🔍 Validando item', i, ':', item);
            
            if (!item) {
                console.error('[PedidosManager] ❌ Item null en posición:', i);
                return false;
            }
            
            // Verificar nombre del producto de forma flexible
            const productName = item.productName || item.name || item.nombre;
            if (!productName) {
                console.error('[PedidosManager] ❌ Item sin nombre de producto en posición:', i, item);
                return false;
            }
            
            // Verificar cantidad de forma flexible
            const quantity = item.quantity || item.cantidad || item.qty;
            if (typeof quantity !== 'number' || quantity <= 0) {
                console.error('[PedidosManager] ❌ Item con quantity inválida en posición:', i, 'quantity:', quantity, 'type:', typeof quantity, item);
                return false;
            }
            
            // Verificar precio de forma flexible
            const price = item.price || item.precio || item.unitPrice;
            if (typeof price !== 'number' || price < 0) {
                console.error('[PedidosManager] ❌ Item con price inválido en posición:', i, 'price:', price, 'type:', typeof price, item);
                // En lugar de fallar, intentemos normalizar el item
                console.log('[PedidosManager] 🔧 Intentando normalizar item con precio inválido...');
            }
            
            // Verificar subtotal de forma flexible
            const subtotal = item.subtotal || item.total || (price * quantity);
            if (typeof subtotal !== 'number' || subtotal < 0) {
                console.error('[PedidosManager] ❌ Item con subtotal inválido en posición:', i, 'subtotal:', subtotal, 'type:', typeof subtotal, item);
                // En lugar de fallar, intentemos normalizar el item
                console.log('[PedidosManager] 🔧 Intentando normalizar item con subtotal inválido...');
            }
        }
        
        console.log('[PedidosManager] ✅ Validación de estructura completada - procediendo con normalización automática');
        return true;
    }

    generateBillContent(order) {
        try {
            console.log('[PedidosManager] 📋 Generando contenido de factura para pedido:', order.id);
            console.log('[PedidosManager] 📦 Datos del pedido:', order);
            
            // Validación adicional de datos
            if (!order || !order.items || !Array.isArray(order.items)) {
                console.error('[PedidosManager] ❌ Datos de pedido inválidos para generar factura');
                return '<p>Error: Datos del pedido no válidos</p>';
            }
            
            console.log('[PedidosManager] 🛍️ Procesando', order.items.length, 'items');
            
            const itemsHtml = order.items.map((item, index) => {
                console.log('[PedidosManager] 📝 Procesando item', index + 1, ':', item);
                console.log('[PedidosManager] 🔍 Tipos de datos en item:', {
                    productName: typeof item.productName,
                    name: typeof item.name,
                    quantity: typeof item.quantity,
                    qty: typeof item.qty,
                    price: typeof item.price,
                    subtotal: typeof item.subtotal
                });
                
                // Validar cada campo del item con valores por defecto seguros
                const productName = item.productName || item.name || 'Producto sin nombre';
                const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : (
                    typeof item.qty === 'number' && !isNaN(item.qty) ? item.qty : 1
                );
                const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                const subtotal = typeof item.subtotal === 'number' && !isNaN(item.subtotal) ? item.subtotal : (price * quantity);
                
                console.log('[PedidosManager] ✅ Item procesado:', {
                    productName, quantity, price, subtotal
                });
                
                console.log('[PedidosManager] 🧮 Llamando toLocaleString en price:', price, 'type:', typeof price);
                console.log('[PedidosManager] 🧮 Llamando toLocaleString en subtotal:', subtotal, 'type:', typeof subtotal);
                
                try {
                    const priceFormatted = (price || 0).toLocaleString();
                    const subtotalFormatted = (subtotal || 0).toLocaleString();
                    
                    return `
                        <tr>
                            <td>${productName}</td>
                            <td>${quantity}</td>
                            <td>$${priceFormatted}</td>
                            <td>$${subtotalFormatted}</td>
                        </tr>
                    `;
                } catch (error) {
                    console.error('[PedidosManager] ❌ Error en toLocaleString para item:', index, error);
                    console.error('[PedidosManager] 📋 Datos problemáticos:', { price, subtotal, item });
                    
                    // Fallback seguro
                    return `
                        <tr>
                            <td>${productName}</td>
                            <td>${quantity}</td>
                            <td>$${price || 0}</td>
                            <td>$${subtotal || 0}</td>
                        </tr>
                    `;
                }
            }).join('');
            
            // Validar campos del pedido
            const mesa = order.mesa || order.table || 'Para llevar';
            const hora = order.hora || order.time || order.timestamp || 'No especificada';
            const tipo = this.getOrderTypeLabel(order.tipo || order.type || 'unknown');
            const total = typeof order.total === 'number' ? order.total : 0;
            
            console.log('[PedidosManager] 📊 Información del pedido:', {
                mesa, hora, tipo, total
            });

            const billContent = `
                <div class="bill-info">
                    <p><strong>Mesa:</strong> ${mesa}</p>
                    <p><strong>Hora:</strong> ${hora}</p>
                    <p><strong>Tipo:</strong> ${tipo}</p>
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
                            <td><strong>$${(total || 0).toLocaleString()}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            `;
            
            console.log('[PedidosManager] ✅ Contenido de factura generado exitosamente');
            return billContent;
            
        } catch (error) {
            console.error('[PedidosManager] ❌ Error generando contenido de factura:', error);
            console.error('[PedidosManager] 📚 Stack trace:', error.stack);
            return `
                <div class="error-message">
                    <p>❌ Error generando factura</p>
                    <p>Detalles: ${error.message}</p>
                </div>
            `;
        }
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

    showPaymentModal(orderId) {
        try {
            console.log('[PedidosManager] 💳 Mostrando modal de pago para pedido:', orderId);
            
            const order = this.orders.find(o => o.id == orderId);
            if (!order) {
                this.showNotification('No se encontró el pedido para procesar el pago', 'warning');
                return;
            }

            // Normalizar datos del pedido usando la misma función que en factura
            const normalizedOrder = {
                id: order.id,
                items: order.items.map(item => ({
                    productName: item.productName || item.name || 'Producto sin nombre',
                    quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : (
                        typeof item.qty === 'number' && !isNaN(item.qty) ? item.qty : 1
                    ),
                    price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : (
                        typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) ? item.unitPrice : 0
                    ),
                    subtotal: typeof item.subtotal === 'number' && !isNaN(item.subtotal) ? item.subtotal : (
                        (item.price || item.unitPrice || 0) * (item.quantity || item.qty || 1)
                    )
                })),
                total: typeof order.total === 'number' ? order.total : 0,
                mesa: order.mesa || 'Para llevar',
                fecha: order.fecha || new Date().toLocaleDateString(),
                hora: order.hora || new Date().toLocaleTimeString()
            };
            
            if (!normalizedOrder.items || normalizedOrder.items.length === 0) {
                this.showNotification('El pedido no tiene productos válidos para procesar el pago', 'warning');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'payment-modal';
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
                    padding: 0;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                ">
                    <!-- Header -->
                    <div class="payment-header" style="
                        background: #ff6b35;
                        color: white;
                        padding: 20px 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h2 style="margin: 0; font-size: 24px;">Procesar Pago</h2>
                            <p style="margin: 5px 0 0 0; opacity: 0.9;">${normalizedOrder.mesa} - Pedido #${normalizedOrder.id}</p>
                        </div>
                        <button class="close-modal" style="
                            background: rgba(255, 255, 255, 0.2);
                            border: none;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            color: white;
                            font-size: 20px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">&times;</button>
                    </div>

                    <!-- Content -->
                    <div style="display: flex; flex: 1; overflow: hidden;">
                        <!-- Left Panel - Payment Info -->
                        <div style="
                            flex: 1;
                            padding: 24px;
                            border-right: 1px solid #e5e7eb;
                            overflow-y: auto;
                        ">
                            <h3 style="margin: 0 0 20px 0; color: #1f2937;">Información de Pago</h3>
                            
                            <!-- Total a Pagar -->
                            <div style="
                                background: #fee2e2;
                                border: 1px solid #fca5a5;
                                padding: 20px;
                                border-radius: 12px;
                                margin-bottom: 24px;
                                text-align: center;
                            ">
                                <p style="margin: 0 0 8px 0; color: #7f1d1d; font-weight: 600;">Total a Pagar</p>
                                <div style="font-size: 32px; font-weight: bold; color: #dc2626;">
                                    $${(normalizedOrder.total || 0).toLocaleString()}
                                </div>
                            </div>

                            <!-- Método de Pago -->
                            <div style="margin-bottom: 24px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                                    Método de Pago:
                                </label>
                                <select id="paymentMethod" style="
                                    width: 100%;
                                    padding: 12px;
                                    border: 2px solid #d1d5db;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    background: white;
                                ">
                                    <option value="">Seleccionar método</option>
                                    <option value="efectivo">💵 Efectivo</option>
                                    <option value="tarjeta">💳 Tarjeta (Débito/Crédito)</option>
                                    <option value="transferencia">🏦 Transferencia Bancaria</option>
                                    <option value="mixto">🔄 Pago Mixto</option>
                                </select>
                            </div>

                            <!-- Campos de Efectivo -->
                            <div id="cashFields" style="display: none;">
                                <div style="margin-bottom: 16px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                                        Dinero Recibido:
                                    </label>
                                    <input type="number" id="receivedAmount" placeholder="0" style="
                                        width: 100%;
                                        padding: 12px;
                                        border: 2px solid #d1d5db;
                                        border-radius: 8px;
                                        font-size: 18px;
                                        text-align: right;
                                    " step="1" min="0">
                                </div>
                                
                                <div style="
                                    background: #f0fdf4;
                                    border: 1px solid #bbf7d0;
                                    padding: 16px;
                                    border-radius: 8px;
                                    margin-bottom: 16px;
                                ">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="color: #166534; font-weight: 500;">Total a Pagar:</span>
                                        <span style="color: #166534; font-weight: bold;">$${(normalizedOrder.total || 0).toLocaleString()}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="color: #166534; font-weight: 500;">Dinero Recibido:</span>
                                        <span style="color: #166534; font-weight: bold;" id="displayReceived">$0</span>
                                    </div>
                                    <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 12px 0;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #166534; font-weight: 600; font-size: 18px;">Cambio a Devolver:</span>
                                        <span style="color: #166534; font-weight: bold; font-size: 20px;" id="changeAmount">$0</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Campos de Pago Mixto -->
                            <div id="mixedFields" style="display: none;">
                                <div style="margin-bottom: 16px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                                        Efectivo:
                                    </label>
                                    <input type="number" id="cashPart" placeholder="0" style="
                                        width: 100%;
                                        padding: 12px;
                                        border: 2px solid #d1d5db;
                                        border-radius: 8px;
                                        font-size: 16px;
                                        text-align: right;
                                    " step="1" min="0">
                                </div>
                                <div style="margin-bottom: 16px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                                        Tarjeta/Transferencia:
                                    </label>
                                    <input type="number" id="cardPart" placeholder="0" style="
                                        width: 100%;
                                        padding: 12px;
                                        border: 2px solid #d1d5db;
                                        border-radius: 8px;
                                        font-size: 16px;
                                        text-align: right;
                                    " step="1" min="0">
                                </div>
                                <div style="
                                    background: #fef3c7;
                                    border: 1px solid #fcd34d;
                                    padding: 12px;
                                    border-radius: 8px;
                                    text-align: center;
                                ">
                                    <span style="color: #92400e; font-weight: 500;">Total Parcial: </span>
                                    <span style="color: #92400e; font-weight: bold;" id="mixedTotal">$0</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right Panel - Order Summary -->
                        <div style="
                            flex: 1;
                            padding: 24px;
                            overflow-y: auto;
                            background: #f9fafb;
                        ">
                            <h3 style="margin: 0 0 20px 0; color: #1f2937;">Resumen del Pedido</h3>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 4px 0; color: #6b7280;"><strong>Fecha:</strong> ${normalizedOrder.fecha}</p>
                                <p style="margin: 4px 0; color: #6b7280;"><strong>Hora:</strong> ${normalizedOrder.hora}</p>
                                <p style="margin: 4px 0; color: #6b7280;"><strong>Mesa:</strong> ${normalizedOrder.mesa}</p>
                            </div>

                            <div class="order-items" style="margin-bottom: 20px;">
                                ${normalizedOrder.items.map(item => `
                                    <div style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        padding: 8px 0;
                                        border-bottom: 1px solid #e5e7eb;
                                    ">
                                        <div>
                                            <div style="font-weight: 500; color: #1f2937; font-size: 14px;">${item.productName}</div>
                                            <div style="color: #6b7280; font-size: 12px;">Cantidad: ${item.quantity}</div>
                                        </div>
                                        <div style="font-weight: 600; color: #1f2937; font-size: 14px;">$${(item.subtotal || 0).toLocaleString()}</div>
                                    </div>
                                `).join('')}
                            </div>

                            <div style="
                                background: white;
                                padding: 16px;
                                border-radius: 8px;
                                border: 1px solid #e5e7eb;
                            ">
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    font-size: 18px;
                                    font-weight: 700;
                                    color: #1f2937;
                                ">
                                    <span>TOTAL:</span>
                                    <span style="color: #dc2626;">$${(normalizedOrder.total || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="
                        padding: 16px 24px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        gap: 12px;
                        justify-content: space-between;
                        background: #f9fafb;
                    ">
                        <button onclick="this.closest('.payment-modal').remove()" style="
                            padding: 12px 24px;
                            background: #6b7280;
                            border: 1px solid #6b7280;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">
                            Cancelar
                        </button>
                        <button id="processPaymentBtn" onclick="pedidosManager.processPayment('${orderId}')" style="
                            padding: 12px 24px;
                            background: #10b981;
                            border: 1px solid #10b981;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                            opacity: 0.5;
                        " disabled>
                            ${window.auth && window.auth.isCashSessionActive() ? 'Procesar Pago' : '<i class="fas fa-lock"></i> Caja Cerrada'}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });

            // Setup payment method logic
            this.setupPaymentModalLogic(modal, normalizedOrder);

            console.log('[PedidosManager] ✅ Modal de pago mostrado exitosamente');

        } catch (error) {
            console.error('[PedidosManager] ❌ Error mostrando modal de pago:', error);
            this.showNotification('Error al mostrar modal de pago', 'error');
        }
    }

    setupPaymentModalLogic(modal, order) {
        const paymentMethodSelect = modal.querySelector('#paymentMethod');
        const cashFields = modal.querySelector('#cashFields');
        const mixedFields = modal.querySelector('#mixedFields');
        const processBtn = modal.querySelector('#processPaymentBtn');
        
        // Logic for payment method changes
        paymentMethodSelect.addEventListener('change', () => {
            const method = paymentMethodSelect.value;
            
            cashFields.style.display = method === 'efectivo' ? 'block' : 'none';
            mixedFields.style.display = method === 'mixto' ? 'block' : 'none';
            
            if (method && window.auth && window.auth.isCashSessionActive()) {
                processBtn.disabled = false;
                processBtn.style.opacity = '1';
            } else {
                processBtn.disabled = true;
                processBtn.style.opacity = '0.5';
            }
        });

        // Cash calculation logic
        const receivedInput = modal.querySelector('#receivedAmount');
        if (receivedInput) {
            receivedInput.addEventListener('input', () => {
                const received = parseFloat(receivedInput.value) || 0;
                const total = order.total || 0;
                const change = Math.max(0, received - total);
                
                modal.querySelector('#displayReceived').textContent = `$${received.toLocaleString()}`;
                modal.querySelector('#changeAmount').textContent = `$${change.toLocaleString()}`;
            });
        }

        // Mixed payment logic
        const cashPart = modal.querySelector('#cashPart');
        const cardPart = modal.querySelector('#cardPart');
        if (cashPart && cardPart) {
            const updateMixedTotal = () => {
                const cash = parseFloat(cashPart.value) || 0;
                const card = parseFloat(cardPart.value) || 0;
                const total = cash + card;
                
                modal.querySelector('#mixedTotal').textContent = `$${total.toLocaleString()}`;
            };
            
            cashPart.addEventListener('input', updateMixedTotal);
            cardPart.addEventListener('input', updateMixedTotal);
        }
    }

    processPayment(orderId) {
        try {
            console.log('[PedidosManager] 💳 Procesando pago para pedido:', orderId);
            
            // Verificar que la caja esté abierta antes de permitir procesar pagos
            if (!window.auth || !window.auth.isCashSessionActive()) {
                if (window.auth && window.auth.showCashClosedNotification) {
                    window.auth.showCashClosedNotification('procesar pagos');
                } else {
                    this.showNotification('La caja debe estar abierta para procesar pagos', 'error');
                }
                // Cerrar modal si está abierto
                const modal = document.querySelector('.payment-modal');
                if (modal) {
                    modal.remove();
                }
                return;
            }

            const modal = document.querySelector('.payment-modal');
            if (!modal) {
                this.showNotification('Modal de pago no encontrado', 'error');
                return;
            }

            const paymentMethodSelect = modal.querySelector('#paymentMethod');
            const receivedInput = modal.querySelector('#receivedAmount');
            const cashPart = modal.querySelector('#cashPart');
            const cardPart = modal.querySelector('#cardPart');

            const paymentMethod = paymentMethodSelect?.value;
            if (!paymentMethod) {
                this.showNotification('Selecciona un método de pago', 'warning');
                return;
            }

            const order = this.orders.find(o => o.id == orderId);
            if (!order) {
                this.showNotification('No se encontró el pedido', 'error');
                return;
            }

            // Calcular total si no existe
            if (!order.total) {
                order.total = order.items.reduce((sum, item) => sum + (item.subtotal || item.precio * item.cantidad || 0), 0);
            }

            let paymentData = {
                method: paymentMethod,
                total: order.total
            };

            // Validaciones específicas por método de pago
            if (paymentMethod === 'efectivo') {
                const received = parseFloat(receivedInput?.value) || 0;
                if (received < order.total) {
                    this.showNotification('El dinero recibido es insuficiente', 'error');
                    return;
                }
                paymentData.received = received;
                paymentData.change = received - order.total;
            } else if (paymentMethod === 'mixto') {
                const cash = parseFloat(cashPart?.value) || 0;
                const card = parseFloat(cardPart?.value) || 0;
                const total = cash + card;
                
                if (total < order.total) {
                    this.showNotification('El total del pago mixto es insuficiente', 'error');
                    return;
                } else if (Math.abs(total - order.total) > 0.01) { // Tolerancia para decimales
                    this.showNotification('El total del pago mixto debe ser igual al monto a pagar', 'error');
                    return;
                }
                
                paymentData.cashAmount = cash;
                paymentData.cardAmount = card;
            }

            // Actualizar pedido
            order.estado = 'pagado';
            order.metodoPago = paymentMethod;
            order.fechaPago = new Date().toISOString();
            order.paymentData = paymentData;

            // Guardar pedido actualizado
            this.db.saveOrder(order);

            // Crear registro de venta
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const sale = {
                id: Date.now(),
                orderId: order.id,
                mesa: order.mesa || 'Pedido Directo',
                items: order.items,
                total: order.total,
                metodoPago: paymentMethod,
                fecha: new Date().toISOString(),
                fechaFormateada: new Date().toLocaleDateString('es-ES'),
                hora: new Date().toLocaleTimeString('es-ES'),
                cajero: currentUser.name || 'Sistema',
                timestamp: new Date().toISOString(),
                paymentData: paymentData
            };
            
            console.log('[PedidosManager] 💾 Registrando venta:', sale);
            this.db.saveSale(sale);

            // Si el pedido tenía una mesa asignada, marcarla para limpieza
            if (order.mesa) {
                console.log('[PedidosManager] Marcando mesa para limpieza:', order.mesa);
                this.markTableForCleanup(order.mesa, orderId);
            }

            // Cerrar modal
            modal.remove();

            // Actualizar vista
            this.loadOrders();
            this.updateStats();
            
            // Mostrar notificación de éxito
            let successMessage = `Pago procesado exitosamente - Pedido #${orderId} - $${order.total.toLocaleString()}`;
            if (paymentMethod === 'efectivo' && paymentData.change > 0) {
                successMessage += ` (Cambio: $${paymentData.change.toLocaleString()})`;
            }
            this.showNotification(successMessage, 'success');
            
        } catch (error) {
            console.error('[PedidosManager] ❌ Error procesando pago:', error);
            this.showNotification('Error al procesar el pago', 'error');
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
                <div class="details-modal-content" style="
                    background: white;
                    border-radius: 16px;
                    padding: 0;
                    max-width: 800px;
                    width: 95%;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                ">
                    <!-- Header -->
                    <div class="details-header" style="
                        padding: 20px;
                        border-bottom: 2px solid #f3f4f6;
                        background: linear-gradient(135deg, #ff6b35, #ff8a65);
                        border-radius: 16px 16px 0 0;
                        color: white;
                        text-align: center;
                        position: relative;
                    ">
                        <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: bold;">
                            📋 Detalles del Pedido #${order.id}
                        </h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 12px;">
                            ${new Date().toLocaleDateString('es-ES')} • ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <button onclick="this.closest('.details-modal').remove()" style="
                            position: absolute;
                            top: 12px;
                            right: 12px;
                            background: #dc2626;
                            border: none;
                            border-radius: 50%;
                            width: 28px;
                            height: 28px;
                            color: white;
                            font-size: 16px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
                            ✕
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 24px; flex: 1; overflow-y: auto;">
                        <!-- Información General -->
                        <div class="detail-section" style="margin-bottom: 24px;">
                            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #ff6b35; padding-bottom: 8px;">
                                📊 Información General
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #ff6b35;">
                                    <strong style="color: #374151;">Estado:</strong><br>
                                    <span class="status-badge" style="
                                        display: inline-block;
                                        padding: 4px 12px;
                                        border-radius: 20px;
                                        font-size: 12px;
                                        font-weight: bold;
                                        margin-top: 4px;
                                        ${order.estado === 'pendiente' ? 'background: #fef3c7; color: #92400e;' : 
                                          order.estado === 'en-preparacion' ? 'background: #dbeafe; color: #1e40af;' : 
                                          order.estado === 'listo' ? 'background: #d1fae5; color: #065f46;' : 
                                          order.estado === 'pagado' ? 'background: #e0e7ff; color: #3730a3;' : 
                                          'background: #fee2e2; color: #991b1b;'}
                                    ">${this.getStatusLabel(order.estado)}</span>
                                </div>
                                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
                                    <strong style="color: #374151;">Mesa:</strong><br>
                                    <span style="color: #059669; font-weight: 600; font-size: 16px;">${order.mesa || 'Pedido Directo'}</span>
                                </div>
                                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                    <strong style="color: #374151;">Tipo:</strong><br>
                                    <span style="color: #2563eb; font-weight: 600;">${this.getOrderTypeLabel(order.tipo || 'dine-in')}</span>
                                </div>
                                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                                    <strong style="color: #374151;">Hora:</strong><br>
                                    <span style="color: #7c3aed; font-weight: 600;">${order.hora || 'N/A'}</span>
                                </div>
                                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                    <strong style="color: #374151;">Tiempo:</strong><br>
                                    <span style="color: #d97706; font-weight: 600;">${this.getTimeElapsed(order.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Productos -->
                        <div class="detail-section" style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; border-bottom: 2px solid #ff6b35; padding-bottom: 6px;">
                                🍽️ Productos (${(order.items || []).length})
                            </h3>
                            <div class="items-list">
                                ${(order.items || []).map((item, index) => `
                                    <div style="
                                        background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};
                                        border: 1px solid #e5e7eb;
                                        border-radius: 10px;
                                        padding: 16px;
                                        margin-bottom: 12px;
                                        transition: all 0.2s;
                                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                                    ">
                                        <!-- Nombre del producto con cantidad -->
                                        <div style="
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                            margin-bottom: 12px;
                                        ">
                                            <div style="
                                                font-weight: 700;
                                                color: #1f2937;
                                                font-size: 16px;
                                                display: flex;
                                                align-items: center;
                                                gap: 8px;
                                            ">
                                                <span style="
                                                    background: #ff6b35;
                                                    color: white;
                                                    border-radius: 50%;
                                                    width: 24px;
                                                    height: 24px;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    font-size: 12px;
                                                    font-weight: bold;
                                                ">${item.quantity || 1}</span>
                                                ${item.productName || 'Producto'}
                                            </div>
                                            <div style="
                                                font-size: 18px;
                                                font-weight: bold;
                                                color: #ff6b35;
                                                background: #fff7ed;
                                                padding: 8px 16px;
                                                border-radius: 8px;
                                                border: 2px solid #fed7aa;
                                            ">
                                                $${(item.subtotal || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        
                                        <!-- Detalles de precio -->
                                        <div style="
                                            display: grid;
                                            grid-template-columns: 1fr 1fr 1fr;
                                            gap: 12px;
                                            background: #f8fafc;
                                            padding: 12px;
                                            border-radius: 8px;
                                            border: 1px solid #e2e8f0;
                                        ">
                                            <div style="text-align: center;">
                                                <div style="
                                                    font-size: 12px;
                                                    color: #64748b;
                                                    font-weight: 500;
                                                    margin-bottom: 4px;
                                                ">Precio Unitario</div>
                                                <div style="
                                                    font-size: 16px;
                                                    font-weight: bold;
                                                    color: #059669;
                                                    background: #ecfdf5;
                                                    padding: 6px 12px;
                                                    border-radius: 6px;
                                                    border: 1px solid #a7f3d0;
                                                ">
                                                    $${((item.price || item.precio) || 0).toLocaleString()}
                                                </div>
                                            </div>
                                            <div style="text-align: center;">
                                                <div style="
                                                    font-size: 12px;
                                                    color: #64748b;
                                                    font-weight: 500;
                                                    margin-bottom: 4px;
                                                ">Cantidad</div>
                                                <div style="
                                                    font-size: 16px;
                                                    font-weight: bold;
                                                    color: #2563eb;
                                                    background: #eff6ff;
                                                    padding: 6px 12px;
                                                    border-radius: 6px;
                                                    border: 1px solid #93c5fd;
                                                ">
                                                    ${item.quantity || 1} un.
                                                </div>
                                            </div>
                                            <div style="text-align: center;">
                                                <div style="
                                                    font-size: 12px;
                                                    color: #64748b;
                                                    font-weight: 500;
                                                    margin-bottom: 4px;
                                                ">Operación</div>
                                                <div style="
                                                    font-size: 14px;
                                                    font-weight: 600;
                                                    color: #7c3aed;
                                                    background: #f3f4f6;
                                                    padding: 6px 8px;
                                                    border-radius: 6px;
                                                    border: 1px solid #d1d5db;
                                                ">
                                                    ${item.quantity || 1} × $${((item.price || item.precio) || 0).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Total del Pedido -->
                        <div class="detail-section" style="
                            background: linear-gradient(135deg, #ff6b35, #ff8a65);
                            padding: 16px;
                            border-radius: 10px;
                            text-align: center;
                            color: white;
                            margin-bottom: 12px;
                        ">
                            <h3 style="margin: 0 0 8px 0; font-size: 16px; opacity: 0.9;">
                                💸 Total del Pedido
                            </h3>
                            <div style="
                                font-size: 26px;
                                font-weight: bold;
                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            ">
                                $${(order.total || 0).toLocaleString()}
                            </div>
                        </div>
                        
                        ${order.pedidoAnteriorId ? `
                            <div style="
                                background: #fef3c7;
                                border: 1px solid #f59e0b;
                                border-radius: 8px;
                                padding: 12px;
                                text-align: center;
                            ">
                                <p style="margin: 0; color: #92400e; font-weight: 600;">
                                    ⚠️ Este pedido reemplazó al pedido #${order.pedidoAnteriorId}
                                </p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Footer -->
                    <div class="details-footer" style="
                        padding: 20px;
                        border-top: 2px solid #f3f4f6;
                        text-align: center;
                        background: #f9fafb;
                        border-radius: 0 0 16px 16px;
                    ">
                        <button onclick="this.closest('.details-modal').remove()" style="
                            background: #dc2626;
                            color: white;
                            border: none;
                            padding: 12px 32px;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
                        " onmouseover="this.style.background='#b91c1c'; this.style.transform='translateY(-2px)'" 
                           onmouseout="this.style.background='#dc2626'; this.style.transform='translateY(0)'">
                            🚪 Cerrar Detalles
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);

            // Cerrar modal al hacer clic fuera
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
        } catch (error) {
            console.error('[PedidosManager] Error mostrando detalles:', error);
            this.showNotification('Error al mostrar detalles', 'error');
        }
    }

    updateOrderStatus(orderId, newStatus) {
        try {
            console.log('[PedidosManager] 🔄 ACTUALIZANDO ESTADO DE PEDIDO');
            console.log('[PedidosManager] 📋 ID del pedido:', orderId, typeof orderId);
            console.log('[PedidosManager] 🏷️ Nuevo estado:', newStatus);
            
            // Obtener todos los pedidos desde la base de datos
            const allOrders = this.db.getOrders();
            console.log('[PedidosManager] 📊 Total pedidos en BD:', allOrders.length);
            
            const orderIndex = allOrders.findIndex(o => {
                console.log('[PedidosManager] 🔍 Comparando:', o.id, 'con', orderId, '==', o.id == orderId);
                return o.id == orderId;
            });
            
            console.log('[PedidosManager] 📍 Índice encontrado:', orderIndex);
            
            if (orderIndex === -1) {
                console.error('[PedidosManager] ❌ Pedido no encontrado en base de datos');
                console.error('[PedidosManager] 📋 IDs disponibles en BD:', allOrders.map(o => o.id));
                throw new Error('Pedido no encontrado');
            }
            
            console.log('[PedidosManager] 📦 Pedido antes de actualizar:', allOrders[orderIndex]);
            
            // Actualizar estado
            const oldStatus = allOrders[orderIndex].estado;
            allOrders[orderIndex].estado = newStatus;
            
            console.log('[PedidosManager] 🔄 Estado cambiado de:', oldStatus, 'a:', newStatus);
            
            // Si se marca como pagado, agregar fecha de pago
            if (newStatus === 'pagado') {
                allOrders[orderIndex].fechaPago = new Date().toISOString();
                console.log('[PedidosManager] 💳 Fecha de pago agregada:', allOrders[orderIndex].fechaPago);
            }
            
            console.log('[PedidosManager] 📦 Pedido después de actualizar:', allOrders[orderIndex]);
            
            // Guardar en localStorage
            localStorage.setItem('pos_orders', JSON.stringify(allOrders));
            console.log('[PedidosManager] 💾 Pedidos guardados en localStorage');
            
            // Recargar pedidos
            this.loadOrders();
            this.updateStats();
            console.log('[PedidosManager] 🔄 Pedidos recargados y stats actualizadas');
            
            // Notificar a otras pestañas
            this.triggerStorageUpdate();
            console.log('[PedidosManager] 📡 Notificación enviada a otras pestañas');
            
            console.log('[PedidosManager] ✅ Pedido actualizado exitosamente');
            
        } catch (error) {
            console.error('[PedidosManager] ❌ Error crítico actualizando estado:', error);
            console.error('[PedidosManager] 📚 Stack trace:', error.stack);
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

// Función global para editar pedidos desde cualquier lugar
function editOrder(orderId) {
    try {
        console.log('Editando pedido global:', orderId);
        
        // Cerrar cualquier modal abierto
        const modals = document.querySelectorAll('.details-modal, .order-detail-modal');
        modals.forEach(modal => modal.remove());
        
        // Redirigir a la página de ventas con el parámetro de edición
        window.location.href = `ventas.html?editOrder=${orderId}`;
        
    } catch (error) {
        console.error('Error en editOrder global:', error);
        alert('Error al editar pedido: ' + error.message);
    }
}

// Función global para procesar pago desde el modal
function processPayment(orderId, amount) {
    try {
        if (window.pedidosManager) {
            window.pedidosManager.processPayment(orderId, amount);
        } else {
            alert('Error: Sistema de pedidos no disponible');
        }
    } catch (error) {
        console.error('Error en processPayment global:', error);
        alert('Error al procesar pago: ' + error.message);
    }
}

// Función global para imprimir cuenta desde el modal
function printBill(orderId) {
    try {
        if (window.pedidosManager) {
            window.pedidosManager.printBill(orderId);
        } else {
            alert('Error: Sistema de pedidos no disponible');
        }
    } catch (error) {
        console.error('Error en printBill global:', error);
        alert('Error al imprimir cuenta: ' + error.message);
    }
}

// Función global para cerrar modales
function closeModal() {
    try {
        const modals = document.querySelectorAll('.details-modal, .order-detail-modal');
        modals.forEach(modal => modal.remove());
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
}