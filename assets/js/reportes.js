// Sistema de Reportes y Analíticas Avanzadas - Crêpes & Kaffee
class ReportesManager {
    constructor() {
        if (typeof Database === 'undefined') {
            throw new Error('Database class is required but not found');
        }
        
        this.db = new Database();
        this.currentPeriod = 'month';
        this.customDateRange = {
            start: null,
            end: null
        };
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.setupDatePickers();
    }

    setupEventListeners() {
        // Filtros de período
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('period-btn')) {
                document.querySelectorAll('.period-btn').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
                
                this.currentPeriod = e.target.dataset.period;
                this.loadReportData();
            }
        });

        // Exportación
        document.addEventListener('click', (e) => {
            if (e.target.closest('.export-btn')) {
                const format = e.target.closest('.export-btn').dataset.format;
                this.exportReport(format);
            }
        });

        // Filtro personalizado
        const customRangeBtn = document.getElementById('customRangeBtn');
        if (customRangeBtn) {
            customRangeBtn.addEventListener('click', () => this.showCustomDateModal());
        }

        // Actualización automática
        const refreshBtn = document.getElementById('refreshReportsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
    }

    setupDatePickers() {
        // Configurar date pickers si están disponibles
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && endDateInput) {
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);
            
            startDateInput.value = lastMonth.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        }
    }

    loadInitialData() {
        this.loadReportData();
    }

    loadReportData() {
        try {
            const summary = this.db.getExecutiveSummary(this.currentPeriod);
            
            this.updateOverviewCards(summary.overview);
            this.updateTopProductsTable(summary.topProducts);
            this.updateCategoryChart(summary.categoryAnalytics);
            this.updatePaymentMethodChart(summary.paymentAnalytics);
            this.updateSalesTrendChart(summary.trends);
            this.updateCashierPerformanceTable(summary.cashierPerformance);
            this.updateProfitabilityTable(summary.topProducts);
            this.generateInsights(summary);
            
            this.showNotification('Reportes actualizados exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al cargar datos de reportes:', error);
            this.showNotification('Error al cargar los reportes', 'error');
        }
    }

    // === ACTUALIZACIÓN DE COMPONENTES ===
    updateOverviewCards(overview) {
        const cards = {
            totalSales: document.getElementById('totalSalesCard'),
            totalProfit: document.getElementById('totalProfitCard'),
            avgTicket: document.getElementById('avgTicketCard'),
            transactions: document.getElementById('transactionsCard'),
            profitMargin: document.getElementById('profitMarginCard'),
            totalCost: document.getElementById('totalCostCard')
        };

        if (cards.totalSales) {
            cards.totalSales.textContent = `$${overview.totalSales.toLocaleString()}`;
        }
        
        if (cards.totalProfit) {
            cards.totalProfit.textContent = `$${overview.totalProfit.toLocaleString()}`;
            cards.totalProfit.className = overview.totalProfit >= 0 ? 'metric-value positive' : 'metric-value negative';
        }
        
        if (cards.avgTicket) {
            cards.avgTicket.textContent = `$${Math.round(overview.avgTicket).toLocaleString()}`;
        }
        
        if (cards.transactions) {
            cards.transactions.textContent = overview.totalTransactions.toLocaleString();
        }
        
        if (cards.profitMargin) {
            cards.profitMargin.textContent = `${overview.profitMargin.toFixed(1)}%`;
            cards.profitMargin.className = overview.profitMargin >= 20 ? 'metric-value positive' : 
                                         overview.profitMargin >= 10 ? 'metric-value neutral' : 'metric-value negative';
        }
        
        if (cards.totalCost) {
            cards.totalCost.textContent = `$${overview.totalCost.toLocaleString()}`;
        }
    }

    updateTopProductsTable(topProducts) {
        const tbody = document.getElementById('topProductsTableBody');
        if (!tbody) return;

        tbody.innerHTML = topProducts.map((product, index) => {
            const profitMargin = product.revenue > 0 ? ((product.profit / product.revenue) * 100) : 0;
            return `
                <tr>
                    <td>
                        <div class="product-rank">${index + 1}</div>
                    </td>
                    <td>
                        <div class="product-name">${product.productName}</div>
                        <div class="product-category">${this.getCategoryLabel(product.category)}</div>
                    </td>
                    <td class="text-center">${product.quantitySold}</td>
                    <td class="text-right">$${product.revenue.toLocaleString()}</td>
                    <td class="text-right">$${product.cost.toLocaleString()}</td>
                    <td class="text-right">
                        <span class="profit ${product.profit >= 0 ? 'positive' : 'negative'}">
                            $${product.profit.toLocaleString()}
                        </span>
                    </td>
                    <td class="text-right">
                        <span class="margin ${profitMargin >= 30 ? 'excellent' : profitMargin >= 20 ? 'good' : profitMargin >= 10 ? 'fair' : 'poor'}">
                            ${profitMargin.toFixed(1)}%
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateCategoryChart(categoryData) {
        const container = document.getElementById('categoryChart');
        if (!container) return;

        const total = categoryData.reduce((sum, cat) => sum + cat.revenue, 0);
        
        container.innerHTML = `
            <div class="chart-legend">
                ${categoryData.map(category => {
                    const percentage = total > 0 ? (category.revenue / total * 100) : 0;
                    return `
                        <div class="legend-item">
                            <div class="legend-color" style="background: ${this.getCategoryColor(category.category)}"></div>
                            <div class="legend-info">
                                <div class="legend-label">${this.getCategoryLabel(category.category)}</div>
                                <div class="legend-value">$${category.revenue.toLocaleString()} (${percentage.toFixed(1)}%)</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="chart-container">
                <canvas id="categoryPieChart" width="300" height="300"></canvas>
            </div>
        `;

        // Crear gráfico si hay una librería de charts disponible
        this.createPieChart('categoryPieChart', categoryData);
    }

    updatePaymentMethodChart(paymentData) {
        const container = document.getElementById('paymentMethodChart');
        if (!container) return;

        const methods = Object.keys(paymentData);
        const total = methods.reduce((sum, method) => sum + paymentData[method].total, 0);

        container.innerHTML = `
            <div class="payment-stats">
                ${methods.map(method => {
                    const data = paymentData[method];
                    const percentage = data.percentage || 0;
                    
                    // Desglose especial para pagos mixtos
                    if (method === 'mixto' && data.cashPart > 0 && data.cardPart > 0) {
                        const cashPercentage = total > 0 ? (data.cashPart / total) * 100 : 0;
                        const cardPercentage = total > 0 ? (data.cardPart / total) * 100 : 0;
                        
                        return `
                            <div class="payment-method">
                                <div class="payment-header">
                                    <span class="payment-name">${this.getPaymentMethodLabel(method)}</span>
                                    <span class="payment-percentage">${percentage.toFixed(1)}%</span>
                                </div>
                                <div class="payment-bar">
                                    <div class="payment-fill" style="width: ${percentage}%; background: ${this.getPaymentMethodColor(method)}"></div>
                                </div>
                                <div class="payment-details">
                                    <span>$${data.total.toLocaleString()}</span>
                                    <span>${data.count} transacciones</span>
                                    <span>Promedio: $${Math.round(data.avgTicket).toLocaleString()}</span>
                                </div>
                                <div class="payment-breakdown">
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">• Efectivo:</span>
                                        <span class="breakdown-value">$${data.cashPart.toLocaleString()} (${cashPercentage.toFixed(1)}%)</span>
                                    </div>
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">• Transferencia:</span>
                                        <span class="breakdown-value">$${data.cardPart.toLocaleString()} (${cardPercentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="payment-method">
                            <div class="payment-header">
                                <span class="payment-name">${this.getPaymentMethodLabel(method)}</span>
                                <span class="payment-percentage">${percentage.toFixed(1)}%</span>
                            </div>
                            <div class="payment-bar">
                                <div class="payment-fill" style="width: ${percentage}%; background: ${this.getPaymentMethodColor(method)}"></div>
                            </div>
                            <div class="payment-details">
                                <span>$${data.total.toLocaleString()}</span>
                                <span>${data.count} transacciones</span>
                                <span>Promedio: $${Math.round(data.avgTicket).toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    updateSalesTrendChart(trendsData) {
        const container = document.getElementById('salesTrendChart');
        if (!container) return;

        // Crear gráfico de líneas simple con CSS
        const maxSales = Math.max(...trendsData.map(d => d.sales));
        const minSales = Math.min(...trendsData.map(d => d.sales));
        const range = maxSales - minSales || 1;

        container.innerHTML = `
            <div class="trend-chart">
                <div class="chart-header">
                    <h4>Tendencia de Ventas (Últimos ${trendsData.length} días)</h4>
                </div>
                <div class="chart-area">
                    <div class="chart-y-axis">
                        <span>$${maxSales.toLocaleString()}</span>
                        <span>$${Math.round((maxSales + minSales) / 2).toLocaleString()}</span>
                        <span>$${minSales.toLocaleString()}</span>
                    </div>
                    <div class="chart-line">
                        ${trendsData.map((point, index) => {
                            const height = ((point.sales - minSales) / range) * 100;
                            const left = (index / (trendsData.length - 1)) * 100;
                            return `
                                <div class="chart-point" 
                                     style="left: ${left}%; bottom: ${height}%"
                                     title="${new Date(point.date).toLocaleDateString()}: $${point.sales.toLocaleString()}">
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="chart-summary">
                    <div class="trend-stats">
                        <span>Promedio: $${Math.round(trendsData.reduce((sum, d) => sum + d.sales, 0) / trendsData.length).toLocaleString()}</span>
                        <span>Mejor día: $${maxSales.toLocaleString()}</span>
                        <span>Total período: $${trendsData.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateCashierPerformanceTable(cashierData) {
        const tbody = document.getElementById('cashierPerformanceTableBody');
        if (!tbody) return;

        tbody.innerHTML = cashierData.map((cashier, index) => `
            <tr>
                <td>
                    <div class="cashier-rank">${index + 1}</div>
                </td>
                <td>
                    <div class="cashier-name">${cashier.userName}</div>
                </td>
                <td class="text-center">${cashier.sessionsCount}</td>
                <td class="text-right">$${cashier.totalSales.toLocaleString()}</td>
                <td class="text-right">$${Math.round(cashier.avgSessionSales).toLocaleString()}</td>
                <td class="text-right">${(cashier.avgSessionTimeHours || 0).toFixed(1)}h</td>
                <td class="text-right">
                    <span class="cash-diff ${cashier.cashDifferences === 0 ? 'perfect' : cashier.cashDifferences < 5000 ? 'good' : 'attention'}">
                        $${cashier.cashDifferences.toLocaleString()}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    updateProfitabilityTable(productsData) {
        const tbody = document.getElementById('profitabilityTableBody');
        if (!tbody) return;

        const sortedProducts = [...productsData].sort((a, b) => {
            const marginA = a.revenue > 0 ? (a.profit / a.revenue) * 100 : 0;
            const marginB = b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0;
            return marginB - marginA;
        });

        tbody.innerHTML = sortedProducts.map((product, index) => {
            const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
            const roi = product.cost > 0 ? (product.profit / product.cost) * 100 : 0;
            
            return `
                <tr>
                    <td>${product.productName}</td>
                    <td class="text-right">$${product.cost.toLocaleString()}</td>
                    <td class="text-right">$${product.revenue.toLocaleString()}</td>
                    <td class="text-right">
                        <span class="profit ${product.profit >= 0 ? 'positive' : 'negative'}">
                            $${product.profit.toLocaleString()}
                        </span>
                    </td>
                    <td class="text-right">
                        <span class="margin ${margin >= 40 ? 'excellent' : margin >= 30 ? 'good' : margin >= 20 ? 'fair' : 'poor'}">
                            ${margin.toFixed(1)}%
                        </span>
                    </td>
                    <td class="text-right">
                        <span class="roi ${roi >= 100 ? 'excellent' : roi >= 50 ? 'good' : roi >= 25 ? 'fair' : 'poor'}">
                            ${roi.toFixed(1)}%
                        </span>
                    </td>
                    <td class="text-center">${product.quantitySold}</td>
                </tr>
            `;
        }).join('');
    }

    // === UTILIDADES ===
    getCategoryLabel(category) {
        const labels = {
            'bebidas-calientes': 'Bebidas Calientes',
            'bebidas-frias': 'Bebidas Frías',
            'bebidas-sin-cafe': 'Sin Café',
            'crepes-dulces': 'Crêpes Dulces',
            'crepes-salados': 'Crêpes Salados',
            'postres': 'Postres',
            'entradas': 'Entradas',
            'sin-categoria': 'Sin Categoría'
        };
        return labels[category] || category;
    }

    getCategoryColor(category) {
        const colors = {
            'bebidas-calientes': '#ff6b6b',
            'bebidas-frias': '#4ecdc4',
            'bebidas-sin-cafe': '#45b7d1',
            'crepes-dulces': '#f39c12',
            'crepes-salados': '#e74c3c',
            'postres': '#9b59b6',
            'entradas': '#2ecc71',
            'sin-categoria': '#95a5a6'
        };
        return colors[category] || '#95a5a6';
    }

    getPaymentMethodLabel(method) {
        const labels = {
            'efectivo': 'Efectivo',
            'tarjeta': 'Tarjeta',
            'transferencia': 'Transferencia',
            'mixto': 'Mixto'
        };
        return labels[method] || method;
    }

    getPaymentMethodColor(method) {
        const colors = {
            'efectivo': '#2ecc71',
            'tarjeta': '#3498db',
            'transferencia': '#9b59b6',
            'mixto': '#f39c12'
        };
        return colors[method] || '#95a5a6';
    }

    // === EXPORTACIÓN ===
    exportReport(format) {
        try {
            const summary = this.db.getExecutiveSummary(this.currentPeriod);
            
            switch (format) {
                case 'csv':
                    this.exportToCSV(summary);
                    break;
                case 'json':
                    this.exportToJSON(summary);
                    break;
                case 'print':
                    this.printReport(summary);
                    break;
                default:
                    this.showNotification('Formato de exportación no soportado', 'error');
            }
        } catch (error) {
            console.error('Error al exportar reporte:', error);
            this.showNotification('Error al exportar el reporte', 'error');
        }
    }

    exportToCSV(summary) {
        let csv = 'Reporte de Ventas - Crêpes & Kaffee\n\n';
        
        // Resumen general
        csv += 'RESUMEN GENERAL\n';
        csv += `Período,${summary.period.label}\n`;
        csv += `Total Ventas,$${summary.overview.totalSales}\n`;
        csv += `Total Costos,$${summary.overview.totalCost}\n`;
        csv += `Ganancia Total,$${summary.overview.totalProfit}\n`;
        csv += `Margen de Ganancia,${summary.overview.profitMargin.toFixed(2)}%\n`;
        csv += `Transacciones,${summary.overview.totalTransactions}\n`;
        csv += `Ticket Promedio,$${summary.overview.avgTicket.toFixed(2)}\n\n`;
        
        // Productos más vendidos
        csv += 'PRODUCTOS MAS VENDIDOS\n';
        csv += 'Producto,Cantidad,Ingresos,Costo,Ganancia,Margen\n';
        summary.topProducts.forEach(product => {
            const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
            csv += `"${product.productName}",${product.quantitySold},$${product.revenue},$${product.cost},$${product.profit},${margin.toFixed(2)}%\n`;
        });
        
        this.downloadFile(csv, `reporte-ventas-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    exportToJSON(summary) {
        const jsonData = JSON.stringify(summary, null, 2);
        this.downloadFile(jsonData, `reporte-ventas-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification(`Archivo ${filename} descargado exitosamente`, 'success');
    }

    printReport(summary) {
        // Obtener TODOS los productos vendidos (no solo top 5)
        const allProductsSold = this.db.getTopSellingProducts(1000, new Date(summary.period.startDate), new Date(summary.period.endDate));
        
        const printContent = this.generatePrintableReport(summary, allProductsSold);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    generatePrintableReport(summary, allProductsSold = null) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Ventas - Crêpes & Kaffee</title>
                <style>
                    @page { size: 80mm auto; margin: 4mm 2mm; }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 2mm;
                        width: 72mm;
                        font-size: 9px;
                        line-height: 1.2;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 8px;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 4px;
                    }
                    .header h1 { 
                        font-size: 14px; 
                        margin: 0 0 2px 0; 
                        font-weight: bold;
                    }
                    .header h2 { 
                        font-size: 12px; 
                        margin: 0 0 2px 0; 
                    }
                    .header p { 
                        font-size: 8px; 
                        margin: 1px 0; 
                    }
                    .section { 
                        margin-bottom: 8px;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 4px;
                    }
                    .section h3 {
                        font-size: 11px;
                        margin: 0 0 4px 0;
                        text-align: center;
                        font-weight: bold;
                    }
                    .metrics {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }
                    .metric {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 2px 0;
                        font-size: 9px;
                        border-bottom: 1px dotted #ccc;
                    }
                    .metric:last-child { border-bottom: none; }
                    .metric-label { font-weight: bold; }
                    .metric-value { font-weight: bold; text-align: right; }
                    .product-table {
                        width: 100%;
                        font-size: 7px;
                        margin-top: 4px;
                    }
                    .product-header {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                        border-bottom: 1px solid #000;
                        padding-bottom: 2px;
                        margin-bottom: 2px;
                        font-size: 8px;
                    }
                    .product-header .col1 { width: 40%; }
                    .product-header .col2 { width: 15%; text-align: center; }
                    .product-header .col3 { width: 22%; text-align: right; }
                    .product-header .col4 { width: 23%; text-align: right; }
                    .product-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1px;
                        padding: 1px 0;
                        font-size: 7px;
                    }
                    .product-row .col1 { 
                        width: 40%; 
                        font-weight: bold;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .product-row .col2 { width: 15%; text-align: center; }
                    .product-row .col3 { width: 22%; text-align: right; }
                    .product-row .col4 { width: 23%; text-align: right; font-weight: bold; }
                    .positive { color: #000; }
                    .negative { color: #000; }
                    .detail-note {
                        font-size: 7px;
                        font-style: italic;
                        text-align: center;
                        margin-bottom: 4px;
                    }
                    @media print { 
                        body { margin: 0; padding: 2mm; }
                        .positive, .negative { color: #000 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CRÊPES & KAFFEE</h1>
                    <h2>Reporte de Ventas</h2>
                    <p>Período: ${summary.period.label}</p>
                    <p>Generado: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="section">
                    <h3>Resumen General</h3>
                    <div class="metrics">
                        <div class="metric">
                            <span class="metric-label">Total Ventas:</span>
                            <span class="metric-value">$${summary.overview.totalSales.toLocaleString()}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Ganancia Total:</span>
                            <span class="metric-value ${summary.overview.totalProfit >= 0 ? 'positive' : 'negative'}">
                                $${summary.overview.totalProfit.toLocaleString()}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Margen:</span>
                            <span class="metric-value">${summary.overview.profitMargin.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Productos Más Vendidos</h3>
                    <div class="product-table">
                        <div class="product-header">
                            <span class="col1">Producto</span>
                            <span class="col2">Cant</span>
                            <span class="col3">Ingresos</span>
                            <span class="col4">Ganancia</span>
                        </div>
                        ${summary.topProducts.map(product => {
                            const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                            const productName = product.productName.length > 18 ? 
                                product.productName.substring(0, 15) + '...' : 
                                product.productName;
                            return `
                                <div class="product-row">
                                    <span class="col1">${productName}</span>
                                    <span class="col2">${product.quantitySold}</span>
                                    <span class="col3">$${product.revenue.toLocaleString()}</span>
                                    <span class="col4 ${product.profit >= 0 ? 'positive' : 'negative'}">
                                        $${product.profit.toLocaleString()}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                ${allProductsSold && allProductsSold.length > 0 ? `
                <div class="section">
                    <h3>Detalle Completo</h3>
                    <div class="detail-note">Todos los productos (${allProductsSold.length} diferentes)</div>
                    <div class="product-table">
                        <div class="product-header">
                            <span class="col1">Producto</span>
                            <span class="col2">Cant</span>
                            <span class="col3">Ingresos</span>
                            <span class="col4">Ganancia</span>
                        </div>
                        ${allProductsSold.map(product => {
                            const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                            const productName = product.productName.length > 18 ? 
                                product.productName.substring(0, 15) + '...' : 
                                product.productName;
                            return `
                                <div class="product-row">
                                    <span class="col1">${productName}</span>
                                    <span class="col2">${product.quantitySold}</span>
                                    <span class="col3">$${product.revenue.toLocaleString()}</span>
                                    <span class="col4 ${product.profit >= 0 ? 'positive' : 'negative'}">
                                        $${product.profit.toLocaleString()}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
            </body>
            </html>
        `;
    }

    // === MODALES Y UI ===
    showCustomDateModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'customDateModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📅 Período Personalizado</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="customStartDate">Fecha de inicio:</label>
                        <input type="date" id="customStartDate" class="form-control" 
                               value="${new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="customEndDate">Fecha de fin:</label>
                        <input type="date" id="customEndDate" class="form-control" 
                               value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="reportesManager.applyCustomDateRange()">
                        Aplicar Filtro
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    applyCustomDateRange() {
        const startDate = document.getElementById('customStartDate').value;
        const endDate = document.getElementById('customEndDate').value;
        
        if (!startDate || !endDate) {
            this.showNotification('Seleccione ambas fechas', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            this.showNotification('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
            return;
        }
        
        this.customDateRange.start = new Date(startDate);
        this.customDateRange.end = new Date(endDate);
        this.currentPeriod = 'custom';
        
        // Actualizar botones
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        
        // Cargar datos con rango personalizado
        this.loadCustomRangeData();
        
        // Cerrar modal
        document.getElementById('customDateModal').remove();
        
        this.showNotification(`Reporte actualizado para período ${startDate} a ${endDate}`, 'success');
    }

    loadCustomRangeData() {
        try {
            const analytics = this.db.getSalesAnalytics(this.customDateRange.start, this.customDateRange.end);
            const topProducts = this.db.getTopSellingProducts(10, this.customDateRange.start, this.customDateRange.end);
            const categoryAnalytics = this.db.getCategoryAnalytics(this.customDateRange.start, this.customDateRange.end);
            const paymentAnalytics = this.db.getPaymentMethodAnalytics(this.customDateRange.start, this.customDateRange.end);
            const cashierPerformance = this.db.getCashierPerformance(this.customDateRange.start, this.customDateRange.end);
            
            this.updateOverviewCards(analytics.overview);
            this.updateTopProductsTable(topProducts);
            this.updateCategoryChart(categoryAnalytics);
            this.updatePaymentMethodChart(paymentAnalytics);
            this.updateCashierPerformanceTable(cashierPerformance);
            this.updateProfitabilityTable(topProducts);
            
        } catch (error) {
            console.error('Error al cargar datos de rango personalizado:', error);
            this.showNotification('Error al cargar datos del período personalizado', 'error');
        }
    }

    refreshData() {
        this.loadReportData();
        this.showNotification('Datos actualizados', 'success');
    }

    // === INSIGHTS AUTOMÁTICOS ===
    generateInsights(summary) {
        const container = document.getElementById('insightsContent');
        if (!container) return;

        const insights = this.analyzeBusinessData(summary);
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <i class="fas fa-${insight.icon}"></i>
                <div>
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-description">${insight.description}</div>
                    ${insight.recommendation ? `<div class="insight-recommendation">💡 ${insight.recommendation}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    analyzeBusinessData(summary) {
        const insights = [];
        const { overview, topProducts, categoryAnalytics, paymentAnalytics, cashierPerformance } = summary;

        // 1. Análisis de margen de ganancia
        if (overview.profitMargin < 15) {
            insights.push({
                icon: 'exclamation-triangle',
                title: 'Margen de Ganancia Bajo',
                description: `El margen actual es del ${overview.profitMargin.toFixed(1)}%, por debajo del objetivo del 20%.`,
                recommendation: 'Revisa los costos de productos con bajo margen y considera ajustar precios.'
            });
        } else if (overview.profitMargin > 30) {
            insights.push({
                icon: 'trophy',
                title: 'Excelente Margen de Ganancia',
                description: `El margen actual es del ${overview.profitMargin.toFixed(1)}%, superando las expectativas.`,
                recommendation: 'Mantén este rendimiento y considera expandir productos rentables.'
            });
        }

        // 2. Análisis de productos top
        if (topProducts.length > 0) {
            const bestProduct = topProducts[0];
            const worstMarginProduct = topProducts.reduce((worst, product) => {
                const currentMargin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                const worstMargin = worst.revenue > 0 ? (worst.profit / worst.revenue) * 100 : 0;
                return currentMargin < worstMargin ? product : worst;
            });

            insights.push({
                icon: 'star',
                title: 'Producto Estrella',
                description: `"${bestProduct.productName}" es tu producto más vendido con ${bestProduct.quantitySold} unidades y $${bestProduct.revenue.toLocaleString()} en ingresos.`,
                recommendation: 'Asegúrate de mantener stock suficiente y considera promocionarlo más.'
            });

            const worstMargin = worstMarginProduct.revenue > 0 ? (worstMarginProduct.profit / worstMarginProduct.revenue) * 100 : 0;
            if (worstMargin < 10) {
                insights.push({
                    icon: 'exclamation-circle',
                    title: 'Producto con Bajo Margen',
                    description: `"${worstMarginProduct.productName}" tiene un margen de solo ${worstMargin.toFixed(1)}%.`,
                    recommendation: 'Revisa los costos de este producto o considera ajustar su precio.'
                });
            }
        }

        // 3. Análisis de categorías
        if (categoryAnalytics.length > 0) {
            const topCategory = categoryAnalytics[0];
            const totalCategoryRevenue = categoryAnalytics.reduce((sum, cat) => sum + cat.revenue, 0);
            const topCategoryPercentage = (topCategory.revenue / totalCategoryRevenue) * 100;

            if (topCategoryPercentage > 50) {
                insights.push({
                    icon: 'chart-pie',
                    title: 'Dependencia de Categoría',
                    description: `${this.getCategoryLabel(topCategory.category)} representa el ${topCategoryPercentage.toFixed(1)}% de tus ventas.`,
                    recommendation: 'Considera diversificar tu oferta para reducir riesgo de dependencia.'
                });
            }
        }

        // 4. Análisis de métodos de pago
        const effectivo = paymentAnalytics.efectivo;
        const tarjeta = paymentAnalytics.tarjeta;
        
        if (efectivo && efectivo.percentage > 70) {
            insights.push({
                icon: 'money-bill-wave',
                title: 'Alto Uso de Efectivo',
                description: `El ${efectivo.percentage.toFixed(1)}% de las transacciones son en efectivo.`,
                recommendation: 'Considera promocionar pagos digitales para mayor seguridad y control.'
            });
        }

        // 5. Análisis de ticket promedio
        if (overview.avgTicket < 15000) {
            insights.push({
                icon: 'arrow-up',
                title: 'Oportunidad de Incrementar Ticket',
                description: `El ticket promedio es de $${Math.round(overview.avgTicket).toLocaleString()}.`,
                recommendation: 'Implementa estrategias de upselling o crea combos atractivos.'
            });
        }

        // 6. Análisis de rendimiento por cajero
        if (cashierPerformance.length > 1) {
            const bestCashier = cashierPerformance[0];
            const worstCashier = cashierPerformance[cashierPerformance.length - 1];
            
            if (bestCashier.totalSales > worstCashier.totalSales * 2) {
                insights.push({
                    icon: 'users',
                    title: 'Diferencia en Rendimiento de Cajeros',
                    description: `Hay diferencias significativas en el rendimiento entre cajeros.`,
                    recommendation: 'Considera capacitación adicional o redistribución de horarios.'
                });
            }
        }

        // 7. Análisis de tendencias (si hay datos suficientes)
        if (summary.trends && summary.trends.length >= 7) {
            const recentDays = summary.trends.slice(-7);
            const olderDays = summary.trends.slice(-14, -7);
            
            const recentAvg = recentDays.reduce((sum, day) => sum + day.sales, 0) / recentDays.length;
            const olderAvg = olderDays.reduce((sum, day) => sum + day.sales, 0) / olderDays.length;
            
            const growth = ((recentAvg - olderAvg) / olderAvg) * 100;
            
            if (growth > 10) {
                insights.push({
                    icon: 'chart-line',
                    title: 'Tendencia Positiva',
                    description: `Las ventas han crecido un ${growth.toFixed(1)}% en la última semana.`,
                    recommendation: 'Identifica qué factores contribuyen a este crecimiento y mantenlos.'
                });
            } else if (growth < -10) {
                insights.push({
                    icon: 'chart-line-down',
                    title: 'Tendencia Decreciente',
                    description: `Las ventas han disminuido un ${Math.abs(growth).toFixed(1)}% en la última semana.`,
                    recommendation: 'Analiza las causas de la disminución y toma acciones correctivas.'
                });
            }
        }

        // Si no hay insights específicos, agregar consejos generales
        if (insights.length === 0) {
            insights.push({
                icon: 'lightbulb',
                title: 'Rendimiento Estable',
                description: 'Tu negocio muestra un rendimiento estable sin alertas críticas.',
                recommendation: 'Continúa monitoreando las métricas y busca oportunidades de optimización.'
            });
        }

        return insights;
    }

    // === GRÁFICOS ===
    createPieChart(canvasId, data) {
        // Implementación básica de gráfico circular con Canvas
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const total = data.reduce((sum, item) => sum + item.revenue, 0);
        let currentAngle = 0;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        data.forEach(item => {
            const sliceAngle = (item.revenue / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = this.getCategoryColor(item.category);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
    }

    // === NOTIFICACIONES ===
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            ${message}
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            background: type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '9999',
            animation: 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Instancia global
let reportesManager;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reportsContainer')) {
        reportesManager = new ReportesManager();
    }
});