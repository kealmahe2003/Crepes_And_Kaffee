// Configuración del Sistema - Sistema POS Crêpes & Kaffee

class ConfiguracionManager {
    constructor() {
        this.currentTab = 'general';
        this.db = new Database();
        this.initializeEventListeners();
        this.loadConfiguration();
        this.loadProducts();
        this.loadUsers();
    }

    initializeEventListeners() {
        // Navegación entre tabs
        document.querySelectorAll('.config-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Formularios
        this.setupFormListeners();
        
        // Archivo de restauración
        const restoreFile = document.getElementById('restoreFile');
        if (restoreFile) {
            restoreFile.addEventListener('change', this.handleRestoreFile.bind(this));
        }
    }

    setupFormListeners() {
        // Formulario de información del restaurante
        const restaurantForm = document.querySelector('#general .config-form');
        if (restaurantForm) {
            restaurantForm.addEventListener('submit', this.saveRestaurantInfo.bind(this));
        }

        // Formulario de configuración de operación
        const operationForms = document.querySelectorAll('#general .config-form');
        operationForms.forEach(form => {
            form.addEventListener('submit', this.saveRestaurantInfo.bind(this));
        });

        // Formulario de producto
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', this.saveProduct.bind(this));
        }

        // Configuración de impresoras
        this.setupPrinterListeners();

        // Configuración de respaldos
        this.setupBackupListeners();
    }

    switchTab(tabName) {
        if (!tabName) return;
        
        this.currentTab = tabName;

        // Actualizar tabs activos
        document.querySelectorAll('.config-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Mostrar sección correspondiente
        document.querySelectorAll('.config-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    loadConfiguration() {
        const config = this.getStoredConfig();
        
        // Cargar información del restaurante
        if (config.restaurant) {
            this.populateRestaurantForm(config.restaurant);
        }
        
        // Cargar configuración de operación
        if (config.operation) {
            this.populateOperationForm(config.operation);
        }
        
        // Cargar configuración de impresoras
        if (config.printers) {
            this.populatePrinterForm(config.printers);
        }
        
        // Cargar configuración de respaldos
        if (config.backup) {
            this.populateBackupForm(config.backup);
        }
    }

    getStoredConfig() {
        const defaultConfig = {
            restaurant: {
                name: 'Crêpes & Kaffee',
                phone: '+1 234 567 8900',
                address: 'Calle Principal 123, Ciudad, Estado 12345',
                currency: 'USD',
                timezone: 'UTC-6'
            },
            operation: {
                openTime: '08:00',
                closeTime: '22:00',
                serviceCharge: 10,
                autoCloseOrders: true
            },
            printers: {
                receipt: null,
                kitchen: null,
                paperSize: '80mm',
                copies: 1,
                autoPrintKitchen: true,
                autoPrintReceipt: false
            },
            backup: {
                autoBackup: true,
                backupTime: '02:00'
            }
        };

        const stored = localStorage.getItem('posConfig');
        return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    }

    populateRestaurantForm(data) {
        const fields = ['restaurantName', 'restaurantPhone', 'restaurantAddress', 'currency', 'timezone'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && data[field.replace('restaurant', '').toLowerCase()]) {
                element.value = data[field.replace('restaurant', '').toLowerCase()];
            }
        });
    }

    populateOperationForm(data) {
        const fields = ['openTime', 'closeTime', 'serviceCharge'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && data[field] !== undefined) {
                element.value = data[field];
            }
        });

        const autoClose = document.getElementById('autoCloseOrders');
        if (autoClose && data.autoCloseOrders !== undefined) {
            autoClose.checked = data.autoCloseOrders;
        }
    }

    populatePrinterForm(data) {
        try {
            // Configurar impresoras seleccionadas
            const receiptSelect = document.querySelector('#impresoras .printer-item:first-child select');
            if (receiptSelect && data.receipt) {
                receiptSelect.value = data.receipt;
            }
            
            const kitchenSelect = document.querySelector('#impresoras .printer-item:last-child select');
            if (kitchenSelect && data.kitchen) {
                kitchenSelect.value = data.kitchen;
            }
            
            // Configurar opciones de impresión
            const paperSizeSelect = document.querySelector('#impresoras .print-settings select');
            if (paperSizeSelect && data.paperSize) {
                paperSizeSelect.value = data.paperSize;
            }
            
            const copiesInput = document.querySelector('#impresoras .print-settings input[type="number"]');
            if (copiesInput && data.copies) {
                copiesInput.value = data.copies;
            }
            
            const autoPrintKitchen = document.querySelector('#impresoras .checkbox-group input:first-child');
            if (autoPrintKitchen && data.autoPrintKitchen !== undefined) {
                autoPrintKitchen.checked = data.autoPrintKitchen;
            }
            
            const autoPrintReceipt = document.querySelector('#impresoras .checkbox-group input:last-child');
            if (autoPrintReceipt && data.autoPrintReceipt !== undefined) {
                autoPrintReceipt.checked = data.autoPrintReceipt;
            }
        } catch (error) {
            console.error('Error al cargar configuración de impresoras:', error);
        }
    }

    populateBackupForm(data) {
        try {
            const autoBackup = document.getElementById('autoBackup');
            if (autoBackup && data.autoBackup !== undefined) {
                autoBackup.checked = data.autoBackup;
            }
            
            const backupTime = document.querySelector('#backup input[type="time"]');
            if (backupTime && data.backupTime) {
                backupTime.value = data.backupTime;
            }
        } catch (error) {
            console.error('Error al cargar configuración de respaldos:', error);
        }
    }

    saveRestaurantInfo(e) {
        e.preventDefault();
        
        const config = this.getStoredConfig();
        
        config.restaurant = {
            name: document.getElementById('restaurantName').value,
            phone: document.getElementById('restaurantPhone').value,
            address: document.getElementById('restaurantAddress').value,
            currency: document.getElementById('currency').value,
            timezone: document.getElementById('timezone').value
        };

        config.operation = {
            openTime: document.getElementById('openTime').value,
            closeTime: document.getElementById('closeTime').value,
            serviceCharge: parseFloat(document.getElementById('serviceCharge').value),
            autoCloseOrders: document.getElementById('autoCloseOrders').checked
        };

        this.saveConfig(config);
        this.showNotification('Configuración guardada exitosamente', 'success');
    }

    saveConfig(config) {
        localStorage.setItem('posConfig', JSON.stringify(config));
    }

    // Gestión de Productos
    loadProducts() {
        const products = this.db.getProducts();
        const grid = document.getElementById('productsGrid');
        
        if (!grid) return;

        grid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <h4>${product.name}</h4>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-category">${product.category || 'Sin categoría'}</div>
                <div class="product-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        this.loadCategories();
    }

    loadCategories() {
        const products = this.db.getProducts();
        const categories = [...new Set(products.map(p => p.category).filter(c => c))];
        
        const list = document.getElementById('categoriesList');
        if (!list) return;

        list.innerHTML = categories.map(category => `
            <div class="category-item">
                <span class="category-name">${category}</span>
                <div class="category-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editCategory('${category}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Actualizar select de categorías en el modal
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            categorySelect.innerHTML = `
                <option value="">Seleccionar categoría</option>
                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            `;
        }
    }

    saveProduct(e) {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            cost: parseFloat(document.getElementById('productCost')?.value) || 0,
            category: document.getElementById('productCategory').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            active: document.getElementById('productAvailable')?.checked !== false,
            image: 'assets/img/placeholder.jpg'
        };

        // Validaciones
        if (!productData.name) {
            this.showNotification('El nombre del producto es requerido', 'error');
            return;
        }

        if (productData.price <= 0) {
            this.showNotification('El precio debe ser mayor a 0', 'error');
            return;
        }

        if (!productData.category) {
            this.showNotification('La categoría es requerida', 'error');
            return;
        }

        const form = document.getElementById('productForm');
        const productId = form.dataset.productId;
        const isEdit = form.dataset.mode === 'edit';
        
        if (isEdit && productId) {
            // Editar producto existente
            const updatedProduct = this.db.updateProduct(parseInt(productId), productData);
            if (updatedProduct) {
                this.showNotification('Producto actualizado exitosamente', 'success');
                this.loadProducts();
                this.closeModal('productModal');
                this.resetProductForm();
            } else {
                this.showNotification('Error al actualizar el producto', 'error');
                return;
            }
        } else {
            // Crear nuevo producto
            const newProduct = this.db.addProduct(productData);
            if (newProduct) {
                this.showNotification('Producto creado exitosamente', 'success');
                this.loadProducts();
                this.closeModal('productModal');
                this.resetProductForm();
            } else {
                this.showNotification('Error al crear el producto', 'error');
                return;
            }
        }
    }

    resetProductForm() {
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
            delete form.dataset.productId;
            delete form.dataset.mode;
            document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
        }
    }

    // Gestión de Usuarios
    loadUsers() {
        const users = this.db.getUsers();
        const tbody = document.getElementById('usersTableBody');
        
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.name || 'N/A'}</td>
                <td>${this.getRoleName(user.role)}</td>
                <td>
                    <span class="status-${user.active ? 'active' : 'inactive'}">
                        ${user.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${user.lastAccess ? new Date(user.lastAccess).toLocaleDateString() : 'Nunca'}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getRoleName(role) {
        const roles = {
            'admin': 'Administrador',
            'cashier': 'Cajero',
            'waiter': 'Mesero',
            'kitchen': 'Cocina'
        };
        return roles[role] || role;
    }

    setupPrinterListeners() {
        // Guardado automático de configuración de impresoras
        const printerSelects = document.querySelectorAll('#impresoras select');
        printerSelects.forEach(select => {
            select.addEventListener('change', this.savePrinterConfig.bind(this));
        });

        // Configuración de impresión
        const printSettings = document.querySelectorAll('#impresoras input, #impresoras select');
        printSettings.forEach(input => {
            input.addEventListener('change', this.savePrinterConfig.bind(this));
        });
    }

    setupBackupListeners() {
        // Configuración de respaldos automáticos
        const autoBackupCheckbox = document.getElementById('autoBackup');
        if (autoBackupCheckbox) {
            autoBackupCheckbox.addEventListener('change', this.saveBackupConfig.bind(this));
        }

        // Hora de respaldo automático
        const backupTimeInput = document.querySelector('#backup input[type="time"]');
        if (backupTimeInput) {
            backupTimeInput.addEventListener('change', this.saveBackupConfig.bind(this));
        }
    }

    savePrinterConfig() {
        const config = this.getStoredConfig();
        
        // Obtener configuración de impresoras
        const receiptPrinter = document.querySelector('#impresoras .printer-item:first-child select').value;
        const kitchenPrinter = document.querySelector('#impresoras .printer-item:last-child select').value;
        const paperSize = document.querySelector('#impresoras .print-settings select').value;
        const copies = document.querySelector('#impresoras .print-settings input[type="number"]').value;
        const autoPrintKitchen = document.querySelector('#impresoras .checkbox-group input:first-child').checked;
        const autoPrintReceipt = document.querySelector('#impresoras .checkbox-group input:last-child').checked;

        config.printers = {
            receipt: receiptPrinter,
            kitchen: kitchenPrinter,
            paperSize: paperSize,
            copies: parseInt(copies),
            autoPrintKitchen: autoPrintKitchen,
            autoPrintReceipt: autoPrintReceipt
        };

        this.saveConfig(config);
        this.showNotification('Configuración de impresoras guardada', 'success');
    }

    saveBackupConfig() {
        const config = this.getStoredConfig();
        
        const autoBackup = document.getElementById('autoBackup').checked;
        const backupTime = document.querySelector('#backup input[type="time"]').value;

        config.backup = {
            autoBackup: autoBackup,
            backupTime: backupTime
        };

        this.saveConfig(config);
        this.showNotification('Configuración de respaldos guardada', 'success');
    }

    handleRestoreFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const restoreButton = document.querySelector('button[onclick="restoreBackup()"]');
        if (restoreButton) {
            restoreButton.disabled = false;
            restoreButton.innerHTML = `<i class="fas fa-upload"></i> Restaurar (${file.name})`;
        }

        // Leer y validar el archivo
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                if (backupData.data && backupData.timestamp) {
                    this.showNotification('Archivo de respaldo válido seleccionado', 'success');
                } else {
                    this.showNotification('Archivo de respaldo inválido', 'error');
                    restoreButton.disabled = true;
                }
            } catch (error) {
                this.showNotification('Error al leer el archivo de respaldo', 'error');
                restoreButton.disabled = true;
            }
        };
        reader.readAsText(file);
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            ${message}
        `;
        
        // Estilos inline para la notificación
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

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async cleanOldData() {
        console.log('cleanOldData called'); // Para debug
        
        try {
            // Contar datos que se pueden limpiar
            const orders = this.db.getOrders();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const oldOrders = orders.filter(order => {
                const orderDate = new Date(order.timestamp || order.fecha);
                return orderDate < thirtyDaysAgo;
            });
            
            const cancelledOrders = orders.filter(order => order.estado === 'cancelado');
            const oldDeliveredOrders = orders.filter(order => {
                const orderDate = new Date(order.timestamp || order.fecha);
                return order.estado === 'entregado' && orderDate < sevenDaysAgo;
            });
            
            const totalToClean = oldOrders.length + cancelledOrders.length + oldDeliveredOrders.length;
            
            if (totalToClean === 0) {
                this.showNotification('No hay datos antiguos para limpiar', 'info');
                return;
            }

            const confirmation = await this.showConfirmationModal({
                title: '🧹 Limpiar Datos del Sistema',
                message: '¿Estás seguro de que deseas limpiar los datos antiguos del sistema?',
                details: `
                    <div style="text-align: left; line-height: 1.6;">
                        <strong>Datos que se eliminarán:</strong><br>
                        • Pedidos antiguos (>30 días): <strong>${oldOrders.length}</strong><br>
                        • Pedidos cancelados: <strong>${cancelledOrders.length}</strong><br>
                        • Pedidos entregados (>7 días): <strong>${oldDeliveredOrders.length}</strong><br>
                        <br>
                        <strong>Total a eliminar: ${totalToClean} registros</strong><br>
                        <br>
                        <em>⚠️ Esta acción no se puede deshacer</em>
                    </div>
                `,
                confirmText: 'Sí, Limpiar Datos',
                cancelText: 'Cancelar',
                type: 'danger',
                showInput: true,
                inputPlaceholder: 'Escribe "CONFIRMAR" para proceder',
                inputRequired: true
            });

            if (confirmation.confirmed) {
                if (confirmation.value.toUpperCase() !== 'CONFIRMAR') {
                    this.showNotification('Confirmación incorrecta. Operación cancelada.', 'error');
                    return;
                }
                
                this.executeDataClean();
            }
            
        } catch (error) {
            console.error('Error en cleanOldData:', error);
            this.showNotification('Error al verificar datos para limpieza: ' + error.message, 'error');
        }
    }

    executeDataClean() {
        console.log('executeDataClean called'); // Para debug
        
        try {
            const cleanOrders = document.getElementById('cleanOrders')?.checked || false;
            const cleanCancelled = document.getElementById('cleanCancelledOrders')?.checked || false;
            const cleanDelivered = document.getElementById('cleanDeliveredOrders')?.checked || false;
            const customDate = document.getElementById('customCleanDate')?.value || '';
            
            if (!cleanOrders && !cleanCancelled && !cleanDelivered) {
                this.showNotification('Selecciona al menos una opción de limpieza', 'warning');
                return;
            }

            // Cerrar modal actual
            this.closeModal('cleanDataModal');
            
            // Mostrar confirmación simple
            if (!confirm('¿Estás seguro de que quieres eliminar estos datos? Esta acción no se puede deshacer.')) {
                return;
            }

            this.showNotification('Iniciando limpieza de datos...', 'info');

            // Ejecutar limpieza
            setTimeout(() => {
                let deletedCount = 0;
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                const customDateObj = customDate ? new Date(customDate) : null;

                try {
                    // Limpiar órdenes
                    const orders = this.db.getOrders() || [];
                    const initialOrderCount = orders.length;
                    
                    const ordersToKeep = orders.filter(order => {
                        const orderDate = new Date(order.timestamp || order.createdAt || Date.now());
                        
                        // Limpiar pedidos antiguos (30 días)
                        if (cleanOrders && orderDate < thirtyDaysAgo) {
                            deletedCount++;
                            return false;
                        }
                        
                        // Limpiar pedidos cancelados
                        if (cleanCancelled && (order.estado === 'cancelado' || order.status === 'cancelled' || order.status === 'canceled')) {
                            deletedCount++;
                            return false;
                        }
                        
                        // Limpiar pedidos entregados (7 días)
                        if (cleanDelivered && (order.estado === 'entregado' || order.estado === 'pagado' || order.status === 'delivered' || order.status === 'completed') && orderDate < sevenDaysAgo) {
                            deletedCount++;
                            return false;
                        }
                        
                        // Fecha límite personalizada
                        if (customDateObj && orderDate < customDateObj) {
                            deletedCount++;
                            return false;
                        }
                        
                        return true;
                    });

                    // Actualizar órdenes en la base de datos
                    localStorage.setItem('pos_orders', JSON.stringify(ordersToKeep));

                    // También limpiar ventas relacionadas
                    const sales = JSON.parse(localStorage.getItem('pos_sales') || '[]');
                    const salesToKeep = sales.filter(sale => {
                        const saleDate = new Date(sale.timestamp || sale.createdAt || Date.now());
                        
                        if (cleanOrders && saleDate < thirtyDaysAgo) {
                            return false;
                        }
                        if (customDateObj && saleDate < customDateObj) {
                            return false;
                        }
                        return true;
                    });
                    localStorage.setItem('pos_sales', JSON.stringify(salesToKeep));

                    // Limpiar datos de mesas si tienen órdenes antiguas
                    const tables = JSON.parse(localStorage.getItem('pos_tables') || '[]');
                    let cleanedTables = 0;
                    tables.forEach(table => {
                        if (table.currentOrder) {
                            const orderDate = new Date(table.currentOrder.timestamp || Date.now());
                            if ((cleanOrders && orderDate < thirtyDaysAgo) || 
                                (customDateObj && orderDate < customDateObj)) {
                                table.currentOrder = null;
                                table.estado = 'libre';
                                cleanedTables++;
                            }
                        }
                    });
                    localStorage.setItem('pos_tables', JSON.stringify(tables));

                    this.showNotification(
                        `✅ Limpieza completada: ${deletedCount} pedidos eliminados, ${cleanedTables} mesas limpiadas`, 
                        'success'
                    );

                } catch (error) {
                    console.error('Error al limpiar datos:', error);
                    this.showNotification('❌ Error al limpiar los datos: ' + error.message, 'error');
                }
            }, 500);
            
        } catch (error) {
            console.error('Error en executeDataClean:', error);
            this.showNotification('Error en la función de limpieza: ' + error.message, 'error');
        }
    }

    // ===== SISTEMA DE CONFIRMACIONES MEJORADAS =====
    
    showConfirmationModal(options) {
        return new Promise((resolve) => {
            const {
                title = 'Confirmar Acción',
                message = '¿Estás seguro de realizar esta acción?',
                details = '',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                type = 'warning', // 'warning', 'danger', 'info'
                showInput = false,
                inputPlaceholder = '',
                inputRequired = false
            } = options;

            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
                backdrop-filter: blur(2px);
            `;

            const typeColors = {
                'warning': { bg: '#fff3cd', border: '#ffc107', icon: 'exclamation-triangle', color: '#856404' },
                'danger': { bg: '#f8d7da', border: '#dc3545', icon: 'exclamation-circle', color: '#721c24' },
                'info': { bg: '#d1ecf1', border: '#17a2b8', icon: 'info-circle', color: '#0c5460' }
            };

            const colorScheme = typeColors[type] || typeColors.warning;

            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 0;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                ">
                    <div style="
                        background: ${colorScheme.bg};
                        border-bottom: 2px solid ${colorScheme.border};
                        padding: 20px;
                        text-align: center;
                    ">
                        <i class="fas fa-${colorScheme.icon}" style="
                            font-size: 48px;
                            color: ${colorScheme.color};
                            margin-bottom: 15px;
                        "></i>
                        <h3 style="
                            margin: 0;
                            color: ${colorScheme.color};
                            font-size: 20px;
                            font-weight: 600;
                        ">${title}</h3>
                    </div>
                    
                    <div style="padding: 24px;">
                        <p style="
                            margin: 0 0 15px 0;
                            font-size: 16px;
                            color: #333;
                            line-height: 1.5;
                        ">${message}</p>
                        
                        ${details ? `
                            <div style="
                                background: #f8f9fa;
                                border: 1px solid #e9ecef;
                                border-radius: 8px;
                                padding: 15px;
                                margin: 15px 0;
                                font-size: 14px;
                                color: #666;
                            ">
                                ${details}
                            </div>
                        ` : ''}
                        
                        ${showInput ? `
                            <input type="text" id="confirmationInput" placeholder="${inputPlaceholder}" style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e9ecef;
                                border-radius: 8px;
                                font-size: 14px;
                                margin: 15px 0;
                                box-sizing: border-box;
                            " />
                        ` : ''}
                        
                        <div style="
                            display: flex;
                            gap: 12px;
                            margin-top: 20px;
                        ">
                            <button id="cancelBtn" style="
                                flex: 1;
                                padding: 12px 20px;
                                border: 2px solid #6c757d;
                                background: white;
                                color: #6c757d;
                                border-radius: 8px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">${cancelText}</button>
                            
                            <button id="confirmBtn" style="
                                flex: 1;
                                padding: 12px 20px;
                                border: 2px solid ${colorScheme.border};
                                background: ${colorScheme.border};
                                color: white;
                                border-radius: 8px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('#confirmBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const input = modal.querySelector('#confirmationInput');

            // Función para validar y confirmar
            const handleConfirm = () => {
                if (showInput && inputRequired) {
                    const value = input.value.trim();
                    if (!value) {
                        input.style.borderColor = '#dc3545';
                        input.focus();
                        return;
                    }
                    resolve({ confirmed: true, value });
                } else {
                    resolve({ confirmed: true, value: showInput ? input.value : null });
                }
                modal.remove();
            };

            const handleCancel = () => {
                resolve({ confirmed: false, value: null });
                modal.remove();
            };

            // Event listeners
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            // Cerrar con ESC
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    handleCancel();
                }
            });

            // Confirmar con Enter si no hay input o input no está enfocado
            document.addEventListener('keydown', function enterHandler(e) {
                if (e.key === 'Enter' && (!showInput || document.activeElement !== input)) {
                    document.removeEventListener('keydown', enterHandler);
                    handleConfirm();
                }
            });

            // Focus en input si existe
            if (input) {
                setTimeout(() => input.focus(), 100);
            }

            // Hover effects
            confirmBtn.addEventListener('mouseenter', () => {
                confirmBtn.style.transform = 'translateY(-1px)';
                confirmBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });

            confirmBtn.addEventListener('mouseleave', () => {
                confirmBtn.style.transform = 'translateY(0)';
                confirmBtn.style.boxShadow = 'none';
            });

            cancelBtn.addEventListener('mouseenter', () => {
                cancelBtn.style.background = '#6c757d';
                cancelBtn.style.color = 'white';
            });

            cancelBtn.addEventListener('mouseleave', () => {
                cancelBtn.style.background = 'white';
                cancelBtn.style.color = '#6c757d';
            });
        });
    }
}

// Funciones globales para eventos del DOM
function showAddProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
    }
}

function editProduct(productId) {
    const product = window.configuracionManager.db.getProductById(productId);
    
    if (!product) {
        window.configuracionManager.showNotification('Producto no encontrado', 'error');
        return;
    }

    // Llenar formulario con datos del producto
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCost').value = product.cost || 0;
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productDescription').value = product.description || '';
    
    const availableCheckbox = document.getElementById('productAvailable');
    if (availableCheckbox) {
        availableCheckbox.checked = product.active !== false;
    }

    // Configurar formulario para edición
    const form = document.getElementById('productForm');
    form.dataset.productId = productId;
    form.dataset.mode = 'edit';
    
    document.getElementById('productModalTitle').textContent = 'Editar Producto';
    document.getElementById('productModal').classList.add('active');
}

function deleteProduct(productId) {
    const product = window.configuracionManager.db.getProductById(productId);
    if (!product) {
        window.configuracionManager.showNotification('Producto no encontrado', 'error');
        return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
        const success = window.configuracionManager.db.deleteProduct(productId);
        if (success) {
            window.configuracionManager.loadProducts();
            window.configuracionManager.showNotification('Producto eliminado exitosamente', 'success');
        } else {
            window.configuracionManager.showNotification('Error al eliminar el producto', 'error');
        }
    }
}

function closeModal(modalId) {
    window.configuracionManager.closeModal(modalId);
}

function showAddCategoryModal() {
    const name = prompt('Nombre de la nueva categoría:');
    if (name?.trim()) {
        // Agregar la categoría a la base de datos
        try {
            const categories = window.configuracionManager.db.getProducts()
                .map(p => p.category)
                .filter(c => c);
            
            if (!categories.includes(name.trim())) {
                // Crear un producto temporal para la categoría si no existe
                const tempProduct = {
                    name: `Producto de ${name.trim()}`,
                    price: 0,
                    category: name.trim(),
                    description: 'Producto temporal para categoría',
                    available: false,
                    temporary: true
                };
                
                window.configuracionManager.db.addProduct(tempProduct);
                window.configuracionManager.showNotification('Categoría agregada exitosamente', 'success');
                window.configuracionManager.loadCategories();
                window.configuracionManager.loadProducts();
            } else {
                window.configuracionManager.showNotification('La categoría ya existe', 'warning');
            }
        } catch (error) {
            console.error('Error al agregar categoría:', error);
            window.configuracionManager.showNotification('Error al agregar la categoría', 'error');
        }
    }
}

function editCategory(categoryName) {
    const newName = prompt('Nuevo nombre para la categoría:', categoryName);
    if (newName?.trim() && newName !== categoryName) {
        try {
            // Actualizar todos los productos de esta categoría
            const products = window.configuracionManager.db.getProducts();
            const categoryProducts = products.filter(p => p.category === categoryName);
            
            categoryProducts.forEach(product => {
                window.configuracionManager.db.updateProduct(product.id, { category: newName.trim() });
            });
            
            window.configuracionManager.showNotification('Categoría actualizada exitosamente', 'success');
            window.configuracionManager.loadCategories();
            window.configuracionManager.loadProducts();
        } catch (error) {
            console.error('Error al editar categoría:', error);
            window.configuracionManager.showNotification('Error al editar la categoría', 'error');
        }
    }
}

function deleteCategory(categoryName) {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"?`)) {
        try {
            // Verificar si hay productos en esta categoría
            const products = window.configuracionManager.db.getProducts();
            const categoryProducts = products.filter(p => p.category === categoryName);
            
            if (categoryProducts.length > 0) {
                const moveCategory = confirm(
                    `Esta categoría tiene ${categoryProducts.length} producto(s). ¿Deseas mover los productos a "Sin categoría"?`
                );
                
                if (moveCategory) {
                    categoryProducts.forEach(product => {
                        window.configuracionManager.db.updateProduct(product.id, { category: '' });
                    });
                } else {
                    return; // Cancelar eliminación
                }
            }
            
            window.configuracionManager.showNotification('Categoría eliminada exitosamente', 'success');
            window.configuracionManager.loadCategories();
            window.configuracionManager.loadProducts();
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            window.configuracionManager.showNotification('Error al eliminar la categoría', 'error');
        }
    }
}

function showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'userModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nuevo Usuario</h3>
                <button class="modal-close" onclick="closeModal('userModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="userForm">
                    <div class="form-group">
                        <label for="userName">Nombre Completo</label>
                        <input type="text" id="userName" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="userUsername">Usuario</label>
                        <input type="text" id="userUsername" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="userPassword">Contraseña</label>
                        <input type="password" id="userPassword" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="userRole">Rol</label>
                        <select id="userRole" class="form-select" required>
                            <option value="">Seleccionar rol</option>
                            <option value="admin">Administrador</option>
                            <option value="cashier">Cajero</option>
                            <option value="waiter">Mesero</option>
                            <option value="kitchen">Cocina</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="userActive" checked>
                                <span class="checkmark"></span>
                                Usuario activo
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('userModal')">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="saveUser()">Guardar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveUser() {
    const form = document.getElementById('userForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const userData = {
        name: document.getElementById('userName').value,
        username: document.getElementById('userUsername').value,
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value,
        active: document.getElementById('userActive').checked,
        createdAt: new Date().toISOString(),
        lastAccess: null
    };
    
    try {
        // Verificar que el usuario no exista
        const existingUsers = window.configuracionManager.db.getUsers();
        if (existingUsers.find(u => u.username === userData.username)) {
            window.configuracionManager.showNotification('El nombre de usuario ya existe', 'error');
            return;
        }
        
        window.configuracionManager.db.addUser(userData);
        window.configuracionManager.showNotification('Usuario creado exitosamente', 'success');
        window.configuracionManager.loadUsers();
        closeModal('userModal');
    } catch (error) {
        console.error('Error al crear usuario:', error);
        window.configuracionManager.showNotification('Error al crear el usuario', 'error');
    }
}

function editUser(userId) {
    const user = window.configuracionManager.db.getUsers().find(u => u.id === userId);
    if (!user) {
        window.configuracionManager.showNotification('Usuario no encontrado', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editUserModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Editar Usuario</h3>
                <button class="modal-close" onclick="closeModal('editUserModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="editUserForm">
                    <div class="form-group">
                        <label for="editUserName">Nombre Completo</label>
                        <input type="text" id="editUserName" class="form-input" value="${user.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editUserUsername">Usuario</label>
                        <input type="text" id="editUserUsername" class="form-input" value="${user.username}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editUserPassword">Nueva Contraseña (dejar vacío para mantener actual)</label>
                        <input type="password" id="editUserPassword" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="editUserRole">Rol</label>
                        <select id="editUserRole" class="form-select" required>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            <option value="cashier" ${user.role === 'cashier' ? 'selected' : ''}>Cajero</option>
                            <option value="waiter" ${user.role === 'waiter' ? 'selected' : ''}>Mesero</option>
                            <option value="kitchen" ${user.role === 'kitchen' ? 'selected' : ''}>Cocina</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="editUserActive" ${user.active ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Usuario activo
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('editUserModal')">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="updateUser(${userId})">Actualizar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function updateUser(userId) {
    const form = document.getElementById('editUserForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const userData = {
        name: document.getElementById('editUserName').value,
        username: document.getElementById('editUserUsername').value,
        role: document.getElementById('editUserRole').value,
        active: document.getElementById('editUserActive').checked
    };
    
    const newPassword = document.getElementById('editUserPassword').value;
    if (newPassword.trim()) {
        userData.password = newPassword;
    }
    
    try {
        // Verificar que el usuario no exista (excepto el actual)
        const existingUsers = window.configuracionManager.db.getUsers();
        const duplicateUser = existingUsers.find(u => u.username === userData.username && u.id !== userId);
        if (duplicateUser) {
            window.configuracionManager.showNotification('El nombre de usuario ya existe', 'error');
            return;
        }
        
        const user = existingUsers.find(u => u.id === userId);
        Object.assign(user, userData);
        user.updatedAt = new Date().toISOString();
        
        window.configuracionManager.db.updateUser(user);
        window.configuracionManager.showNotification('Usuario actualizado exitosamente', 'success');
        window.configuracionManager.loadUsers();
        closeModal('editUserModal');
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        window.configuracionManager.showNotification('Error al actualizar el usuario', 'error');
    }
}

function deleteUser(userId) {
    const user = window.configuracionManager.db.getUsers().find(u => u.id === userId);
    if (!user) {
        window.configuracionManager.showNotification('Usuario no encontrado', 'error');
        return;
    }
    
    // No permitir eliminar el último administrador
    const users = window.configuracionManager.db.getUsers();
    const adminUsers = users.filter(u => u.role === 'admin' && u.active);
    
    if (user.role === 'admin' && adminUsers.length <= 1) {
        window.configuracionManager.showNotification('No se puede eliminar el último administrador activo', 'error');
        return;
    }
    
    if (confirm(`¿Estás seguro de que quieres eliminar el usuario "${user.name}"?`)) {
        try {
            window.configuracionManager.db.deleteUser(userId);
            window.configuracionManager.showNotification('Usuario eliminado exitosamente', 'success');
            window.configuracionManager.loadUsers();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            window.configuracionManager.showNotification('Error al eliminar el usuario', 'error');
        }
    }
}

function detectPrinters() {
    window.configuracionManager.showNotification('Detectando impresoras...', 'info');
    
    // Simular detección de impresoras
    setTimeout(() => {
        const mockPrinters = [
            'Impresora Térmica USB - EPSON TM-T20III',
            'Impresora de Red - 192.168.1.100',
            'Impresora Cocina USB - Star TSP143III',
            'Impresora de Red - 192.168.1.101',
            'Microsoft Print to PDF',
            'Microsoft XPS Document Writer'
        ];
        
        // Actualizar los selects de impresoras
        const printerSelects = document.querySelectorAll('#impresoras .printer-controls select');
        printerSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Seleccionar impresora...</option>';
            
            mockPrinters.forEach(printer => {
                const option = document.createElement('option');
                option.value = printer;
                option.textContent = printer;
                if (printer === currentValue) option.selected = true;
                select.appendChild(option);
            });
        });
        
        window.configuracionManager.showNotification(`${mockPrinters.length} impresoras detectadas`, 'success');
    }, 2000);
}

function testPrint(type) {
    const printerType = type === 'receipts' ? 'recibos' : 'kitchen' ? 'cocina' : type;
    const config = window.configuracionManager.getStoredConfig();
    
    let selectedPrinter;
    if (type === 'receipts') {
        selectedPrinter = config.printers?.receipt;
    } else if (type === 'kitchen') {
        selectedPrinter = config.printers?.kitchen;
    }
    
    if (!selectedPrinter) {
        window.configuracionManager.showNotification(`Selecciona una impresora para ${printerType} primero`, 'warning');
        return;
    }
    
    window.configuracionManager.showNotification(`Enviando prueba de impresión a ${printerType}...`, 'info');
    
    // Simular impresión de prueba
    setTimeout(() => {
        const testContent = type === 'kitchen' 
            ? `=== PRUEBA COCINA ===\nFecha: ${new Date().toLocaleString()}\nImpresora: ${selectedPrinter}\n\n*** PEDIDO DE PRUEBA ***\n1x Crêpe de Nutella\n1x Café Americano\n\n=== FIN PRUEBA ===`
            : `CRÊPES & KAFFEE\n${new Date().toLocaleString()}\n\nPRUEBA DE IMPRESIÓN\nImpresora: ${selectedPrinter}\n\nGracias por usar nuestro sistema POS`;
        
        // Crear ventana de impresión de prueba
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Prueba de Impresión - ${printerType}</title>
                    <style>
                        body { font-family: monospace; font-size: 12px; margin: 20px; white-space: pre-line; }
                    </style>
                </head>
                <body>${testContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        window.configuracionManager.showNotification('Prueba de impresión enviada exitosamente', 'success');
    }, 1500);
}

function createBackup() {
    window.configuracionManager.showNotification('Creando respaldo completo...', 'info');
    
    // Simular progreso de creación de respaldo
    setTimeout(async () => {
        try {
            console.log('[ConfiguracionManager] Iniciando creación de respaldo completo...');
            
            // Crear respaldo completo usando la función mejorada de Database
            const backupData = window.configuracionManager.db.createBackup();
            
            // Información adicional del respaldo
            const backupInfo = {
                ...backupData,
                exportInfo: {
                    exportedBy: window.configuracionManager.db.getCurrentUser()?.name || 'Sistema',
                    exportDate: new Date().toISOString(),
                    systemVersion: '2.0',
                    description: 'Respaldo completo del sistema POS Crêpes & Kaffee incluyendo todos los datos de ventas, reportes históricos y análisis completos'
                }
            };
            
            // Generar nombre de archivo
            const timestamp = new Date().toISOString().split('T')[0];
            const timeString = new Date().toTimeString().slice(0,5).replace(':', '');
            const filename = `backup_crepes_kaffee_completo_${timestamp}_${timeString}.json`;
            
            // Crear archivo JSON para descarga local
            const blob = new Blob([JSON.stringify(backupInfo, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Intentar subir automáticamente a Google Drive si está configurado
            let driveUploadSuccess = false;
            if (window.driveBackupManager) {
                try {
                    driveUploadSuccess = await window.driveBackupManager.enhanceExistingBackup(backupInfo, filename);
                } catch (driveError) {
                    console.warn('[ConfiguracionManager] Error subiendo a Drive:', driveError);
                }
            }
            
            // Mostrar información del respaldo creado
            const metadata = backupInfo.data.backupMetadata;
            let summaryMessage = 'Respaldo completo creado exitosamente';
            
            if (metadata) {
                summaryMessage += `\n\n📊 Resumen del respaldo:\n`;
                summaryMessage += `• ${metadata.totalSales} ventas registradas\n`;
                summaryMessage += `• ${metadata.totalOrders} pedidos\n`;
                summaryMessage += `• ${metadata.totalProducts} productos\n`;
                summaryMessage += `• ${metadata.totalUsers} usuarios\n`;
                summaryMessage += `• ${metadata.totalCashSessions} sesiones de caja\n`;
                summaryMessage += `• ${metadata.totalOrderLogs} logs de actividad\n`;
                
                if (metadata.dateRange.firstSale && metadata.dateRange.lastSale) {
                    const firstDate = new Date(metadata.dateRange.firstSale).toLocaleDateString();
                    const lastDate = new Date(metadata.dateRange.lastSale).toLocaleDateString();
                    summaryMessage += `\n📅 Rango de datos: ${firstDate} - ${lastDate}`;
                }
            }
            
            summaryMessage += '\n\n✅ Incluye: Datos completos, histórico de ventas, reportes y análisis';
            
            // Agregar información sobre Drive si aplicable
            if (driveUploadSuccess) {
                summaryMessage += '\n☁️ Subido automáticamente a Google Drive';
            } else if (window.driveBackupManager && window.driveBackupManager.driveConfig.autoUploadToDrive) {
                summaryMessage += '\n⚠️ Error subiendo a Google Drive (revisar configuración)';
            }
            
            window.configuracionManager.showNotification(summaryMessage, 'success');
            
            console.log('[ConfiguracionManager] Respaldo completo creado:', {
                filename: filename,
                size: blob.size + ' bytes',
                timestamp: backupInfo.timestamp,
                metadata: metadata,
                driveUpload: driveUploadSuccess
            });
            
        } catch (error) {
            console.error('[ConfiguracionManager] Error al crear respaldo:', error);
            window.configuracionManager.showNotification('Error al crear el respaldo: ' + error.message, 'error');
        }
    }, 2000);
}

function selectRestoreFile() {
    document.getElementById('restoreFile').click();
    
    // Escuchar cambios en el input de archivo
    const fileInput = document.getElementById('restoreFile');
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const restoreButton = document.querySelector('button[onclick="restoreBackup()"]');
        
        if (file) {
            restoreButton.disabled = false;
            restoreButton.innerHTML = `<i class="fas fa-upload"></i> Restaurar (${file.name})`;
            
            // Validar archivo
            if (!file.name.endsWith('.json')) {
                window.configuracionManager.showNotification('Selecciona un archivo JSON válido', 'warning');
                restoreButton.disabled = true;
                return;
            }
            
            window.configuracionManager.showNotification('Archivo seleccionado: ' + file.name, 'info');
        } else {
            restoreButton.disabled = true;
            restoreButton.innerHTML = `<i class="fas fa-upload"></i> Restaurar`;
        }
    }, { once: true });
}

function restoreBackup() {
    const fileInput = document.getElementById('restoreFile');
    const file = fileInput.files[0];
    
    if (!file) {
        window.configuracionManager.showNotification('Selecciona un archivo de respaldo primero', 'warning');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres restaurar los datos? Esto reemplazará todos los datos actuales.')) {
        window.configuracionManager.showNotification('Restaurando datos...', 'info');
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                
                console.log('[ConfiguracionManager] Iniciando restauración de respaldo...');
                console.log('[ConfiguracionManager] Versión del respaldo:', backupData.version || '1.0');
                
                if (!backupData.data || !backupData.timestamp) {
                    throw new Error('Formato de respaldo inválido - faltan datos básicos');
                }
                
                // Usar la función mejorada de restauración de Database
                const success = window.configuracionManager.db.restoreBackup(backupData);
                
                if (!success) {
                    throw new Error('Error durante el proceso de restauración');
                }
                
                // Mostrar información del respaldo restaurado
                let successMessage = 'Datos restaurados exitosamente';
                
                if (backupData.data.backupMetadata) {
                    const metadata = backupData.data.backupMetadata;
                    successMessage += `\n\n📊 Datos restaurados:\n`;
                    successMessage += `• ${metadata.totalSales} ventas\n`;
                    successMessage += `• ${metadata.totalOrders} pedidos\n`;
                    successMessage += `• ${metadata.totalProducts} productos\n`;
                    successMessage += `• ${metadata.totalUsers} usuarios\n`;
                    successMessage += `• ${metadata.totalCashSessions} sesiones de caja\n`;
                    successMessage += `• ${metadata.totalOrderLogs} logs de actividad\n`;
                    
                    if (metadata.dateRange.firstSale && metadata.dateRange.lastSale) {
                        const firstDate = new Date(metadata.dateRange.firstSale).toLocaleDateString();
                        const lastDate = new Date(metadata.dateRange.lastSale).toLocaleDateString();
                        successMessage += `\n📅 Rango de datos: ${firstDate} - ${lastDate}`;
                    }
                }
                
                if (backupData.version >= '2.0') {
                    successMessage += '\n\n✅ Respaldo completo restaurado con todos los datos históricos';
                }
                
                window.configuracionManager.showNotification(successMessage, 'success');
                
                // Limpiar el input de archivo
                fileInput.value = '';
                document.querySelector('button[onclick="restoreBackup()"]').disabled = true;
                document.querySelector('button[onclick="restoreBackup()"]').innerHTML = `<i class="fas fa-upload"></i> Restaurar`;
                
                console.log('[ConfiguracionManager] Restauración completada exitosamente');
                
                // Recargar después de 3 segundos para permitir leer el mensaje
                setTimeout(() => {
                    location.reload();
                }, 3000);
                
            } catch (error) {
                console.error('[ConfiguracionManager] Error al restaurar respaldo:', error);
                window.configuracionManager.showNotification('Error al restaurar los datos: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

function restartSystem() {
    console.log('Función restartSystem() llamada');
    
    // Verificar que las dependencias necesarias estén disponibles
    if (!window.configuracionManager) {
        console.error('ConfiguracionManager no está disponible');
        alert('Error: El sistema de configuración no está inicializado. Por favor, recarga la página e inténtalo de nuevo.');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'restartSystemModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reiniciar Sistema</h3>
                <button class="modal-close" onclick="closeModal('restartSystemModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Selecciona el tipo de reinicio:</p>
                
                <div class="form-group">
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="restartType" value="soft" checked>
                            <span class="radio-mark"></span>
                            <div>
                                <strong>Reinicio Suave</strong>
                                <p>Solo recarga la aplicación sin perder datos</p>
                            </div>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="restartType" value="partial">
                            <span class="radio-mark"></span>
                            <div>
                                <strong>Reinicio Parcial</strong>
                                <p>Limpia solo pedidos y ventas, mantiene productos y configuración</p>
                            </div>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="restartType" value="full">
                            <span class="radio-mark"></span>
                            <div>
                                <strong>Reinicio Completo</strong>
                                <p>Limpia TODOS los datos y reinicia el sistema completamente</p>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="alert alert-warning" id="partialRestartWarning" style="display: none;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>¡ADVERTENCIA!</strong> El reinicio parcial eliminará todos los pedidos, ventas y sesiones de caja,
                    pero mantendrá los productos, usuarios y configuraciones.
                </div>
                
                <div class="alert alert-danger" id="fullRestartWarning" style="display: none;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>¡ADVERTENCIA!</strong> El reinicio completo eliminará TODOS los datos del sistema: 
                    pedidos, ventas, configuraciones, usuarios, productos, etc. Esta acción NO se puede deshacer.
                    Se recomienda encarecidamente crear un respaldo antes de continuar.
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('restartSystemModal')">Cancelar</button>
                <button type="button" class="btn btn-danger" onclick="executeSystemRestart()">Reiniciar Sistema</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('Modal de reinicio creado y añadido al DOM');
    
    // Mostrar advertencia cuando se seleccione reinicio completo o parcial
    modal.querySelectorAll('input[name="restartType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const fullWarning = document.getElementById('fullRestartWarning');
            const partialWarning = document.getElementById('partialRestartWarning');
            
            if (this.value === 'full') {
                fullWarning.style.display = 'block';
                partialWarning.style.display = 'none';
            } else if (this.value === 'partial') {
                fullWarning.style.display = 'none';
                partialWarning.style.display = 'block';
            } else {
                fullWarning.style.display = 'none';
                partialWarning.style.display = 'none';
            }
        });
    });
    
    // Activar el modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function executeSystemRestart() {
    console.log('Función executeSystemRestart() llamada');
    
    const restartTypeElement = document.querySelector('input[name="restartType"]:checked');
    if (!restartTypeElement) {
        console.error('No se pudo encontrar el tipo de reinicio seleccionado');
        alert('Error: No se pudo determinar el tipo de reinicio. Inténtalo de nuevo.');
        return;
    }
    
    const restartType = restartTypeElement.value;
    console.log('Tipo de reinicio seleccionado:', restartType);
    
    if (restartType === 'full') {
        // Confirmación adicional para reinicio completo
        const confirmed = confirm('¿Estás ABSOLUTAMENTE seguro de que quieres eliminar TODOS los datos del sistema? Esta acción NO se puede deshacer.');
        if (!confirmed) {
            return;
        }
        
        const doubleConfirm = confirm('ÚLTIMA CONFIRMACIÓN: Se eliminarán TODOS los pedidos, ventas, productos, configuraciones y usuarios. ¿Continuar?');
        if (!doubleConfirm) {
            return;
        }
        
        if (window.configuracionManager && window.configuracionManager.showNotification) {
            window.configuracionManager.showNotification('Reiniciando sistema completo...', 'info');
        }
        closeModal('restartSystemModal');
        
        setTimeout(() => {
            try {
                console.log('Iniciando reinicio completo del sistema...');
                
                // Usar la función de la base de datos si está disponible
                if (window.Database) {
                    const db = new Database();
                    if (typeof db.clearAllData === 'function') {
                        db.clearAllData();
                        console.log('Datos limpiados usando Database.clearAllData()');
                    }
                }
                
                // Limpiar TODOS los datos del localStorage como respaldo
                const keysToKeep = ['theme']; // Mantener solo el tema si existe
                const allKeys = Object.keys(localStorage);
                
                console.log('Limpiando localStorage. Keys encontradas:', allKeys);
                
                allKeys.forEach(key => {
                    if (!keysToKeep.includes(key)) {
                        localStorage.removeItem(key);
                        console.log('Eliminada key:', key);
                    }
                });
                
                // También limpiar sessionStorage
                sessionStorage.clear();
                console.log('SessionStorage limpiado');
                
                // Verificar que se limpiaron los datos
                const remainingKeys = Object.keys(localStorage);
                console.log('Keys restantes después de limpiar:', remainingKeys);
                
                if (window.configuracionManager && window.configuracionManager.showNotification) {
                    window.configuracionManager.showNotification('✅ Sistema completamente reiniciado', 'success');
                }
                
                // Redirigir al login después de limpiar todo
                setTimeout(() => {
                    console.log('Redirigiendo a login...');
                    window.location.href = 'login.html';
                }, 1500);
                
            } catch (error) {
                console.error('Error al reiniciar sistema:', error);
                if (window.configuracionManager && window.configuracionManager.showNotification) {
                    window.configuracionManager.showNotification('❌ Error al reiniciar el sistema: ' + error.message, 'error');
                } else {
                    alert('Error al reiniciar el sistema: ' + error.message);
                }
            }
        }, 1500);
        
    } else if (restartType === 'partial') {
        // Reinicio parcial - solo limpiar pedidos y ventas
        const confirmed = confirm('¿Estás seguro de que quieres eliminar TODOS los pedidos y ventas? Se mantendrán los productos y configuraciones.');
        if (!confirmed) {
            return;
        }
        
        if (window.configuracionManager && window.configuracionManager.showNotification) {
            window.configuracionManager.showNotification('Ejecutando reinicio parcial...', 'info');
        }
        closeModal('restartSystemModal');
        
        setTimeout(() => {
            try {
                console.log('Iniciando reinicio parcial del sistema...');
                
                // Limpiar solo datos específicos
                const keysToRemove = [
                    'pos_orders',
                    'pos_sales', 
                    'pos_cash_sessions',
                    'pos_current_cash_session'
                ];
                
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                    console.log('Eliminada key:', key);
                });
                
                // Reinicializar mesas (liberarlas)
                const tables = JSON.parse(localStorage.getItem('pos_tables') || '[]');
                tables.forEach(table => {
                    table.estado = 'libre';
                    table.clienteActual = null;
                    table.pedidoActual = null;
                    table.horaLiberacion = new Date().toISOString();
                });
                localStorage.setItem('pos_tables', JSON.stringify(tables));
                console.log('Mesas liberadas');
                
                if (window.configuracionManager && window.configuracionManager.showNotification) {
                    window.configuracionManager.showNotification('✅ Reinicio parcial completado', 'success');
                }
                
                // Recargar la página
                setTimeout(() => {
                    location.reload();
                }, 1500);
                
            } catch (error) {
                console.error('Error en reinicio parcial:', error);
                if (window.configuracionManager && window.configuracionManager.showNotification) {
                    window.configuracionManager.showNotification('❌ Error en reinicio parcial: ' + error.message, 'error');
                } else {
                    alert('Error en reinicio parcial: ' + error.message);
                }
            }
        }, 1500);
        
    } else if (restartType === 'soft') {
        // Reinicio suave - solo recargar
        if (window.configuracionManager && window.configuracionManager.showNotification) {
            window.configuracionManager.showNotification('Reiniciando sistema...', 'info');
        }
        closeModal('restartSystemModal');
        
        setTimeout(() => {
            console.log('Ejecutando reinicio suave...');
            location.reload();
        }, 1500);
        
    } else {
        console.error('Tipo de reinicio no reconocido:', restartType);
        if (window.configuracionManager && window.configuracionManager.showNotification) {
            window.configuracionManager.showNotification('❌ Error: Tipo de reinicio no válido', 'error');
        } else {
            alert('Error: Tipo de reinicio no válido');
        }
    }
}

// Función global para cerrar modales
function closeModal(modalId) {
    console.log('Cerrando modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
        console.log('Modal eliminado del DOM');
    } else {
        console.warn('No se encontró el modal con ID:', modalId);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.configuracionManager = new ConfiguracionManager();
    
    // Agregar estilos para las notificaciones
    const style = document.createElement('style');
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
        }
    `;
    document.head.appendChild(style);
});
