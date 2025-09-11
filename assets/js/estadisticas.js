// Estadísticas y Reportes - Sistema POS Crêpes & Kaffee

class EstadisticasManager {
    constructor() {
        this.charts = {};
        this.currentPeriod = 'today';
        this.db = new Database();
        this.initializeEventListeners();
        this.loadStatistics();
    }

    initializeEventListeners() {
        // Botones de período
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePeriod(e.target.dataset.period);
            });
        });

        // Cambio de tipo de gráfico de ventas
        const salesChartType = document.getElementById('salesChartType');
        if (salesChartType) {
            salesChartType.addEventListener('change', () => {
                this.updateSalesTrendChart();
            });
        }

        // Inicializar fechas
        this.initializeDateInputs();
    }

    initializeDateInputs() {
        const today = new Date();
        const endDate = document.getElementById('endDate');
        const startDate = document.getElementById('startDate');
        
        if (endDate) {
            endDate.value = today.toISOString().split('T')[0];
        }
        
        if (startDate) {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            startDate.value = weekAgo.toISOString().split('T')[0];
        }
    }

    changePeriod(period) {
        this.currentPeriod = period;
        
        // Actualizar botones activos
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // Actualizar estadísticas
        this.loadStatistics();
    }

    loadStatistics() {
        const orders = this.getOrdersForPeriod();
        this.updateGeneralStats(orders);
        this.updateCharts(orders);
        this.updateReports(orders);
    }

    getOrdersForPeriod() {
        const orders = this.db.getOrders();
        const now = new Date();
        let startDate, endDate = now;

        switch (this.currentPeriod) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        return orders.filter(order => {
            const orderDate = new Date(order.fecha);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }

    updateGeneralStats(orders) {
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;
        const totalProducts = orders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + item.cantidad, 0), 0);
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Actualizar valores en el DOM
        this.updateStatElement('totalRevenue', `$${totalRevenue.toFixed(2)}`);
        this.updateStatElement('totalOrders', totalOrders.toString());
        this.updateStatElement('totalProducts', totalProducts.toString());
        this.updateStatElement('averageTicket', `$${averageTicket.toFixed(2)}`);

        // Calcular y mostrar cambios porcentuales
        this.updateStatChanges(orders);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateStatChanges(currentOrders) {
        const previousOrders = this.getPreviousPeriodOrders();
        
        const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0);
        const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
        
        const revenueChange = this.calculatePercentageChange(currentRevenue, previousRevenue);
        const ordersChange = this.calculatePercentageChange(currentOrders.length, previousOrders.length);
        
        const currentProducts = currentOrders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + item.cantidad, 0), 0);
        const previousProducts = previousOrders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + item.cantidad, 0), 0);
        
        const productsChange = this.calculatePercentageChange(currentProducts, previousProducts);
        
        const currentAverage = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
        const previousAverage = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
        const averageChange = this.calculatePercentageChange(currentAverage, previousAverage);

        this.updateChangeElement('revenueChange', revenueChange);
        this.updateChangeElement('ordersChange', ordersChange);
        this.updateChangeElement('productsChange', productsChange);
        this.updateChangeElement('averageChange', averageChange);
    }

    calculatePercentageChange(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }

    updateChangeElement(elementId, change) {
        const element = document.getElementById(elementId);
        if (element) {
            const isPositive = change >= 0;
            element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
            element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    getPreviousPeriodOrders() {
        // Implementar lógica para obtener pedidos del período anterior
        return this.db.getOrders().slice(0, 10); // Placeholder
    }

    updateCharts(orders) {
        this.updateSalesTrendChart(orders);
        this.updateTopProductsChart(orders);
        this.updateCategorySalesChart(orders);
        this.updateHourlyAnalysisChart(orders);
        this.updateTableOccupancyChart();
    }

    updateSalesTrendChart(orders = null) {
        if (!orders) orders = this.getOrdersForPeriod();
        
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;

        // Destruir gráfico existente
        if (this.charts.salesTrend) {
            this.charts.salesTrend.destroy();
        }

        const chartType = document.getElementById('salesChartType')?.value || 'daily';
        const data = this.prepareSalesTrendData(orders, chartType);

        this.charts.salesTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Ventas ($)',
                    data: data.values,
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ff6b35',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    prepareSalesTrendData(orders, type) {
        const data = { labels: [], values: [] };
        const salesByPeriod = {};

        orders.forEach(order => {
            const date = new Date(order.fecha);
            let key;

            switch (type) {
                case 'daily':
                    key = date.toLocaleDateString();
                    break;
                case 'weekly':
                    const week = this.getWeekNumber(date);
                    key = `Semana ${week}`;
                    break;
                case 'monthly':
                    key = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                    break;
                default:
                    key = date.toLocaleDateString();
            }

            salesByPeriod[key] = (salesByPeriod[key] || 0) + order.total;
        });

        data.labels = Object.keys(salesByPeriod);
        data.values = Object.values(salesByPeriod);

        return data;
    }

    updateTopProductsChart(orders) {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) return;

        if (this.charts.topProducts) {
            this.charts.topProducts.destroy();
        }

        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productSales[item.nombre] = (productSales[item.nombre] || 0) + item.cantidad;
            });
        });

        const sortedProducts = Object.entries(productSales)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        this.charts.topProducts = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedProducts.map(([name]) => name),
                datasets: [{
                    data: sortedProducts.map(([,quantity]) => quantity),
                    backgroundColor: [
                        '#ff6b35',
                        '#4ecdc4',
                        '#45b7d1',
                        '#96ceb4',
                        '#ffeaa7'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    updateCategorySalesChart(orders) {
        const ctx = document.getElementById('categorySalesChart');
        if (!ctx) return;

        if (this.charts.categorySales) {
            this.charts.categorySales.destroy();
        }

        const categorySales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const category = item.categoria || 'Sin categoría';
                categorySales[category] = (categorySales[category] || 0) + (item.precio * item.cantidad);
            });
        });

        this.charts.categorySales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(categorySales),
                datasets: [{
                    label: 'Ventas por Categoría',
                    data: Object.values(categorySales),
                    backgroundColor: 'rgba(255, 107, 53, 0.8)',
                    borderColor: '#ff6b35',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    updateHourlyAnalysisChart(orders) {
        const ctx = document.getElementById('hourlyAnalysisChart');
        if (!ctx) return;

        if (this.charts.hourlyAnalysis) {
            this.charts.hourlyAnalysis.destroy();
        }

        const hourlySales = Array(24).fill(0);
        orders.forEach(order => {
            const hour = new Date(order.fecha).getHours();
            hourlySales[hour] += order.total;
        });

        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);

        this.charts.hourlyAnalysis = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas por Hora',
                    data: hourlySales,
                    backgroundColor: 'rgba(78, 205, 196, 0.8)',
                    borderColor: '#4ecdc4',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    updateTableOccupancyChart() {
        const ctx = document.getElementById('tableOccupancyChart');
        if (!ctx) return;

        if (this.charts.tableOccupancy) {
            this.charts.tableOccupancy.destroy();
        }

        const tables = database.getAllTables();
        const statusCounts = {
            'libre': 0,
            'ocupada': 0,
            'reservada': 0,
            'limpieza': 0
        };

        tables.forEach(table => {
            statusCounts[table.estado] = (statusCounts[table.estado] || 0) + 1;
        });

        this.charts.tableOccupancy = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Libres', 'Ocupadas', 'Reservadas', 'En Limpieza'],
                datasets: [{
                    data: [
                        statusCounts.libre,
                        statusCounts.ocupada,
                        statusCounts.reservada,
                        statusCounts.limpieza
                    ],
                    backgroundColor: [
                        '#4caf50',
                        '#f44336',
                        '#ff9800',
                        '#9e9e9e'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    updateReports(orders) {
        this.updateProductsReport(orders);
        this.updateDailySummaryReport(orders);
    }

    updateProductsReport(orders) {
        const tbody = document.getElementById('productsReportTable');
        if (!tbody) return;

        const productStats = {};
        let totalRevenue = 0;

        orders.forEach(order => {
            order.items.forEach(item => {
                const name = item.nombre;
                if (!productStats[name]) {
                    productStats[name] = { quantity: 0, revenue: 0 };
                }
                productStats[name].quantity += item.cantidad;
                productStats[name].revenue += item.precio * item.cantidad;
                totalRevenue += item.precio * item.cantidad;
            });
        });

        const sortedProducts = Object.entries(productStats)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 10);

        tbody.innerHTML = sortedProducts.map(([name, stats]) => `
            <tr>
                <td>${name}</td>
                <td>${stats.quantity}</td>
                <td>$${stats.revenue.toFixed(2)}</td>
                <td>${((stats.revenue / totalRevenue) * 100).toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    updateDailySummaryReport(orders) {
        const tbody = document.getElementById('dailySummaryTable');
        if (!tbody) return;

        const dailyStats = {};

        orders.forEach(order => {
            const date = new Date(order.fecha).toLocaleDateString();
            if (!dailyStats[date]) {
                dailyStats[date] = { orders: 0, revenue: 0 };
            }
            dailyStats[date].orders += 1;
            dailyStats[date].revenue += order.total;
        });

        const sortedDays = Object.entries(dailyStats)
            .sort(([a], [b]) => new Date(b) - new Date(a));

        tbody.innerHTML = sortedDays.map(([date, stats]) => `
            <tr>
                <td>${date}</td>
                <td>${stats.orders}</td>
                <td>$${stats.revenue.toFixed(2)}</td>
                <td>$${(stats.revenue / stats.orders).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
}

// Funciones globales
function applyDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Por favor selecciona ambas fechas');
        return;
    }
    
    console.log(`Aplicando rango de fechas: ${startDate} a ${endDate}`);
    // Aquí implementarías la lógica para filtrar por rango de fechas personalizado
}

function exportReport(type) {
    console.log(`Exportando reporte: ${type}`);
    
    // Simulación de exportación
    const data = type === 'products' ? 'Reporte de productos...' : 'Reporte diario...';
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.estadisticasManager = new EstadisticasManager();
});
