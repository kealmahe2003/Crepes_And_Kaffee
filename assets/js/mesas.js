// Gestor de Mesas
class MesasManager {
    constructor() {
        // Validar dependencias
        if (typeof Database === 'undefined') {
            throw new Error('Database class is required but not found');
        }
        
        this.db = new Database();
        this.tables = [];
        this.init();
    }

    init() {
        this.loadTables();
        this.bindEvents();
        this.updateStats();
        this.startAutoRefresh();
        this.checkForUpdatedOrder();
    }

    checkForUpdatedOrder() {
        // Verificar si se regresa de una edición de pedido
        const urlParams = new URLSearchParams(window.location.search);
        const updated = urlParams.get('updated');
        
        if (updated) {
            // Limpiar la URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Forzar recarga inmediata
            setTimeout(() => {
                this.loadTables();
                this.updateStats();
                this.showNotification('Pedido actualizado correctamente', 'success');
            }, 500);
        }
    }

    bindEvents() {
        // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadTables();
                this.updateStats();
                this.showNotification('Mesas actualizadas', 'success');
            });
        }
    }

    startAutoRefresh() {
        // Refrescar mesas cada 30 segundos
        setInterval(() => {
            this.loadTables();
            this.updateStats();
        }, 30000);
    }

    loadTables() {
        try {
            this.tables = this.db.getTables();
            this.displayTables();
        } catch (error) {
            console.error('Error al cargar mesas:', error);
            this.showNotification('Error al cargar mesas', 'error');
        }
    }

    displayTables() {
        const container = document.getElementById('tablesGrid');
        const emptyState = document.getElementById('emptyTables');
        
        if (!container) {
            console.error('Contenedor tablesGrid no encontrado');
            return;
        }

        if (this.tables.length === 0) {
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

        container.innerHTML = this.tables.map(table => this.createTableCard(table)).join('');
        this.updateFilterCounts();
    }

    createTableCard(table) {
        const statusClass = this.getStatusClass(table.estado);
        const order = this.getTableOrder(table.numero);
        
        return `
            <div class="table-card ${statusClass}" data-table-id="${table.id}">
                <div class="table-header">
                    <div class="table-number">
                        <i class="fas fa-chair"></i>
                        Mesa ${table.numero}
                    </div>
                    <div class="table-status">
                        <span class="status-badge status-${table.estado}">
                            ${this.getStatusLabel(table.estado)}
                        </span>
                    </div>
                </div>

                <div class="table-details">
                    ${table.capacidad ? `
                        <div class="table-capacity">
                            <i class="fas fa-users"></i>
                            Capacidad: ${table.capacidad} personas
                        </div>
                    ` : ''}
                    
                    ${order ? `
                        <div class="table-order-info">
                            <div class="order-summary">
                                <strong>Pedido #${order.id}</strong>
                                <div class="order-meta">
                                    <span class="order-time">${order.hora}</span>
                                    <span class="order-total">$${order.total.toLocaleString()}</span>
                                </div>
                                <div class="order-status">
                                    Estado: ${this.getOrderStatusLabel(order.estado)}
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="table-empty">
                            <i class="fas fa-utensils"></i>
                            Mesa disponible
                        </div>
                    `}
                </div>

                <div class="table-actions">
                    ${this.getTableActions(table, order)}
                </div>
            </div>
        `;
    }

    getTableOrder(tableNumber) {
        const orders = this.db.getOrders();
        const tableOrders = orders.filter(order => 
            order.mesa == tableNumber && 
            ['pendiente', 'preparando', 'listo', 'entregado'].includes(order.estado) &&
            order.estado !== 'pagado'
        );
        
        // Retornar el pedido más reciente (ordenar por ID descendente)
        return tableOrders.length > 0 
            ? tableOrders.sort((a, b) => b.id - a.id)[0]
            : null;
    }

    getStatusClass(status) {
        const classes = {
            'libre': 'available',
            'ocupada': 'occupied',
            'limpieza': 'cleaning'
        };
        return classes[status] || 'available';
    }

    getStatusLabel(status) {
        const labels = {
            'libre': 'Libre',
            'ocupada': 'Ocupada',
            'limpieza': 'En limpieza'
        };
        return labels[status] || status;
    }

    getOrderStatusLabel(status) {
        const labels = {
            'pendiente': 'Pendiente',
            'preparando': 'Preparando',
            'listo': 'Listo para servir',
            'entregado': 'Entregado',
            'pagado': 'Pagado'
        };
        return labels[status] || status;
    }

    getTableActions(table, order) {
        if (table.estado === 'libre') {
            return `
                <button class="action-btn assign" onclick="mesasManager.assignTable(${table.numero})">
                    <i class="fas fa-plus"></i>
                    Asignar
                </button>
            `;
        }

        if (table.estado === 'ocupada' && order) {
            return `
                <button class="action-btn view" onclick="mesasManager.viewTableOrder(${table.numero})">
                    <i class="fas fa-eye"></i>
                    Ver Pedido
                </button>
                <button class="action-btn bill" onclick="mesasManager.showBillModal(${table.numero})">
                    <i class="fas fa-receipt"></i>
                    Sacar Cuenta
                </button>
                <button class="action-btn payment" onclick="mesasManager.showPaymentModal(${table.numero})">
                    <i class="fas fa-credit-card"></i>
                    Pagar
                </button>
            `;
        }

        if (table.estado === 'limpieza') {
            return `
                <button class="action-btn clean" onclick="mesasManager.markAsClean(${table.numero})">
                    <i class="fas fa-check"></i>
                    Marcar Limpia
                </button>
            `;
        }

        return '';
    }

    assignTable(tableNumber) {
        // Redirigir a ventas con mesa preseleccionada
        window.location.href = `ventas.html?mesa=${tableNumber}`;
    }

    viewTableOrder(tableNumber) {
        const order = this.getTableOrder(tableNumber);
        if (!order) {
            this.showNotification('No hay pedido activo para esta mesa', 'warning');
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
                    <h2 style="margin: 0; color: #2d3748;">Pedido Mesa ${order.mesa}</h2>
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
                        <p><strong>Pedido #${order.id}</strong></p>
                        <p><strong>Estado:</strong> <span style="color: ${this.getStatusColor(order.estado)};">${this.getOrderStatusLabel(order.estado)}</span></p>
                        <p><strong>Hora:</strong> ${order.hora}</p>
                        <p><strong>Tiempo transcurrido:</strong> <span style="color: #e53e3e; font-weight: bold;">${timeElapsed}</span></p>
                    </div>
                    <div>
                        <p><strong>Mesa:</strong> ${order.mesa}</p>
                        <p><strong>Total:</strong> $${order.total.toLocaleString()}</p>
                        ${order.metodoPago ? `<p><strong>Método de pago:</strong> ${order.metodoPago}</p>` : ''}
                    </div>
                </div>
                
                <div class="order-items-detail" style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">Productos:</h3>
                    ${order.items.map(item => `
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
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; font-size: 16px;">$${item.subtotal.toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="modal-actions" style="
                    display: flex;
                    gap: 10px;
                    justify-content: space-between;
                    flex-wrap: wrap;
                ">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="mesasManager.editOrder(${order.id}, ${order.mesa}); this.closest('.order-detail-modal').remove();" style="
                            padding: 10px 20px;
                            border: 1px solid #ff9800;
                            background: #ff9800;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-edit"></i>
                            Editar Pedido
                        </button>
                        <button onclick="mesasManager.goToPayment(${order.mesa}); this.closest('.order-detail-modal').remove();" style="
                            padding: 10px 20px;
                            border: 1px solid #4caf50;
                            background: #4caf50;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-credit-card"></i>
                            Pagar
                        </button>
                        <button onclick="window.location.href='pedidos.html'" style="
                            padding: 10px 20px;
                            border: 1px solid #2196f3;
                            background: #2196f3;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-clipboard-list"></i>
                            Ver en Pedidos
                        </button>
                    </div>
                    <button onclick="this.closest('.order-detail-modal').remove()" style="
                        padding: 10px 20px;
                        border: 1px solid #e2e8f0;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-times"></i>
                        Cerrar
                    </button>
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

    showBillModal(tableNumber) {
        const order = this.getTableOrder(tableNumber);
        if (!order) {
            this.showNotification('No hay pedido para mostrar la cuenta', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'bill-modal';
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

        const currentDate = new Date().toLocaleDateString('es-ES');
        const currentTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 16px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div class="modal-header" style="
                    padding: 24px 24px 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    text-align: center;
                ">
                    <h2 style="margin: 0 0 8px 0; color: #ff6b35; font-size: 24px;">CRÊPES & KAFFEE</h2>
                    <p style="margin: 0; color: #666; font-size: 14px;">Cuenta de Mesa ${tableNumber}</p>
                    <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Pedido #${order.id} • ${currentDate} ${currentTime}</p>
                </div>
                
                <div style="padding: 24px; max-height: 400px; overflow-y: auto;">
                    <div class="bill-items" style="margin-bottom: 20px;">
                        ${order.items.map(item => `
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 12px 0;
                                border-bottom: 1px solid #f1f1f1;
                            ">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px;">
                                        ${item.quantity}x ${item.productName}
                                    </div>
                                    <div style="font-size: 12px; color: #666;">
                                        $${item.price.toLocaleString()} c/u
                                    </div>
                                </div>
                                <div style="font-weight: 600; color: #2d3748; font-size: 16px;">
                                    $${item.subtotal.toLocaleString()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="bill-total" style="
                        border-top: 2px solid #ff6b35;
                        padding-top: 16px;
                        text-align: right;
                    ">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-size: 20px;
                            font-weight: bold;
                            color: #2d3748;
                        ">
                            <span>TOTAL A PAGAR:</span>
                            <span style="color: #ff6b35;">$${order.total.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div style="
                        margin-top: 20px;
                        padding: 16px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    ">
                        <p style="margin: 0 0 8px 0;">¡Gracias por visitarnos!</p>
                        <p style="margin: 0;">Síguenos en nuestras redes sociales</p>
                    </div>
                </div>
                
                <div class="modal-footer" style="
                    padding: 16px 24px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 12px;
                    justify-content: space-between;
                ">
                    <button onclick="mesasManager.printBill(${tableNumber})" style="
                        padding: 12px 20px;
                        background: #f3f4f6;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-weight: 500;
                    ">
                        <i class="fas fa-print"></i>
                        Imprimir
                    </button>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="mesasManager.showPaymentModal(${tableNumber}); this.closest('.bill-modal').remove();" style="
                            padding: 12px 20px;
                            background: #10b981;
                            border: 1px solid #10b981;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-weight: 500;
                        ">
                            <i class="fas fa-credit-card"></i>
                            Proceder al Pago
                        </button>
                        <button onclick="this.closest('.bill-modal').remove()" style="
                            padding: 12px 20px;
                            background: #6b7280;
                            border: 1px solid #6b7280;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-weight: 500;
                        ">
                            <i class="fas fa-times"></i>
                            Cerrar
                        </button>
                    </div>
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
    }

    printBill(tableNumber) {
        const order = this.getTableOrder(tableNumber);
        if (!order) {
            this.showNotification('No hay pedido para imprimir', 'warning');
            return;
        }

        // Crear ventana de impresión
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        const currentDate = new Date().toLocaleDateString('es-ES');
        const currentTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Cuenta Mesa ${tableNumber}</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        font-size: 12px; 
                        margin: 20px; 
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        border-bottom: 1px dashed #000;
                        padding-bottom: 10px;
                    }
                    .item { 
                        margin: 8px 0; 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-start;
                    }
                    .item-name {
                        flex: 1;
                        margin-right: 10px;
                    }
                    .item-price {
                        white-space: nowrap;
                    }
                    .total { 
                        border-top: 2px solid #000; 
                        margin-top: 15px; 
                        padding-top: 10px; 
                        font-weight: bold; 
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        border-top: 1px dashed #000;
                        padding-top: 10px;
                        font-size: 10px;
                    }
                    @media print { 
                        body { margin: 0; } 
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>CRÊPES & KAFFEE</h2>
                    <p>Mesa ${tableNumber}</p>
                    <p>Pedido #${order.id}</p>
                    <p>${currentDate} - ${currentTime}</p>
                </div>
                
                <div class="items">
                    ${order.items.map(item => `
                        <div class="item">
                            <div class="item-name">
                                ${item.quantity}x ${item.productName}<br>
                                <small>$${item.price.toLocaleString()} c/u</small>
                            </div>
                            <div class="item-price">$${item.subtotal.toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total">
                    <div class="item">
                        <span>TOTAL A PAGAR:</span>
                        <span>$${order.total.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>¡Gracias por su visita!</p>
                    <p>Síguenos en nuestras redes sociales</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">Imprimir</button>
                    <button onclick="window.close()">Cerrar</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    goToPayment(tableNumber) {
        const order = this.getTableOrder(tableNumber);
        if (!order) {
            this.showNotification('No hay pedido para cobrar', 'warning');
            return;
        }

        this.showPaymentModal(tableNumber);
    }

    showPaymentModal(tableNumber) {
        const order = this.getTableOrder(tableNumber);
        if (!order) {
            this.showNotification('No hay pedido para procesar el pago', 'warning');
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
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Mesa ${tableNumber} - Pedido #${order.id}</p>
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
                                $${order.total.toLocaleString()}
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
                                    <span style="color: #166534; font-weight: bold;">$${order.total.toLocaleString()}</span>
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
                            <p style="margin: 4px 0; color: #6b7280;"><strong>Fecha:</strong> ${order.fecha || new Date().toLocaleDateString()}</p>
                            <p style="margin: 4px 0; color: #6b7280;"><strong>Hora:</strong> ${order.hora || new Date().toLocaleTimeString()}</p>
                        </div>

                        <div class="order-items" style="margin-bottom: 20px;">
                            ${order.items.map(item => `
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
                                    <div style="font-weight: 600; color: #1f2937; font-size: 14px;">$${item.subtotal.toLocaleString()}</div>
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
                                <span style="color: #dc2626;">$${order.total.toLocaleString()}</span>
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
                    <button id="processPaymentBtn" onclick="mesasManager.processPayment(${tableNumber}, ${order.id})" style="
                        padding: 12px 24px;
                        background: #10b981;
                        border: 1px solid #10b981;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        opacity: 0.5;
                    " disabled>
                        Procesar Pago
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Payment method change
        const paymentMethodSelect = modal.querySelector('#paymentMethod');
        const cashFields = modal.querySelector('#cashFields');
        const mixedFields = modal.querySelector('#mixedFields');
        const processBtn = modal.querySelector('#processPaymentBtn');

        paymentMethodSelect.addEventListener('change', (e) => {
            const method = e.target.value;
            
            // Hide all fields
            cashFields.style.display = 'none';
            mixedFields.style.display = 'none';
            
            // Show relevant fields
            if (method === 'efectivo') {
                cashFields.style.display = 'block';
            } else if (method === 'mixto') {
                mixedFields.style.display = 'block';
            }
            
            // Enable/disable process button
            processBtn.disabled = !method;
            processBtn.style.opacity = method ? '1' : '0.5';
        });

        // Cash calculation
        const receivedInput = modal.querySelector('#receivedAmount');
        const displayReceived = modal.querySelector('#displayReceived');
        const changeAmount = modal.querySelector('#changeAmount');

        if (receivedInput) {
            receivedInput.addEventListener('input', (e) => {
                const received = parseFloat(e.target.value) || 0;
                const total = order.total;
                const change = Math.max(0, received - total);
                
                displayReceived.textContent = `$${received.toLocaleString()}`;
                changeAmount.textContent = `$${change.toLocaleString()}`;
                
                // Color coding
                if (received < total) {
                    changeAmount.style.color = '#dc2626';
                    changeAmount.textContent = 'Insuficiente';
                } else {
                    changeAmount.style.color = '#059669';
                }
            });
        }

        // Mixed payment calculation
        const cashPart = modal.querySelector('#cashPart');
        const cardPart = modal.querySelector('#cardPart');
        const mixedTotal = modal.querySelector('#mixedTotal');

        if (cashPart && cardPart) {
            const updateMixedTotal = () => {
                const cash = parseFloat(cashPart.value) || 0;
                const card = parseFloat(cardPart.value) || 0;
                const total = cash + card;
                
                mixedTotal.textContent = `$${total.toLocaleString()}`;
                
                if (total < order.total) {
                    mixedTotal.style.color = '#dc2626';
                } else if (total === order.total) {
                    mixedTotal.style.color = '#059669';
                } else {
                    mixedTotal.style.color = '#f59e0b';
                }
            };

            cashPart.addEventListener('input', updateMixedTotal);
            cardPart.addEventListener('input', updateMixedTotal);
        }

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    processPayment(tableNumber, orderId) {
        try {
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

            const order = this.getTableOrder(tableNumber);
            if (!order) {
                this.showNotification('No se encontró el pedido', 'error');
                return;
            }

            // Calcular total si no existe
            if (!order.total) {
                order.total = order.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
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
            const sale = {
                id: Date.now(),
                orderId: order.id,
                mesa: order.mesa,
                items: order.items,
                total: order.total,
                metodoPago: paymentMethod,
                fecha: new Date().toISOString(),
                fechaFormateada: new Date().toLocaleDateString('es-ES'),
                hora: new Date().toLocaleTimeString('es-ES'),
                cajero: localStorage.getItem('currentUser') || 'Sistema',
                paymentData: paymentData
            };
            
            this.db.saveSale(sale);

            // Actualizar estado de la mesa
            const tables = this.db.getTables();
            const table = tables.find(t => t.numero == tableNumber);
            if (table) {
                table.estado = 'limpieza';
                table.clienteActual = null;
                table.pedidoActual = null;
                table.horaLiberacion = new Date().toISOString();
                this.db.saveTable(table);
            }

            // Cerrar modal
            modal.remove();

            // Actualizar vista
            this.loadTables();
            this.updateStats();
            
            // Mostrar notificación de éxito
            let successMessage = `Pago procesado exitosamente - Mesa ${tableNumber} - $${order.total.toLocaleString()}`;
            if (paymentMethod === 'efectivo' && paymentData.change > 0) {
                successMessage += ` (Cambio: $${paymentData.change.toLocaleString()})`;
            }
            this.showNotification(successMessage, 'success');

            // Mostrar resumen del pago si existe la función
            if (typeof this.showPaymentSummary === 'function') {
                this.showPaymentSummary(order, paymentData);
            }

        } catch (error) {
            console.error('Error al procesar pago:', error);
            this.showNotification(`Error al procesar el pago: ${error.message}`, 'error');
        }
    }

    showPaymentSummary(order, paymentData) {
        const modal = document.createElement('div');
        modal.className = 'payment-summary-modal';
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

        const changeText = paymentData.change > 0 ? 
            `<div style="color: #10b981; font-weight: bold; font-size: 18px; margin-top: 12px;">
                Cambio a devolver: $${paymentData.change.toLocaleString()}
            </div>` : '';

        const mixedText = paymentData.method === 'mixto' ?
            `<div style="margin-top: 12px;">
                <div>Efectivo: $${paymentData.cashAmount.toLocaleString()}</div>
                <div>Tarjeta: $${paymentData.cardAmount.toLocaleString()}</div>
            </div>` : '';

        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: #10b981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px auto;
                ">
                    <i class="fas fa-check" style="color: white; font-size: 32px;"></i>
                </div>
                
                <h2 style="margin: 0 0 16px 0; color: #1f2937;">¡Pago Procesado!</h2>
                
                <div style="
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                ">
                    <div style="color: #166534; margin-bottom: 8px;">
                        <strong>Mesa ${order.mesa} - Pedido #${order.id}</strong>
                    </div>
                    <div style="color: #166534; font-size: 24px; font-weight: bold;">
                        Total: $${order.total.toLocaleString()}
                    </div>
                    <div style="color: #166534; margin-top: 8px;">
                        Método: ${this.getPaymentMethodLabel(paymentData.method)}
                    </div>
                    ${mixedText}
                    ${changeText}
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="mesasManager.printReceipt(${order.id})" style="
                        padding: 12px 24px;
                        background: #f3f4f6;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        <i class="fas fa-print"></i> Imprimir Recibo
                    </button>
                    <button onclick="this.closest('.payment-summary-modal').remove()" style="
                        padding: 12px 24px;
                        background: #10b981;
                        border: 1px solid #10b981;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        Continuar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
            }
        }, 10000);
    }

    printReceipt(orderId) {
        const orders = this.db.getOrders();
        const order = orders.find(o => o.id == orderId);
        
        if (!order) {
            this.showNotification('No se encontró el pedido', 'error');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=300,height=600');
        const paymentData = order.paymentData || {};
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Recibo - Mesa ${order.mesa}</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        font-size: 12px; 
                        margin: 20px; 
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        border-bottom: 1px dashed #000;
                        padding-bottom: 10px;
                    }
                    .item { 
                        margin: 8px 0; 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-start;
                    }
                    .item-name {
                        flex: 1;
                        margin-right: 10px;
                    }
                    .item-price {
                        white-space: nowrap;
                    }
                    .total { 
                        border-top: 2px solid #000; 
                        margin-top: 15px; 
                        padding-top: 10px; 
                        font-weight: bold; 
                        font-size: 14px;
                    }
                    .payment-info {
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 1px dashed #000;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        border-top: 1px dashed #000;
                        padding-top: 10px;
                        font-size: 10px;
                    }
                    @media print { 
                        body { margin: 0; } 
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>CRÊPES & KAFFEE</h2>
                    <p>*** RECIBO DE PAGO ***</p>
                    <p>Mesa ${order.mesa} - Pedido #${order.id}</p>
                    <p>${new Date(order.fechaPago).toLocaleDateString('es-ES')} - ${new Date(order.fechaPago).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                
                <div class="items">
                    ${order.items.map(item => `
                        <div class="item">
                            <div class="item-name">
                                ${item.quantity}x ${item.productName}<br>
                                <small>$${(item.price || item.subtotal / item.quantity).toLocaleString()} c/u</small>
                            </div>
                            <div class="item-price">$${item.subtotal.toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total">
                    <div class="item">
                        <span>TOTAL A PAGAR:</span>
                        <span>$${order.total.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="payment-info">
                    <div class="item">
                        <span>MÉTODO DE PAGO:</span>
                        <span>${this.getPaymentMethodLabel(order.metodoPago)}</span>
                    </div>
                    ${paymentData.received ? `
                        <div class="item">
                            <span>RECIBIDO:</span>
                            <span>$${paymentData.received.toLocaleString()}</span>
                        </div>
                        <div class="item">
                            <span>CAMBIO:</span>
                            <span>$${paymentData.change.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${paymentData.cashAmount ? `
                        <div class="item">
                            <span>EFECTIVO:</span>
                            <span>$${paymentData.cashAmount.toLocaleString()}</span>
                        </div>
                        <div class="item">
                            <span>TARJETA:</span>
                            <span>$${paymentData.cardAmount.toLocaleString()}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="footer">
                    <p>¡Gracias por su visita!</p>
                    <p>Síguenos en nuestras redes sociales</p>
                    <p>www.crepesykaffee.com</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">Imprimir</button>
                    <button onclick="window.close()">Cerrar</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    getPaymentMethodLabel(method) {
        const labels = {
            'efectivo': 'Efectivo',
            'tarjeta': 'Tarjeta',
            'transferencia': 'Transferencia',
            'mixto': 'Pago Mixto'
        };
        return labels[method] || method;
    }

    editOrder(orderId, tableNumber) {
        // Redirigir a ventas con parámetros para editar el pedido
        const params = new URLSearchParams({
            mesa: tableNumber,
            editOrder: orderId
        });
        
        window.location.href = `ventas.html?${params.toString()}`;
    }

    markAsClean(tableNumber) {
        const tables = this.db.getTables();
        const table = tables.find(t => t.numero == tableNumber);
        
        if (table) {
            table.estado = 'libre';
            table.pedidoId = null;
            table.ultimaActividad = new Date().toISOString();
            this.db.updateTable(table.id, table);
            this.loadTables();
            this.updateStats();
            this.showNotification(`Mesa ${tableNumber} limpia y disponible`, 'success');
        }
    }

    getStatusColor(status) {
        const colors = {
            'pendiente': '#ff9800',
            'preparando': '#2196f3',
            'listo': '#4caf50',
            'entregado': '#9e9e9e',
            'pagado': '#38a169'
        };
        return colors[status] || '#666';
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

    updateStats() {
        try {
            const orders = this.db.getOrders();
            const today = new Date().toDateString();
            
            const todayOrders = orders.filter(order => 
                new Date(order.timestamp).toDateString() === today
            );

            const stats = {
                totalTables: this.tables.length,
                freeTables: this.tables.filter(t => t.estado === 'libre').length,
                occupiedTables: this.tables.filter(t => t.estado === 'ocupada').length,
                cleaningTables: this.tables.filter(t => t.estado === 'limpieza').length,
                todayRevenue: todayOrders
                    .filter(o => o.estado === 'pagado')
                    .reduce((sum, order) => sum + order.total, 0)
            };

            this.updateStatsElements(stats);

        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        }
    }

    updateStatsElements(stats) {
        // Calcular tasa de ocupación
        const occupancyRate = stats.totalTables > 0 ? 
            Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0;
        
        const elements = {
            'availableTables': stats.freeTables,
            'occupiedTables': stats.occupiedTables,
            'cleaningTables': stats.cleaningTables,
            'totalTables': stats.totalTables,
            'occupancyRate': `${occupancyRate}%`
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

    filterTables(filter) {
        const tableCards = document.querySelectorAll('.table-card');
        let visibleCount = 0;

        tableCards.forEach(card => {
            const tableId = card.dataset.tableId;
            const table = this.tables.find(t => t.id == tableId);
            
            if (!table) return;

            let shouldShow = false;
            
            if (filter === 'todas') {
                shouldShow = true;
            } else if (filter === table.estado) {
                shouldShow = true;
            }

            if (shouldShow) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Actualizar contador en el filtro activo
        this.updateFilterCounts();
        
        // Mostrar mensaje si no hay resultados
        this.toggleEmptyState(visibleCount === 0);
    }

    searchTables(searchTerm) {
        const tableCards = document.querySelectorAll('.table-card');
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;

        tableCards.forEach(card => {
            const tableId = card.dataset.tableId;
            const table = this.tables.find(t => t.id == tableId);
            
            if (!table) return;

            let shouldShow = false;
            
            if (term === '') {
                shouldShow = true;
            } else {
                // Buscar en número de mesa, capacidad, ubicación
                const searchableText = [
                    table.numero.toString(),
                    table.capacidad ? table.capacidad.toString() : '',
                    table.ubicacion || '',
                    this.getStatusLabel(table.estado)
                ].join(' ').toLowerCase();
                
                shouldShow = searchableText.includes(term);
            }

            if (shouldShow) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        this.toggleEmptyState(visibleCount === 0);
    }

    updateFilterCounts() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            const filter = btn.dataset.filter;
            let count = 0;
            
            if (filter === 'todas') {
                count = this.tables.length;
            } else {
                count = this.tables.filter(t => t.estado === filter).length;
            }
            
            const countSpan = btn.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = count;
            }
        });
    }

    toggleEmptyState(isEmpty) {
        const tablesGrid = document.getElementById('tablesGrid');
        const emptyState = document.getElementById('emptyTables');
        
        if (isEmpty) {
            if (tablesGrid) tablesGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (tablesGrid) tablesGrid.style.display = 'grid';
            if (emptyState) emptyState.style.display = 'none';
        }
    }
}

// Inicializar el gestor cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.mesasManager = new MesasManager();
});

// Función auxiliar para refrescar datos
function refreshData() {
    if (window.mesasManager) {
        window.mesasManager.loadTables();
        window.mesasManager.updateStats();
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

    .table-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .table-card:hover {
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

    .action-btn.assign {
        background: #e3f2fd;
        color: #1976d2;
    }

    .action-btn.view {
        background: #e8f5e8;
        color: #388e3c;
    }

    .action-btn.bill {
        background: #fff3e0;
        color: #f57c00;
    }

    .action-btn.payment {
        background: #e8f5e8;
        color: #2e7d32;
    }

    .action-btn.clean {
        background: #f3e5f5;
        color: #7b1fa2;
    }

    .payment-method:hover {
        border-color: #2563eb !important;
        background: #eff6ff !important;
    }

    .status-libre { background: #e8f5e8; color: #2e7d32; }
    .status-ocupada { background: #ffebee; color: #c62828; }
    .status-limpieza { background: #fff3e0; color: #ef6c00; }
`;

document.head.appendChild(style);

// Funciones globales para el manejo de mesas
function showAddTableModal() {
    const modal = document.getElementById('tableModal');
    const form = document.getElementById('tableForm');
    const title = document.getElementById('tableModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Agregar Nueva Mesa';
        form.reset();
        modal.style.display = 'flex';
        
        // Focus en el primer campo
        const firstInput = form.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeTableDetailsModal() {
    closeModal('tableDetailsModal');
}

// Event listeners para el formulario de mesas
document.addEventListener('DOMContentLoaded', function() {
    const tableForm = document.getElementById('tableForm');
    if (tableForm) {
        tableForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewTable();
        });
    }
    
    // Event listeners para filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            setActiveFilter(this);
            if (window.mesasManager) {
                window.mesasManager.filterTables(filter);
            }
        });
    });
    
    // Event listener para búsqueda
    const searchInput = document.getElementById('searchTables');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (window.mesasManager) {
                window.mesasManager.searchTables(this.value);
            }
        });
    }
});

function addNewTable() {
    const form = document.getElementById('tableForm');
    const tableNumber = document.getElementById('tableNumber').value;
    const tableCapacity = document.getElementById('tableCapacity').value;
    const tableLocation = document.getElementById('tableLocation').value;
    
    if (!tableNumber || !tableCapacity || !tableLocation) {
        if (window.mesasManager) {
            window.mesasManager.showNotification('Por favor, completa todos los campos', 'error');
        }
        return;
    }
    
    // Verificar que el número de mesa no esté duplicado
    if (window.mesasManager && window.mesasManager.db) {
        const tables = window.mesasManager.db.getTables();
        const existingTable = tables.find(table => table.numero == tableNumber);
        
        if (existingTable) {
            window.mesasManager.showNotification(`Ya existe una mesa con el número ${tableNumber}`, 'error');
            return;
        }
        
        const newTable = {
            id: Date.now(),
            numero: parseInt(tableNumber),
            capacidad: parseInt(tableCapacity),
            ubicacion: tableLocation,
            estado: 'libre',
            fechaCreacion: new Date().toISOString()
        };
        
        try {
            window.mesasManager.db.addTable(newTable);
            window.mesasManager.loadTables();
            window.mesasManager.updateStats();
            window.mesasManager.showNotification(`Mesa ${tableNumber} agregada exitosamente`, 'success');
            closeModal('tableModal');
        } catch (error) {
            console.error('Error al agregar mesa:', error);
            window.mesasManager.showNotification('Error al agregar la mesa', 'error');
        }
    }
}

function setActiveFilter(activeBtn) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}
