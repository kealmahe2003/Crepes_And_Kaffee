// Gestión de Mesas - Sistema POS Crêpes & Kaffee

class MesasManager {
    constructor() {
        this.selectedTableId = null;
        this.currentFilter = 'todas';
        this.db = new Database();
        this.initializeEventListeners();
        this.loadTables();
    }

    initializeEventListeners() {
        // Filtros de estado
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterTables(e.target.dataset.filter);
            });
        });

        // Formulario de mesa
        const tableForm = document.getElementById('tableForm');
        if (tableForm) {
            tableForm.addEventListener('submit', this.saveTable.bind(this));
        }

        // Búsqueda
        const searchInput = document.getElementById('searchTables');
        if (searchInput) {
            searchInput.addEventListener('input', this.searchTables.bind(this));
        }
    }

    loadTables() {
        const tables = this.db.getTables();
        this.renderTables(tables);
        this.updateStats(tables);
    }

    renderTables(tables) {
        const grid = document.getElementById('tablesGrid');
        if (!grid) return;

        grid.innerHTML = tables.map(table => this.createTableCard(table)).join('');
    }

    createTableCard(table) {
        const statusColors = {
            'libre': '#4caf50',
            'ocupada': '#f44336',
            'reservada': '#ff9800',
            'limpieza': '#9e9e9e'
        };

        const statusIcons = {
            'libre': 'fas fa-check-circle',
            'ocupada': 'fas fa-users',
            'reservada': 'fas fa-clock',
            'limpieza': 'fas fa-broom'
        };

        const statusText = {
            'libre': 'Libre',
            'ocupada': 'Ocupada',
            'reservada': 'Reservada',
            'limpieza': 'Limpieza'
        };

        return `
            <div class="table-card ${table.estado}" onclick="selectTable(${table.id})">
                <div class="table-header">
                    <h3 class="table-name">Mesa ${table.numero}</h3>
                    <span class="table-status" style="background: ${statusColors[table.estado]}">
                        <i class="${statusIcons[table.estado]}"></i>
                        ${statusText[table.estado]}
                    </span>
                </div>
                
                <div class="table-info">
                    <div class="table-capacity">
                        <i class="fas fa-users"></i>
                        ${table.capacidad} personas
                    </div>
                    <div class="table-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${table.ubicacion}
                    </div>
                </div>
                
                ${table.estado === 'ocupada' && table.pedidoActual ? `
                    <div class="table-order">
                        <div class="order-info">
                            <strong>Pedido #${table.pedidoActual.id}</strong>
                            <span class="order-time">${this.getTimeAgo(table.pedidoActual.fecha)}</span>
                        </div>
                        <div class="order-total">$${table.pedidoActual.total.toFixed(2)}</div>
                    </div>
                ` : ''}
                
                ${table.estado === 'reservada' && table.reserva ? `
                    <div class="table-reservation">
                        <div class="reservation-info">
                            <strong>${table.reserva.cliente}</strong>
                            <span class="reservation-time">${table.reserva.hora}</span>
                        </div>
                        <div class="reservation-phone">${table.reserva.telefono}</div>
                    </div>
                ` : ''}
                
                <div class="table-actions">
                    ${this.getTableActions(table)}
                </div>
            </div>
        `;
    }

    getTableActions(table) {
        switch (table.estado) {
            case 'libre':
                return `
                    <button class="action-btn primary" onclick="assignTable(${table.id})">
                        <i class="fas fa-user-plus"></i>
                        Asignar
                    </button>
                    <button class="action-btn secondary" onclick="reserveTable(${table.id})">
                        <i class="fas fa-clock"></i>
                        Reservar
                    </button>
                    <button class="action-btn" onclick="editTable(${table.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                `;
            case 'ocupada':
                return `
                    <button class="action-btn success" onclick="viewOrder(${table.pedidoActual?.id})">
                        <i class="fas fa-eye"></i>
                        Ver Pedido
                    </button>
                    <button class="action-btn warning" onclick="closeTable(${table.id})">
                        <i class="fas fa-check"></i>
                        Cerrar
                    </button>
                `;
            case 'reservada':
                return `
                    <button class="action-btn primary" onclick="activateReservation(${table.id})">
                        <i class="fas fa-user-check"></i>
                        Activar
                    </button>
                    <button class="action-btn danger" onclick="cancelReservation(${table.id})">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                `;
            case 'limpieza':
                return `
                    <button class="action-btn success" onclick="finishCleaning(${table.id})">
                        <i class="fas fa-check"></i>
                        Terminado
                    </button>
                `;
            default:
                return '';
        }
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return `${diffMins} min`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            return `${diffHours}h ${diffMins % 60}min`;
        }
    }

    updateStats(tables) {
        const stats = {
            total: tables.length,
            libre: tables.filter(t => t.estado === 'libre').length,
            ocupada: tables.filter(t => t.estado === 'ocupada').length,
            reservada: tables.filter(t => t.estado === 'reservada').length,
            limpieza: tables.filter(t => t.estado === 'limpieza').length
        };

        // Actualizar contadores en las estadísticas principales
        const availableEl = document.getElementById('availableTables');
        const occupiedEl = document.getElementById('occupiedTables');
        const reservedEl = document.getElementById('reservedTables');
        const cleaningEl = document.getElementById('cleaningTables');
        const totalEl = document.getElementById('totalTables');
        const occupancyEl = document.getElementById('occupancyRate');

        if (availableEl) availableEl.textContent = stats.libre;
        if (occupiedEl) occupiedEl.textContent = stats.ocupada;
        if (reservedEl) reservedEl.textContent = stats.reservada;
        if (cleaningEl) cleaningEl.textContent = stats.limpieza;
        if (totalEl) totalEl.textContent = stats.total;

        // Actualizar contadores en los filtros
        const filterEls = {
            todas: document.querySelector('[data-filter="todas"] .filter-count'),
            libre: document.querySelector('[data-filter="libre"] .filter-count'),
            ocupada: document.querySelector('[data-filter="ocupada"] .filter-count'),
            reservada: document.querySelector('[data-filter="reservada"] .filter-count'),
            limpieza: document.querySelector('[data-filter="limpieza"] .filter-count')
        };

        if (filterEls.todas) filterEls.todas.textContent = stats.total;
        if (filterEls.libre) filterEls.libre.textContent = stats.libre;
        if (filterEls.ocupada) filterEls.ocupada.textContent = stats.ocupada;
        if (filterEls.reservada) filterEls.reservada.textContent = stats.reservada;
        if (filterEls.limpieza) filterEls.limpieza.textContent = stats.limpieza;

        // Calcular porcentaje de ocupación
        const occupancyRate = stats.total > 0 ? Math.round((stats.ocupada / stats.total) * 100) : 0;
        if (occupancyEl) occupancyEl.textContent = `${occupancyRate}%`;
    }

    filterTables(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        const tables = this.db.getTables();
        const filteredTables = filter === 'todas' 
            ? tables 
            : tables.filter(table => table.estado === filter);

        this.renderTables(filteredTables);
    }

    searchTables(e) {
        const query = e.target.value.toLowerCase();
        const tables = this.db.getTables();
        
        const filteredTables = tables.filter(table => {
            const matchesSearch = 
                table.numero.toString().includes(query) ||
                table.ubicacion.toLowerCase().includes(query);
            
            const matchesFilter = this.currentFilter === 'todas' || table.estado === this.currentFilter;
            
            return matchesSearch && matchesFilter;
        });

        this.renderTables(filteredTables);
    }

    showAddTableModal() {
        document.getElementById('tableModalTitle').textContent = 'Nueva Mesa';
        document.getElementById('tableForm').reset();
        delete document.getElementById('tableForm').dataset.tableId;
        document.getElementById('tableModal').classList.add('active');
    }

    saveTable(e) {
        e.preventDefault();
        
        const formData = {
            numero: parseInt(document.getElementById('tableNumber').value),
            capacidad: parseInt(document.getElementById('tableCapacity').value),
            ubicacion: document.getElementById('tableLocation').value,
            estado: 'libre'
        };

        const tableId = document.getElementById('tableForm').dataset.tableId;

        try {
            if (tableId) {
                // Editar mesa existente
                this.db.updateTable(parseInt(tableId), formData);
                this.showNotification('Mesa actualizada exitosamente', 'success');
            } else {
                // Crear nueva mesa
                this.db.addTable(formData);
                this.showNotification('Mesa creada exitosamente', 'success');
            }

            this.loadTables();
            this.closeModal('tableModal');
        } catch (error) {
            this.showNotification('Error al guardar la mesa: ' + error.message, 'error');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Determinar icono según el tipo
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        else if (type === 'error') iconClass = 'fas fa-times-circle';
        
        notification.innerHTML = `
            <i class="${iconClass}"></i>
            ${message}
        `;
        
        // Determinar color de fondo según el tipo
        let backgroundColor = '#3182ce';
        if (type === 'success') backgroundColor = '#38a169';
        else if (type === 'error') backgroundColor = '#e53e3e';
        
        // Estilos inline para la notificación
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            background: backgroundColor,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '9999',
            animation: 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Funciones globales para eventos del DOM
function selectTable(tableId) {
    window.mesasManager.selectedTableId = tableId;
    console.log(`Mesa ${tableId} seleccionada`);
}

function showAddTableModal() {
    window.mesasManager.showAddTableModal();
}

function editTable(tableId) {
    const table = window.mesasManager.db.getTables().find(t => t.id === tableId);
    if (!table) return;

    // Llenar formulario con datos de la mesa
    document.getElementById('tableNumber').value = table.numero;
    document.getElementById('tableCapacity').value = table.capacidad;
    document.getElementById('tableLocation').value = table.ubicacion;

    // Configurar formulario para edición
    const form = document.getElementById('tableForm');
    form.dataset.tableId = tableId;
    
    document.getElementById('tableModalTitle').textContent = 'Editar Mesa';
    document.getElementById('tableModal').classList.add('active');
}

function assignTable(tableId) {
    const customerName = prompt('Nombre del cliente:');
    if (customerName?.trim()) {
        try {
            window.mesasManager.db.updateTableStatus(tableId, 'ocupada', {
                pedido: {
                    cliente: customerName.trim(),
                    fecha: new Date().toISOString(),
                    id: Date.now(), // ID temporal
                    total: 0
                }
            });
            
            window.mesasManager.loadTables();
            window.mesasManager.showNotification(`Mesa asignada a ${customerName}`, 'success');
        } catch (error) {
            console.error('Error al asignar mesa:', error);
            window.mesasManager.showNotification('Error al asignar mesa', 'error');
        }
    }
}

function reserveTable(tableId) {
    const customerName = prompt('Nombre del cliente:');
    if (!customerName?.trim()) return;
    
    const customerPhone = prompt('Teléfono del cliente:');
    if (!customerPhone?.trim()) return;
    
    const reservationTime = prompt('Hora de la reserva (HH:MM):');
    if (!reservationTime?.trim()) return;

    try {
        window.mesasManager.db.updateTableStatus(tableId, 'reservada', {
            reserva: {
                cliente: customerName.trim(),
                telefono: customerPhone.trim(),
                hora: reservationTime.trim(),
                fecha: new Date().toISOString()
            }
        });
        
        window.mesasManager.loadTables();
        window.mesasManager.showNotification(`Mesa reservada para ${customerName}`, 'success');
    } catch (error) {
        console.error('Error al reservar mesa:', error);
        window.mesasManager.showNotification('Error al reservar mesa', 'error');
    }
}

function viewOrder(orderId) {
    if (orderId) {
        // Redireccionar a la página de pedidos con el ID específico
        window.location.href = `pedidos.html?id=${orderId}`;
    } else {
        window.mesasManager.showNotification('No hay pedido asociado', 'warning');
    }
}

function closeTable(tableId) {
    if (confirm('¿Estás seguro de que quieres cerrar esta mesa?')) {
        try {
            window.mesasManager.db.updateTableStatus(tableId, 'limpieza');
            window.mesasManager.loadTables();
            window.mesasManager.showNotification('Mesa cerrada, en proceso de limpieza', 'success');
        } catch (error) {
            console.error('Error al cerrar mesa:', error);
            window.mesasManager.showNotification('Error al cerrar mesa', 'error');
        }
    }
}

function activateReservation(tableId) {
    if (confirm('¿Activar la reserva? La mesa pasará a estado ocupado.')) {
        try {
            const table = window.mesasManager.db.getTables().find(t => t.id === tableId);
            window.mesasManager.db.updateTableStatus(tableId, 'ocupada', {
                pedido: {
                    cliente: table.reserva.cliente,
                    fecha: new Date().toISOString(),
                    id: Date.now(), // ID temporal
                    total: 0
                }
            });
            
            window.mesasManager.loadTables();
            window.mesasManager.showNotification('Reserva activada exitosamente', 'success');
        } catch (error) {
            console.error('Error al activar reserva:', error);
            window.mesasManager.showNotification('Error al activar reserva', 'error');
        }
    }
}

function cancelReservation(tableId) {
    if (confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
        try {
            window.mesasManager.db.updateTableStatus(tableId, 'libre');
            window.mesasManager.loadTables();
            window.mesasManager.showNotification('Reserva cancelada', 'success');
        } catch (error) {
            console.error('Error al cancelar reserva:', error);
            window.mesasManager.showNotification('Error al cancelar reserva', 'error');
        }
    }
}

function finishCleaning(tableId) {
    try {
        window.mesasManager.db.updateTableStatus(tableId, 'libre');
        window.mesasManager.loadTables();
        window.mesasManager.showNotification('Mesa lista para usar', 'success');
    } catch (error) {
        console.error('Error al actualizar estado de mesa:', error);
        window.mesasManager.showNotification('Error al actualizar estado de mesa', 'error');
    }
}

function closeModal(modalId) {
    window.mesasManager.closeModal(modalId);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.mesasManager = new MesasManager();
    
    // Agregar estilos para las notificaciones si no existen
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .notification {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 500;
                min-width: 300px;
            }
        `;
        document.head.appendChild(style);
    }
});
