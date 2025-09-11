// Dashboard JavaScript - Crêpes & Kaffee
// Sistema POS - Panel de Control Principal

// Verificar autenticación
if (localStorage.getItem('userLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

// Variables globales
let dashboardData = {
    sales: [],
    orders: [],
    tables: [],
    products: []
};

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    // Actualizar cada 30 segundos
    setInterval(refreshDashboard, 30000);
});

function initializeDashboard() {
    updateCurrentDateTime();
    loadDashboardData();
    updateDashboardStats();
    loadRecentOrders();
    loadPopularProducts();
    
    // Actualizar fecha y hora cada minuto
    setInterval(updateCurrentDateTime, 60000);
    
    console.log('Dashboard inicializado correctamente');
}

function updateCurrentDateTime() {
    const now = new Date();
    
    // Formatear fecha
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('es-ES', dateOptions);
    }
    
    // Formatear hora
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('es-ES', timeOptions);
    }
}

function loadDashboardData() {
    try {
        dashboardData.orders = db.getOrders() || [];
        dashboardData.tables = db.getTables() || [];
        dashboardData.sales = db.getSales() || [];
        dashboardData.products = db.getProducts() || [];
        
        console.log('Datos del dashboard cargados:', {
            orders: dashboardData.orders.length,
            tables: dashboardData.tables.length,
            sales: dashboardData.sales.length,
            products: dashboardData.products.length
        });
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showNotification('Error al cargar datos del dashboard', 'error');
    }
}

function updateDashboardStats() {
    try {
        // Filtrar datos de hoy
        const today = new Date().toDateString();
        const todayOrders = dashboardData.orders.filter(order => {
            const orderDate = new Date(order.timestamp || order.fecha);
            return orderDate.toDateString() === today;
        });
        
        const todaySalesData = dashboardData.sales.filter(sale => {
            const saleDate = new Date(sale.timestamp || sale.fecha);
            return saleDate.toDateString() === today;
        });
        
        // Calcular estadísticas principales
        const todaySales = todaySalesData.reduce((total, sale) => total + (sale.total || 0), 0);
        const todayOrdersCount = todayOrders.length;
        const occupiedTables = dashboardData.tables.filter(table => 
            table.estado === 'ocupada' || table.status === 'ocupada'
        ).length;
        const totalTables = dashboardData.tables.length;
        
        // Calcular clientes únicos (estimado basado en mesas ocupadas)
        const estimatedCustomers = occupiedTables * 2.5; // Promedio de personas por mesa
        
        // Actualizar elementos del DOM con verificaciones
        updateStatElement('dailySales', db.formatCurrency(todaySales));
        updateStatElement('dailyOrders', todayOrdersCount);
        updateStatElement('dailyCustomers', Math.round(estimatedCustomers));
        updateStatElement('occupiedTables', `${occupiedTables}/${totalTables}`);
        
        // Calcular y mostrar cambios porcentuales
        calculatePercentageChanges(todaySales, todayOrdersCount, occupiedTables);
        
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        
        // Añadir animación de actualización
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }
}

function calculatePercentageChanges(todaySales, todayOrders, occupiedTables) {
    // Obtener datos de ayer para comparación
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    const yesterdayOrders = dashboardData.orders.filter(order => {
        const orderDate = new Date(order.timestamp || order.fecha);
        return orderDate.toDateString() === yesterdayString;
    });
    
    const yesterdaySalesData = dashboardData.sales.filter(sale => {
        const saleDate = new Date(sale.timestamp || sale.fecha);
        return saleDate.toDateString() === yesterdayString;
    });
    
    const yesterdaySales = yesterdaySalesData.reduce((total, sale) => total + (sale.total || 0), 0);
    const yesterdayOrdersCount = yesterdayOrders.length;
    
    // Calcular porcentajes de cambio
    const salesChangePercent = calculatePercentageChange(yesterdaySales, todaySales);
    const ordersChangePercent = calculatePercentageChange(yesterdayOrdersCount, todayOrders);
    
    // Los elementos con data-change deben existir en el HTML para mostrar cambios
    updateChangeIndicator('salesChange', salesChangePercent);
    updateChangeIndicator('ordersChange', ordersChangePercent);
}

function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) {
        return newValue > 0 ? 100 : 0;
    }
    return ((newValue - oldValue) / oldValue) * 100;
}

function updateChangeIndicator(elementId, percentage) {
    const element = document.querySelector(`[data-change="${elementId}"]`);
    if (element) {
        const isPositive = percentage >= 0;
        const absPercentage = Math.abs(percentage);
        
        element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
        element.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            <span>${isPositive ? '+' : '-'}${absPercentage.toFixed(1)}% vs ayer</span>
        `;
    }
}

function loadRecentOrders() {
    try {
        const ordersContainer = document.getElementById('recentOrders');
        if (!ordersContainer) return;
        
        // Obtener los últimos 5 pedidos
        const recentOrders = dashboardData.orders
            .sort((a, b) => new Date(b.timestamp || b.fecha) - new Date(a.timestamp || a.fecha))
            .slice(0, 5);
        
        if (recentOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No hay pedidos recientes</p>
                </div>
            `;
            return;
        }
        
        const ordersHTML = recentOrders.map(order => {
            const orderDate = new Date(order.timestamp || order.fecha);
            const timeAgo = getTimeAgo(orderDate);
            const statusClass = getOrderStatusClass(order.estado || order.status || 'pendiente');
            const statusText = getOrderStatusText(order.estado || order.status || 'pendiente');
            
            return `
                <div class="order-item">
                    <div class="order-info">
                        <div class="order-id">Pedido #${order.id}</div>
                        <div class="order-details">
                            <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                            <span><i class="fas fa-table"></i> Mesa ${order.mesa || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="order-status">
                        <span class="status ${statusClass}">${statusText}</span>
                        <span class="amount">${db.formatCurrency(order.total || 0)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        ordersContainer.innerHTML = ordersHTML;
        
    } catch (error) {
        console.error('Error al cargar pedidos recientes:', error);
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
}

function getOrderStatusClass(status) {
    const statusMap = {
        'pendiente': 'pending',
        'preparando': 'preparing',
        'listo': 'ready',
        'entregado': 'delivered',
        'completado': 'delivered'
    };
    return statusMap[status.toLowerCase()] || 'pending';
}

function getOrderStatusText(status) {
    const statusMap = {
        'pendiente': 'Pendiente',
        'preparando': 'Preparando',
        'listo': 'Listo',
        'entregado': 'Entregado',
        'completado': 'Completado'
    };
    return statusMap[status.toLowerCase()] || 'Pendiente';
}

function loadPopularProducts() {
    try {
        const productsContainer = document.getElementById('popularProducts');
        if (!productsContainer) return;
        
        // Análisis de productos más vendidos basado en ventas
        const productSales = {};
        
        dashboardData.sales.forEach(sale => {
            if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach(item => {
                    const productName = item.nombre || item.name || 'Producto';
                    if (!productSales[productName]) {
                        productSales[productName] = {
                            name: productName,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[productName].quantity += item.cantidad || item.quantity || 1;
                    productSales[productName].revenue += (item.precio || item.price || 0) * (item.cantidad || item.quantity || 1);
                });
            }
        });
        
        // Convertir a array y ordenar por cantidad vendida
        const popularProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
        
        if (popularProducts.length === 0) {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box"></i>
                    <p>No hay datos de productos</p>
                </div>
            `;
            return;
        }
        
        const productsHTML = popularProducts.map((product, index) => `
            <div class="product-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-stats">
                        <span>${product.quantity} vendidos</span>
                        <span class="revenue">${db.formatCurrency(product.revenue)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        productsContainer.innerHTML = productsHTML;
        
    } catch (error) {
        console.error('Error al cargar productos populares:', error);
    }
}

function refreshDashboard() {
    console.log('Actualizando dashboard...');
    loadDashboardData();
    updateDashboardStats();
    loadRecentOrders();
    loadPopularProducts();
    updateCurrentDateTime();
}

// Función de notificación (si no existe en otro archivo)
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : '#4caf50'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span style="margin-left: 8px;">${message}</span>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// Funciones de utilidad para logout y reportes
function logout() {
    if (typeof authGuard !== 'undefined') {
        authGuard.handleLogout();
    } else {
        localStorage.removeItem('userLoggedIn');
        window.location.href = 'login.html';
    }
}

function printDailyReport() {
    try {
        // Crear ventana de impresión con reporte del día
        const printWindow = window.open('', '_blank');
        const reportDate = new Date().toLocaleDateString('es-ES');
        
        const reportHTML = `
            <html>
                <head>
                    <title>Reporte Diario - ${reportDate}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                        .stat-item { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                        .stat-value { font-size: 24px; font-weight: bold; color: #4caf50; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Crêpes & Kaffee</h1>
                        <h2>Reporte Diario - ${reportDate}</h2>
                    </div>
                    <div class="stats">
                        <div class="stat-item">
                            <h3>Ventas del Día</h3>
                            <div class="stat-value">${document.getElementById('dailySales')?.textContent || '$0'}</div>
                        </div>
                        <div class="stat-item">
                            <h3>Pedidos Realizados</h3>
                            <div class="stat-value">${document.getElementById('dailyOrders')?.textContent || '0'}</div>
                        </div>
                        <div class="stat-item">
                            <h3>Clientes Atendidos</h3>
                            <div class="stat-value">${document.getElementById('dailyCustomers')?.textContent || '0'}</div>
                        </div>
                        <div class="stat-item">
                            <h3>Estado de Mesas</h3>
                            <div class="stat-value">${document.getElementById('occupiedTables')?.textContent || '0/0'}</div>
                        </div>
                    </div>
                </body>
            </html>
        `;
        
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.print();
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showNotification('Error al generar el reporte', 'error');
    }
}

// Agregar estilos para animaciones de notificación
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
`;
document.head.appendChild(style);

console.log('Dashboard script cargado correctamente');
