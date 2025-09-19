// Sistema de Caja Registradora - Crêpes & Kaffee

class CajaManager {
    constructor() {
        console.log('🔧 [CajaManager] Iniciando constructor');
        this.db = new Database();
        this.currentUser = null;
        this.currentSession = null;
        this.eventsBound = false; // Flag para evitar múltiples bindings
        this.init();
        console.log('✅ [CajaManager] Constructor completado');
    }

    init() {
        this.checkAuthState();
        this.bindEvents();
        this.updateDisplay();
        this.startAutoRefresh();
    }

    checkAuthState() {
        // Verificar usuario autenticado
        const userData = localStorage.getItem('pos_current_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        
        // Verificar sesión de caja activa
        this.currentSession = this.db.getCurrentCashSession();
        
        // Si hay sesión abierta, mostrar información
        if (this.currentSession) {
            this.showCashSessionInfo();
        } else {
            this.showCashOpeningForm();
        }
    }

    bindEvents() {
        if (this.eventsBound) {
            console.log('⚠️ [CajaManager] Eventos ya vinculados, saltando...');
            return;
        }
        
        console.log('🔧 [CajaManager] Vinculando eventos...');
        
        // Usar delegación de eventos en el documento para asegurar que siempre funcionen
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        
        this.eventsBound = true;
        console.log('✅ [CajaManager] Eventos vinculados usando delegación');
    }

    handleDocumentClick(e) {
        console.log('🖱️ [CajaManager] Click detectado en:', e.target.id || 'sin id', e.target.tagName, e.target.className);
        console.log('🖱️ [CajaManager] Target completo:', e.target);
        console.log('🖱️ [CajaManager] Event completo:', e);
        
        // Buscar el botón más cercano para manejar clicks en iconos/texto dentro del botón
        const button = e.target.closest('button');
        const buttonId = button ? button.id : null;
        
        if (buttonId) {
            console.log('🎯 [CajaManager] Botón identificado:', buttonId);
        } else {
            console.log('❌ [CajaManager] No se encontró botón en el target');
        }
        
        // Abrir caja
        if (buttonId === 'openCashBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ [CajaManager] Click en abrir caja - EJECUTANDO');
            this.showOpenCashModal();
            return;
        }
        
        // Cerrar caja
        if (buttonId === 'closeCashBtn') {
            e.preventDefault();
            console.log('✅ [CajaManager] Click en cerrar caja');
            this.showCloseCashModal();
            return;
        }
        
        // Movimientos de caja
        if (buttonId === 'addMovementBtn') {
            e.preventDefault();
            console.log('✅ [CajaManager] Click en movimiento de caja');
            this.showMovementModal();
            return;
        }
        
        // Ver historial
        if (buttonId === 'viewHistoryBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ [CajaManager] Click en ver historial - EJECUTANDO');
            try {
                this.showHistoryModal();
                console.log('✅ [CajaManager] Modal de historial mostrado exitosamente');
            } catch (error) {
                console.error('❌ [CajaManager] Error mostrando modal de historial:', error);
                this.showNotification('❌ Error mostrando historial: ' + error.message, 'error');
            }
            return;
        }
        
        // Actualizar datos
        if (buttonId === 'refreshDataBtn') {
            e.preventDefault();
            console.log('✅ [CajaManager] Click en actualizar datos');
            this.forceUpdate();
            this.showNotification('🔄 Datos actualizados', 'success');
            return;
        }
        
        // Imprimir arqueo
        if (buttonId === 'printArqueoBtn') {
            e.preventDefault();
            console.log('✅ [CajaManager] Click en imprimir arqueo');
            this.printArqueo();
            return;
        }
    }

    startAutoRefresh() {
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.updateDisplay();
        }, 30000);
        
        // También actualizar cuando la ventana recupere el foco (por si se hicieron ventas en otra pestaña)
        window.addEventListener('focus', () => {
            console.log('🔄 [CajaManager] Ventana recuperó el foco, actualizando datos...');
            this.updateDisplay();
        });
        
        // Escuchar eventos personalizados para actualización de ventas
        document.addEventListener('saleCompleted', () => {
            console.log('🔄 [CajaManager] Venta completada detectada, actualizando datos...');
            this.updateDisplay();
        });
        
        document.addEventListener('cashMovementAdded', () => {
            console.log('🔄 [CajaManager] Movimiento de caja agregado, actualizando datos...');
            this.updateDisplay();
        });
    }

    // Método público para forzar actualización desde otras partes del sistema
    forceUpdate() {
        console.log('🔄 [CajaManager] Actualización forzada solicitada');
        this.updateDisplay();
    }

    updateDisplay() {
        console.log('🔄 [CajaManager] updateDisplay iniciado');
        this.currentSession = this.db.getCurrentCashSession();
        console.log('🔄 [CajaManager] Sesión actual:', this.currentSession);
        
        if (this.currentSession && this.currentSession.status === 'open') {
            console.log('✅ [CajaManager] Sesión activa encontrada - mostrando info de caja');
            this.showCashSessionInfo();
            this.updateCashInfo();
            this.updateMovements();
            this.updateStats();
        } else {
            console.log('❌ [CajaManager] No hay sesión activa - mostrando formulario de apertura');
            this.showCashOpeningForm();
        }
    }

    // === APERTURA DE CAJA ===
    showOpenCashModal() {
        console.log('🚀 [CajaManager] showOpenCashModal iniciado');
        
        try {
            // Remover modal existente si hay alguno
            const existingModal = document.getElementById('openCashModal');
            if (existingModal) {
                console.log('🗑️ [CajaManager] Removiendo modal existente');
                existingModal.remove();
            }
            
            console.log('🏗️ [CajaManager] Creando nuevo modal');
            const modal = document.createElement('div');
        modal.className = 'modal active'; // Añadimos active directamente
        modal.id = 'openCashModal';
        modal.innerHTML = `
            <div class="modal-content cash-opening-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-cash-register"></i> Apertura de Caja</h3>
                    <button class="modal-close" onclick="document.getElementById('openCashModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="opening-info">
                        <div class="cashier-info">
                            <h4>👤 Información del Cajero</h4>
                            <p><strong>Cajero:</strong> ${this.currentUser?.name || 'Usuario actual'}</p>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
                            <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-CO')}</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="initialAmount">💰 Monto inicial en efectivo:</label>
                        <div class="input-group">
                            <span class="input-prefix">$</span>
                            <input type="number" id="initialAmount" class="form-control" 
                                   value="0" min="0" step="1000" placeholder="0">
                        </div>
                        <small class="form-text">Ingrese el monto de efectivo con el que inicia la caja</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="openingNotes">📝 Notas (opcional):</label>
                        <textarea id="openingNotes" class="form-control" rows="3" 
                                  placeholder="Comentarios sobre la apertura de caja, incidencias, etc."></textarea>
                    </div>
                    
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <strong>Información importante:</strong>
                            <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                                <li>Se iniciará una nueva sesión de caja</li>
                                <li>Todas las ventas quedarán registradas en esta sesión</li>
                                <li>Debe contar el efectivo físico antes de continuar</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('openCashModal').remove()">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary btn-open-cash" id="confirmOpenCash">
                        <i class="fas fa-cash-register"></i>
                        Abrir Caja
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('Modal añadido al DOM');
        
        // Agregar event listener al botón de confirmar
        const confirmButton = document.getElementById('confirmOpenCash');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                console.log('Botón de abrir caja presionado');
                this.openCash();
            });
        }
        
        // Permitir enviar con Enter
        const amountInput = document.getElementById('initialAmount');
        const notesInput = document.getElementById('openingNotes');
        
        [amountInput, notesInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        console.log('Enter presionado, abriendo caja');
                        this.openCash();
                    }
                });
            }
        });
        
        // Focus en el input después de un pequeño delay
        setTimeout(() => {
            const amountInput = document.getElementById('initialAmount');
            if (amountInput) {
                amountInput.focus();
                amountInput.select();
            }
        }, 200);
        
        // Cerrar modal con ESC
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                document.getElementById('openCashModal')?.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
        
        // Cerrar modal haciendo click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        console.log('✅ [CajaManager] Modal creado y eventos configurados');
        
        } catch (error) {
            console.error('❌ [CajaManager] Error al crear modal de apertura:', error);
            this.showNotification('Error al abrir modal de caja', 'error');
        }
    }

    openCash() {
        console.log('=== INICIANDO APERTURA DE CAJA ===');
        
        try {
            // Verificar que los elementos existan
            const initialAmountInput = document.getElementById('initialAmount');
            const notesInput = document.getElementById('openingNotes');
            
            console.log('🔍 [CajaManager] Elementos encontrados:', {
                initialAmountInput: !!initialAmountInput,
                notesInput: !!notesInput,
                currentUser: !!this.currentUser
            });
            
            if (!initialAmountInput) {
                throw new Error('No se encontró el campo de monto inicial');
            }
            
            const initialAmount = parseFloat(initialAmountInput.value) || 0;
            const notes = notesInput ? notesInput.value.trim() : '';
            
            console.log('💰 [CajaManager] Valores obtenidos:', { initialAmount, notes });
            
            if (initialAmount < 0) {
                throw new Error('El monto inicial no puede ser negativo');
            }
            
            if (!this.currentUser) {
                console.error('❌ [CajaManager] Usuario no autenticado');
                throw new Error('No hay usuario autenticado');
            }

            console.log('👤 [CajaManager] Usuario actual completo:', this.currentUser);
            console.log('🆔 [CajaManager] ID del usuario:', this.currentUser.id);
            console.log('📝 [CajaManager] Tipo de ID:', typeof this.currentUser.id);
            
            // Verificar que no hay sesión activa
            const existingSession = this.db.getCurrentCashSession();
            if (existingSession && existingSession.status === 'open') {
                throw new Error('Ya hay una sesión de caja activa');
            }
            
            // Deshabilitar botón para evitar clicks múltiples
            const openButton = document.getElementById('confirmOpenCash');
            if (openButton) {
                openButton.disabled = true;
                openButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abriendo...';
            }

            console.log('🚀 [CajaManager] Llamando a db.openCashSession...');
            const session = this.db.openCashSession(this.currentUser.id, initialAmount, notes, this.currentUser.name);
            this.currentSession = session;
            
            console.log('✅ [CajaManager] Sesión de caja creada exitosamente:', session);
            
            // Cerrar modal
            const modal = document.getElementById('openCashModal');
            if (modal) {
                modal.remove();
                console.log('🗑️ [CajaManager] Modal cerrado');
            }
            
            // Actualizar interfaz
            console.log('🔄 [CajaManager] Actualizando interfaz...');
            this.showCashSessionInfo();
            this.updateDisplay();
            
            // Mostrar notificación de éxito
            this.showNotification('✅ Caja abierta exitosamente', 'success');
            console.log('🎉 [CajaManager] Notificación mostrada');
            
            // Mostrar resumen de apertura
            setTimeout(() => {
                this.showOpeningSummary(session);
            }, 500);
            
            console.log('=== APERTURA DE CAJA COMPLETADA ===');
            
        } catch (error) {
            console.error('=== ERROR EN APERTURA DE CAJA ===');
            console.error('💥 [CajaManager] Error completo:', error);
            console.error('Stack trace:', error.stack);
            
            this.showNotification('❌ Error al abrir caja: ' + error.message, 'error');
            
            // Rehabilitar botón en caso de error
            const openButton = document.getElementById('confirmOpenCash');
            if (openButton) {
                openButton.disabled = false;
                openButton.innerHTML = '<i class="fas fa-cash-register"></i> Abrir Caja';
            }
        }
    }

    showOpeningSummary(session) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'openingSummaryModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-check-circle" style="color: #28a745;"></i> Caja Abierta Exitosamente</h3>
                    <button class="modal-close" onclick="document.getElementById('openingSummaryModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="opening-summary">
                        <div class="summary-section">
                            <h4>📋 Detalles de la Apertura</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">Cajero:</span>
                                    <span class="value">${session.userName}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Fecha y hora:</span>
                                    <span class="value">${new Date(session.openedAt).toLocaleString('es-CO')}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Monto inicial:</span>
                                    <span class="value" style="color: #28a745; font-weight: 700;">$${session.initialAmount.toLocaleString()}</span>
                                </div>
                                ${session.notes ? `
                                <div class="info-item">
                                    <span class="label">Notas:</span>
                                    <span class="value">${session.notes}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="alert alert-success">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <strong>¡La caja está lista para operar!</strong>
                                <br>Ya puedes comenzar a procesar ventas y movimientos de caja.
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="document.getElementById('openingSummaryModal').remove()">
                        <i class="fas fa-check"></i>
                        Entendido
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // === CIERRE DE CAJA ===
    showCloseCashModal() {
        if (!this.currentSession) {
            this.showNotification('❌ No hay sesión de caja abierta', 'error');
            return;
        }

        // Calcular efectivo esperado
        const expectedCash = this.calculateExpectedCash();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'closeCashModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>🔒 Cierre de Caja</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="cash-summary">
                        <h4>📊 Resumen de la Sesión</h4>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <span class="label">Apertura:</span>
                                <span class="value">$${this.currentSession.initialAmount.toLocaleString()}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Ventas en efectivo:</span>
                                <span class="value">$${this.currentSession.totalCash.toLocaleString()}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Efectivo esperado:</span>
                                <span class="value expected">$${expectedCash.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="finalAmount">💵 Efectivo contado en caja:</label>
                        <div class="input-group">
                            <span class="input-prefix">$</span>
                            <input type="number" id="finalAmount" class="form-control" 
                                   value="${expectedCash}" min="0" step="1000">
                        </div>
                        <small class="form-text">Cuenta todo el efectivo que hay físicamente en la caja</small>
                    </div>
                    
                    <div id="differenceDisplay" class="difference-display"></div>
                    
                    <div class="form-group">
                        <label for="closingNotes">Notas de cierre:</label>
                        <textarea id="closingNotes" class="form-control" rows="3" 
                                  placeholder="Comentarios sobre el cierre de caja..."></textarea>
                    </div>
                    
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>¡Atención!</strong> Una vez cerrada la caja, no podrás modificar los datos.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-danger" onclick="cajaManager.closeCash()">
                        <i class="fas fa-lock"></i>
                        Cerrar Caja
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Calcular diferencia en tiempo real
        const finalAmountInput = document.getElementById('finalAmount');
        const differenceDisplay = document.getElementById('differenceDisplay');
        
        const updateDifference = () => {
            const finalAmount = parseFloat(finalAmountInput.value) || 0;
            const difference = finalAmount - expectedCash;
            
            differenceDisplay.innerHTML = `
                <div class="difference ${difference === 0 ? 'perfect' : difference > 0 ? 'surplus' : 'deficit'}">
                    <span class="label">Diferencia:</span>
                    <span class="value">${difference >= 0 ? '+' : ''}$${difference.toLocaleString()}</span>
                    <span class="status">
                        ${difference === 0 ? '✅ Perfecto' : 
                          difference > 0 ? '⬆️ Sobrante' : '⬇️ Faltante'}
                    </span>
                </div>
            `;
        };
        
        finalAmountInput.addEventListener('input', updateDifference);
        updateDifference();
    }

    calculateExpectedCash() {
        if (!this.currentSession) return 0;
        
        // Efectivo inicial + ventas en efectivo + entradas - salidas
        const sales = this.db.getSales();
        const sessionSales = sales.filter(sale => {
            // Las ventas usan 'fecha' no 'timestamp'
            const saleDate = sale.fecha || sale.timestamp;
            const sessionStart = this.currentSession.openedAt;
            return new Date(saleDate) >= new Date(sessionStart);
        });
        
        const salesCash = sessionSales.reduce((sum, sale) => {
            if (sale.metodoPago === 'efectivo') {
                return sum + sale.total;
            } else if (sale.metodoPago === 'mixto' && sale.paymentData && sale.paymentData.cashAmount) {
                // Sumar la parte en efectivo de los pagos mixtos
                return sum + sale.paymentData.cashAmount;
            }
            return sum;
        }, 0);
        
        // Movimientos de caja
        const movements = this.currentSession.movements || [];
        const cashIn = movements
            .filter(m => m.type === 'in')
            .reduce((sum, m) => sum + m.amount, 0);
        const cashOut = movements
            .filter(m => m.type === 'out')
            .reduce((sum, m) => sum + m.amount, 0);
        
        return this.currentSession.initialAmount + salesCash + cashIn - cashOut;
    }

    calculateTransfers() {
        if (!this.currentSession) return 0;
        
        // Transferencias de la sesión actual
        const sales = this.db.getSales();
        const sessionSales = sales.filter(sale => {
            const saleDate = sale.fecha || sale.timestamp;
            const sessionStart = this.currentSession.openedAt;
            return new Date(saleDate) >= new Date(sessionStart);
        });
        
        return sessionSales.reduce((sum, sale) => {
            if (sale.metodoPago === 'transferencia') {
                return sum + sale.total;
            } else if (sale.metodoPago === 'mixto' && sale.paymentData && sale.paymentData.cardAmount) {
                // Sumar la parte de transferencia de los pagos mixtos
                return sum + sale.paymentData.cardAmount;
            }
            return sum;
        }, 0);
    }

    calculateReceivedCash() {
        if (!this.currentSession) return 0;
        
        // Ventas en efectivo de la sesión actual
        const sales = this.db.getSales();
        const sessionSales = sales.filter(sale => {
            const saleDate = sale.fecha || sale.timestamp;
            const sessionStart = this.currentSession.openedAt;
            return new Date(saleDate) >= new Date(sessionStart);
        });
        
        const salesCash = sessionSales.reduce((sum, sale) => {
            if (sale.metodoPago === 'efectivo') {
                return sum + sale.total;
            } else if (sale.metodoPago === 'mixto' && sale.paymentData && sale.paymentData.cashAmount) {
                // Sumar la parte de efectivo de los pagos mixtos
                return sum + sale.paymentData.cashAmount;
            }
            return sum;
        }, 0);
        
        // Movimientos de caja (entradas - salidas)
        const movements = this.currentSession.movements || [];
        const cashIn = movements
            .filter(m => m.type === 'in')
            .reduce((sum, m) => sum + m.amount, 0);
        
        const cashOut = movements
            .filter(m => m.type === 'out')
            .reduce((sum, m) => sum + m.amount, 0);
        
        // Efectivo recibido = ventas en efectivo + entradas - salidas (SIN contar la base inicial)
        return salesCash + cashIn - cashOut;
    }

    closeCash() {
        try {
            const finalAmount = parseFloat(document.getElementById('finalAmount').value) || 0;
            const notes = document.getElementById('closingNotes').value.trim();
            
            const closedSession = this.db.closeCashSession(finalAmount, notes);
            
            // Cerrar modal
            document.getElementById('closeCashModal').remove();
            
            // Mostrar resumen
            this.showClosingSummary(closedSession);
            
            // Actualizar interfaz
            this.currentSession = null;
            this.showCashOpeningForm();
            
            this.showNotification('✅ Caja cerrada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al cerrar caja:', error);
            this.showNotification('❌ Error al cerrar caja: ' + error.message, 'error');
        }
    }

    // === INTERFAZ ===
    showCashSessionInfo() {
        const container = document.getElementById('cashContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="cash-session-info">
                <div class="session-header">
                    <h3>🟢 Caja Abierta</h3>
                    <div class="session-meta">
                        <span>Cajero: ${this.currentSession.userName}</span>
                        <span>Desde: ${new Date(this.currentSession.openedAt).toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="cash-stats">
                    <div class="stat-card">
                        <div class="stat-label">💵 Efectivo Recibido</div>
                        <div class="stat-value" id="receivedCashAmount">$${this.calculateReceivedCash().toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Efectivo en Caja</div>
                        <div class="stat-value" id="cashAmount">$${this.calculateExpectedCash().toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Transferencias</div>
                        <div class="stat-value" id="transferAmount">$0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">💰 Entradas</div>
                        <div class="stat-value" id="movementEntradas">$0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">💸 Salidas</div>
                        <div class="stat-value" id="movementSalidas">$0</div>
                    </div>
                    <div class="stat-card total-card">
                        <div class="stat-label">Total Ingresos</div>
                        <div class="stat-value" id="totalAmount">$${this.calculateExpectedCash().toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Ventas del Turno</div>
                        <div class="stat-value" id="sessionSales">$0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Transacciones</div>
                        <div class="stat-value" id="transactionCount">0</div>
                    </div>
                </div>
                
                <div class="cash-actions">
                    <button class="btn btn-primary" id="addMovementBtn">
                        <i class="fas fa-exchange-alt"></i>
                        Movimiento de Caja
                    </button>
                    <button class="btn btn-secondary" id="viewHistoryBtn">
                        <i class="fas fa-history"></i>
                        Ver Historial
                    </button>
                    <button class="btn btn-info" id="refreshDataBtn">
                        <i class="fas fa-sync-alt"></i>
                        Actualizar Datos
                    </button>
                    <button class="btn btn-warning" id="printArqueoBtn">
                        <i class="fas fa-print"></i>
                        Imprimir Arqueo
                    </button>
                    <button class="btn btn-danger" id="closeCashBtn">
                        <i class="fas fa-lock"></i>
                        Cerrar Caja
                    </button>
                </div>
                
                <div class="recent-movements" id="recentMovements">
                    <!-- Los movimientos se cargarán aquí -->
                </div>
            </div>
        `;
        
        console.log('🔄 [CajaManager] HTML de sesión activa generado');
    }

    showCashOpeningForm() {
        console.log('🔧 [CajaManager] showCashOpeningForm iniciado');
        const container = document.getElementById('cashContainer');
        if (!container) {
            console.error('❌ [CajaManager] No se encontró el contenedor cashContainer');
            return;
        }
        
        console.log('✅ [CajaManager] Container encontrado, generando HTML');
        container.innerHTML = `
            <div class="cash-opening-form">
                <div class="opening-message">
                    <h3>🔴 Caja Cerrada</h3>
                    <p>No hay una sesión de caja activa. Debe abrir caja para comenzar a trabajar.</p>
                </div>
                
                <div class="opening-actions">
                    <button class="btn btn-primary btn-lg" id="openCashBtn">
                        <i class="fas fa-cash-register"></i>
                        Abrir Caja
                    </button>
                </div>
                
                <div class="daily-summary" id="dailySummary">
                    <!-- Resumen del día se cargará aquí -->
                </div>
            </div>
        `;
        
        console.log('🔄 [CajaManager] HTML de apertura generado');
        console.log('🔧 [CajaManager] Verificando botón openCashBtn:', !!document.getElementById('openCashBtn'));
        
        // Cargar resumen del día
        this.loadDailySummary();
    }

    loadDailySummary() {
        console.log('📊 [CajaManager] Cargando resumen del día...');
        try {
            const container = document.getElementById('dailySummary');
            if (!container) {
                console.log('⚠️ [CajaManager] No se encontró contenedor dailySummary');
                return;
            }

            // Obtener ventas del día
            const sales = this.db.getSales();
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            const todaySales = sales.filter(sale => {
                const saleDate = new Date(sale.timestamp);
                return saleDate >= todayStart;
            });

            const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
            const totalTransactions = todaySales.length;

            container.innerHTML = `
                <h4>📈 Resumen del Día</h4>
                <div class="summary-stats">
                    <div class="summary-item">
                        <span class="summary-label">💰 Ventas del día:</span>
                        <span class="summary-value">$${totalSales.toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">🧾 Transacciones:</span>
                        <span class="summary-value">${totalTransactions}</span>
                    </div>
                </div>
            `;
            
            console.log('✅ [CajaManager] Resumen del día cargado');
        } catch (error) {
            console.error('❌ [CajaManager] Error cargando resumen del día:', error);
        }
    }

    showClosingSummary(closedSession) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'closingSummaryModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>📊 Resumen de Cierre de Caja</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="closing-summary">
                        <div class="summary-section">
                            <h4>💰 Información de la Sesión</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">Cajero:</span>
                                    <span class="value">${closedSession.userName}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Apertura:</span>
                                    <span class="value">${new Date(closedSession.openedAt).toLocaleString()}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Cierre:</span>
                                    <span class="value">${new Date(closedSession.closedAt).toLocaleString()}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Duración:</span>
                                    <span class="value">${this.calculateSessionDuration(closedSession)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="summary-section">
                            <h4>💵 Resumen Financiero</h4>
                            <div class="financial-grid">
                                <div class="financial-item">
                                    <span class="label">Monto inicial:</span>
                                    <span class="value">$${(closedSession.initialAmount || 0).toLocaleString()}</span>
                                </div>
                                <div class="financial-item">
                                    <span class="label">Ventas totales:</span>
                                    <span class="value">$${(closedSession.totalSales || 0).toLocaleString()}</span>
                                </div>
                                <div class="financial-item">
                                    <span class="label">Efectivo contado:</span>
                                    <span class="value">$${(closedSession.finalAmount || 0).toLocaleString()}</span>
                                </div>
                                <div class="financial-item ${closedSession.difference === 0 ? 'perfect' : closedSession.difference > 0 ? 'surplus' : 'deficit'}">
                                    <span class="label">Diferencia:</span>
                                    <span class="value">${closedSession.difference >= 0 ? '+' : ''}$${closedSession.difference.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="summary-section">
                            <h4>📊 Métodos de Pago</h4>
                            <div class="payment-methods">
                                <div class="payment-item">
                                    <span class="label">Efectivo:</span>
                                    <span class="value">$${closedSession.totalCash.toLocaleString()}</span>
                                </div>
                                <div class="payment-item">
                                    <span class="label">Tarjeta:</span>
                                    <span class="value">$${closedSession.totalCard.toLocaleString()}</span>
                                </div>
                                <div class="payment-item">
                                    <span class="label">Transferencia:</span>
                                    <span class="value">$${closedSession.totalTransfers.toLocaleString()}</span>
                                </div>
                                <div class="payment-item">
                                    <span class="label">Mixto:</span>
                                    <span class="value">$${closedSession.totalMixed.toLocaleString()}</span>
                                </div>
                                ${closedSession.totalMixed > 0 && (closedSession.cashFromMixed > 0 || closedSession.cardFromMixed > 0) ? `
                                <div class="payment-breakdown">
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">• En efectivo:</span>
                                        <span class="breakdown-value">$${(closedSession.cashFromMixed || 0).toLocaleString()}</span>
                                    </div>
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">• Por transferencia:</span>
                                        <span class="breakdown-value">$${(closedSession.cardFromMixed || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${closedSession.notes ? `
                        <div class="summary-section">
                            <h4>📝 Notas</h4>
                            <div class="notes">${closedSession.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="cajaManager.printClosingSummary(${closedSession.id})">
                        <i class="fas fa-print"></i>
                        Imprimir Resumen
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    calculateSessionDuration(session) {
        try {
            if (!session.closedAt) {
                return 'Sesión activa';
            }
            
            const start = new Date(session.openedAt);
            const end = new Date(session.closedAt);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return 'Fecha inválida';
            }
            
            const duration = end - start;
            
            if (duration < 0) {
                return 'Duración inválida';
            }
            
            const hours = Math.floor(duration / (1000 * 60 * 60));
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${hours}h ${minutes}m`;
        } catch (error) {
            console.error('❌ [CajaManager] Error en calculateSessionDuration:', error, session);
            return 'Error';
        }
    }

    // === MOVIMIENTOS DE CAJA ===
    showMovementModal() {
        console.log('🚀 [CajaManager] Iniciando showMovementModal');
        
        const modal = document.createElement('div');
        modal.className = 'modal active'; // Agregar 'active' para que sea visible
        modal.id = 'movementModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>� Movimiento de Caja</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="movementType">Tipo de movimiento:</label>
                        <select id="movementType" class="form-control">
                            <option value="in">💰 Entrada de dinero</option>
                            <option value="out">💸 Salida de dinero</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="movementAmount">Monto:</label>
                        <div class="input-group">
                            <span class="input-prefix">$</span>
                            <input type="number" id="movementAmount" class="form-control" 
                                   min="0" step="1000" placeholder="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="movementDescription">Descripción:</label>
                        <input type="text" id="movementDescription" class="form-control" 
                               placeholder="Describe el motivo del movimiento..." maxlength="200">
                    </div>
                    
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Este movimiento se registrará en el historial de la sesión actual.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="cajaManager.addMovement()">
                        <i class="fas fa-save"></i>
                        Registrar Movimiento
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('✅ [CajaManager] Modal de movimientos agregado al DOM');
    }

    addMovement() {
        console.log('[CajaManager] 🔧 Iniciando addMovement');
        try {
            const type = document.getElementById('movementType').value;
            const amount = parseFloat(document.getElementById('movementAmount').value);
            const description = document.getElementById('movementDescription').value.trim();
            
            console.log('[CajaManager] 📊 Datos del formulario:', { type, amount, description });
            
            if (!amount || amount <= 0) {
                console.log('[CajaManager] ❌ Monto inválido');
                this.showNotification('El monto debe ser mayor a 0', 'error');
                return;
            }
            
            if (!description) {
                console.log('[CajaManager] ❌ Descripción vacía');
                this.showNotification('La descripción es requerida', 'error');
                return;
            }
            
            if (description.length < 5) {
                this.showNotification('La descripción debe tener al menos 5 caracteres', 'error');
                return;
            }
            
            if (!this.currentUser) {
                this.showNotification('No hay usuario autenticado', 'error');
                return;
            }
            
            // Agregar el movimiento
            this.db.addCashMovement(type, amount, description, this.currentUser.id);
            
            // Cerrar modal
            document.getElementById('movementModal').remove();
            
            // Actualizar display
            this.updateDisplay();
            
            // Mostrar mensaje de éxito
            const typeText = type === 'in' ? 'entrada' : 'salida';
            const icon = type === 'in' ? '💰' : '💸';
            this.showNotification(`${icon} ${typeText} de $${amount.toLocaleString()} registrada exitosamente`, 'success');
            
        } catch (error) {
            console.error('Error al agregar movimiento:', error);
            this.showNotification('❌ Error: ' + error.message, 'error');
        }
    }

    // === HISTORIAL ===
    showHistoryModal() {
        console.log('📜 [CajaManager] Iniciando showHistoryModal');
        
        try {
            // Verificar que la base de datos esté disponible
            if (!this.db || typeof this.db.getCashSessions !== 'function') {
                throw new Error('Base de datos no disponible o método getCashSessions no encontrado');
            }
            
            const sessions = this.db.getCashSessions();
            console.log('📜 [CajaManager] Sesiones obtenidas:', sessions.length);
            
            const recentSessions = sessions.slice(-10).reverse(); // Últimas 10 sesiones
            console.log('📜 [CajaManager] Sesiones recientes:', recentSessions.length);
            
            // Diagnosticar sesiones con valores null
            recentSessions.forEach((session, index) => {
                if (session.totalSales === null || session.totalSales === undefined) {
                    console.warn(`⚠️ [CajaManager] Sesión ${index} tiene totalSales null/undefined:`, session);
                }
                if (session.difference === null || session.difference === undefined) {
                    console.warn(`⚠️ [CajaManager] Sesión ${index} tiene difference null/undefined:`, session);
                }
                if (session.initialAmount === null || session.initialAmount === undefined) {
                    console.warn(`⚠️ [CajaManager] Sesión ${index} tiene initialAmount null/undefined:`, session);
                }
                if (session.finalAmount === null || session.finalAmount === undefined) {
                    console.warn(`⚠️ [CajaManager] Sesión ${index} tiene finalAmount null/undefined:`, session);
                }
            });
            
            // Cerrar modal existente si hay uno
            const existingModal = document.getElementById('historyModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            const modal = document.createElement('div');
            modal.className = 'modal active'; // Agregar 'active' para que sea visible
            modal.id = 'historyModal';
        modal.innerHTML = `
            <style>
                .error-row {
                    background-color: #ffebee !important;
                    color: #c62828 !important;
                    font-weight: bold;
                    text-align: center;
                }
            </style>
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>📜 Historial de Sesiones</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="history-table">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Cajero</th>
                                    <th>Duración</th>
                                    <th>Ventas</th>
                                    <th>Diferencia</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentSessions.map((session, index) => {
                                    try {
                                        console.log(`🔍 [CajaManager] Procesando sesión ${index}:`, {
                                            id: session.id,
                                            totalSales: session.totalSales,
                                            difference: session.difference,
                                            initialAmount: session.initialAmount,
                                            finalAmount: session.finalAmount,
                                            openedAt: session.openedAt,
                                            closedAt: session.closedAt,
                                            status: session.status
                                        });
                                        
                                        const durationText = session.status === 'closed' ? this.calculateSessionDuration(session) : 'Activa';
                                        
                                        return `
                                        <tr>
                                            <td>${new Date(session.openedAt).toLocaleDateString()}</td>
                                            <td>${session.userName || 'Sin usuario'}</td>
                                            <td>${durationText}</td>
                                            <td>$${(session.totalSales || 0).toLocaleString()}</td>
                                            <td class="${(session.difference || 0) === 0 ? 'perfect' : (session.difference || 0) > 0 ? 'surplus' : 'deficit'}">
                                                ${(session.difference || 0) >= 0 ? '+' : ''}$${Math.abs(session.difference || 0).toLocaleString()}
                                            </td>
                                            <td>
                                                <span class="status ${session.status}">
                                                    ${session.status === 'open' ? '🟢 Abierta' : '🔴 Cerrada'}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="cajaManager.viewSessionDetails(${session.id})">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>`;
                                    } catch (error) {
                                        console.error(`❌ [CajaManager] Error procesando sesión ${index}:`, error, session);
                                        return `
                                        <tr>
                                            <td colspan="7" class="error-row">
                                                Error procesando sesión ${session.id || 'desconocida'}
                                            </td>
                                        </tr>`;
                                    }
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('📜 [CajaManager] Modal de historial creado y agregado al DOM');
        
        } catch (error) {
            console.error('❌ [CajaManager] Error en showHistoryModal:', error);
            this.showNotification('❌ Error mostrando historial: ' + error.message, 'error');
        }
    }

    viewSessionDetails(sessionId) {
        const sessions = this.db.getCashSessions();
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            this.showNotification('Sesión no encontrada', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'sessionDetailsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>📊 Detalles de Sesión - ${session.userName}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="session-summary">
                        <div class="summary-grid">
                            <div class="summary-item">
                                <span class="label">Fecha apertura:</span>
                                <span class="value">${new Date(session.openedAt).toLocaleString()}</span>
                            </div>
                            ${session.status === 'closed' ? `
                            <div class="summary-item">
                                <span class="label">Fecha cierre:</span>
                                <span class="value">${new Date(session.closedAt).toLocaleString()}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Duración:</span>
                                <span class="value">${this.calculateSessionDuration(session)}</span>
                            </div>
                            ` : ''}
                            <div class="summary-item">
                                <span class="label">Monto inicial:</span>
                                <span class="value">$${(session.initialAmount || 0).toLocaleString()}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Total ventas:</span>
                                <span class="value">$${(session.totalSales || 0).toLocaleString()}</span>
                            </div>
                            ${session.status === 'closed' ? `
                            <div class="summary-item">
                                <span class="label">Monto final:</span>
                                <span class="value">$${(session.finalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Diferencia:</span>
                                <span class="value ${session.difference === 0 ? 'perfect' : session.difference > 0 ? 'surplus' : 'deficit'}">
                                    ${session.difference >= 0 ? '+' : ''}$${session.difference.toLocaleString()}
                                </span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${session.movements && session.movements.length > 1 ? `
                    <div class="movements-section">
                        <h4>📝 Movimientos de Caja</h4>
                        <div class="movements-list">
                            ${session.movements.map(movement => `
                                <div class="movement-detail">
                                    <div class="movement-icon">
                                        ${movement.type === 'opening' ? '🟢' : 
                                          movement.type === 'closing' ? '🔴' : 
                                          movement.type === 'in' ? '💰' : '💸'}
                                    </div>
                                    <div class="movement-info">
                                        <div class="movement-description">${movement.description}</div>
                                        <div class="movement-time">${new Date(movement.timestamp).toLocaleString()}</div>
                                    </div>
                                    <div class="movement-amount ${movement.type}">
                                        ${movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}$${movement.amount.toLocaleString()}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${session.notes ? `
                    <div class="notes-section">
                        <h4>📝 Notas</h4>
                        <div class="notes-content">${session.notes}</div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    ${session.status === 'closed' ? `
                    <button type="button" class="btn btn-primary" onclick="cajaManager.printClosingSummary(${session.id})">
                        <i class="fas fa-print"></i>
                        Imprimir Resumen
                    </button>
                    ` : ''}
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // === ACTUALIZACIÓN DE DATOS ===
    updateCashInfo() {
        console.log('🔄 [CajaManager] Actualizando información de caja...');
        
        const receivedCashAmountElement = document.getElementById('receivedCashAmount');
        const cashAmountElement = document.getElementById('cashAmount');
        const transferAmountElement = document.getElementById('transferAmount');
        const totalAmountElement = document.getElementById('totalAmount');
        const sessionSalesElement = document.getElementById('sessionSales');
        const transactionCountElement = document.getElementById('transactionCount');
        const movementEntradasElement = document.getElementById('movementEntradas');
        const movementSalidasElement = document.getElementById('movementSalidas');
        
        const receivedCash = this.calculateReceivedCash();
        const expectedCash = this.calculateExpectedCash();
        const transfers = this.calculateTransfers();
        const totalAmount = expectedCash + transfers;
        
        // Calcular movimientos de caja
        const movements = this.currentSession?.movements || [];
        const entradas = movements
            .filter(m => m.type === 'in')
            .reduce((sum, m) => sum + m.amount, 0);
        
        const salidas = movements
            .filter(m => m.type === 'out')
            .reduce((sum, m) => sum + m.amount, 0);
        
        if (receivedCashAmountElement) {
            receivedCashAmountElement.textContent = `$${receivedCash.toLocaleString()}`;
        }
        
        if (cashAmountElement) {
            cashAmountElement.textContent = `$${expectedCash.toLocaleString()}`;
        }
        
        if (transferAmountElement) {
            transferAmountElement.textContent = `$${transfers.toLocaleString()}`;
        }
        
        if (totalAmountElement) {
            totalAmountElement.textContent = `$${totalAmount.toLocaleString()}`;
        }
        
        if (movementEntradasElement) {
            movementEntradasElement.textContent = `$${entradas.toLocaleString()}`;
        }
        
        if (movementSalidasElement) {
            movementSalidasElement.textContent = `$${salidas.toLocaleString()}`;
        }
        
        if (this.currentSession) {
            // Calcular ventas de la sesión
            const sales = this.db.getSales();
            const sessionSales = sales.filter(sale => 
                new Date(sale.timestamp) >= new Date(this.currentSession.openedAt)
            );
            
            const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
            
            console.log(`📊 [CajaManager] Ventas de sesión: ${sessionSales.length} transacciones, $${totalSales.toLocaleString()}`);
            
            if (sessionSalesElement) {
                sessionSalesElement.textContent = `$${totalSales.toLocaleString()}`;
                console.log('✅ [CajaManager] Elemento sessionSales actualizado');
            } else {
                console.log('❌ [CajaManager] Elemento sessionSales NO encontrado');
            }
            
            if (transactionCountElement) {
                transactionCountElement.textContent = sessionSales.length;
                console.log('✅ [CajaManager] Elemento transactionCount actualizado');
            } else {
                console.log('❌ [CajaManager] Elemento transactionCount NO encontrado');
            }
        } else {
            console.log('⚠️ [CajaManager] No hay sesión activa para calcular ventas');
        }
    }

    updateMovements() {
        const container = document.getElementById('recentMovements');
        if (!container || !this.currentSession) return;
        
        const movements = [...(this.currentSession.movements || [])].reverse().slice(0, 5);
        
        container.innerHTML = `
            <h4>📝 Movimientos Recientes</h4>
            ${movements.length > 0 ? movements.map(movement => `
                <div class="movement-item">
                    <div class="movement-info">
                        <div class="movement-type">
                            ${movement.type === 'opening' ? '🟢 Apertura' : 
                              movement.type === 'closing' ? '🔴 Cierre' :
                              movement.type === 'in' ? '💰 Entrada' : '💸 Salida'}
                        </div>
                        <div class="movement-description">${movement.description}</div>
                        <div class="movement-time">${new Date(movement.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div class="movement-amount ${movement.type === 'in' || movement.type === 'opening' ? 'positive' : 'negative'}">
                        ${movement.type === 'out' ? '-' : '+'}$${movement.amount.toLocaleString()}
                    </div>
                </div>
            `).join('') : '<p>No hay movimientos registrados.</p>'}
        `;
    }

    updateStats() {
        // Actualizar estadísticas adicionales si es necesario
    }

    // === IMPRESIÓN ===
    printArqueo() {
        if (!this.currentSession) {
            this.showNotification('❌ No hay sesión activa para imprimir', 'error');
            return;
        }
        
        // Generar contenido del arqueo
        const arqueoContent = this.generateArqueoContent(this.currentSession);
        
        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        printWindow.document.write(arqueoContent);
        printWindow.document.close();
        printWindow.print();
    }

    printClosingSummary(sessionId) {
        const sessions = this.db.getCashSessions();
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            this.showNotification('❌ Sesión no encontrada', 'error');
            return;
        }
        
        const summaryContent = this.generateClosingSummaryContent(session);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(summaryContent);
        printWindow.document.close();
        printWindow.print();
    }

    generateArqueoContent(session) {
        const receivedCash = this.calculateReceivedCash();
        const expectedCash = this.calculateExpectedCash();
        
        // Calcular transferencias recibidas en la sesión
        const sales = this.db.getSales();
        const sessionSales = sales.filter(sale => {
            const saleDate = sale.fecha || sale.timestamp;
            const sessionStart = session.openedAt;
            return new Date(saleDate) >= new Date(sessionStart);
        });
        
        const transferencias = sessionSales.reduce((sum, sale) => {
            if (sale.metodoPago === 'transferencia') {
                return sum + sale.total;
            } else if (sale.metodoPago === 'mixto' && sale.paymentData && sale.paymentData.cardAmount) {
                // Sumar la parte de transferencia de los pagos mixtos
                return sum + sale.paymentData.cardAmount;
            }
            return sum;
        }, 0);
        
        // Calcular movimientos de caja (entradas y salidas)
        const movements = session.movements || [];
        const entradas = movements
            .filter(m => m.type === 'in')
            .reduce((sum, m) => sum + m.amount, 0);
        
        const salidas = movements
            .filter(m => m.type === 'out')
            .reduce((sum, m) => sum + m.amount, 0);
        
        const netMovements = entradas - salidas;
        
        const montoTotal = expectedCash + transferencias;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Arqueo de Caja</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .info-table th, .info-table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    .total { font-weight: bold; font-size: 16px; }
                    .highlight { background-color: #e8f5e8; font-weight: bold; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CRÊPES & KAFFEE</h1>
                    <h2>Arqueo de Caja</h2>
                    <p>Fecha: ${new Date().toLocaleString()}</p>
                </div>
                
                <table class="info-table">
                    <tr><th>Cajero:</th><td>${session.userName}</td></tr>
                    <tr><th>Apertura:</th><td>${new Date(session.openedAt).toLocaleString()}</td></tr>
                    <tr><th>Monto inicial:</th><td>$${session.initialAmount.toLocaleString()}</td></tr>
                    <tr style="background-color: #e8f4fd;"><th>💵 Efectivo recibido:</th><td>$${receivedCash.toLocaleString()}</td></tr>
                    <tr><th>Efectivo esperado:</th><td>$${expectedCash.toLocaleString()}</td></tr>
                    <tr><th>Transferencias recibidas:</th><td>$${transferencias.toLocaleString()}</td></tr>
                    <tr style="background-color: #f0f8ff;"><th>💰 Entradas de caja:</th><td>+$${entradas.toLocaleString()}</td></tr>
                    <tr style="background-color: #fff0f0;"><th>💸 Salidas de caja:</th><td>-$${salidas.toLocaleString()}</td></tr>
                    <tr style="background-color: #f8f8f8;"><th>🔄 Movimientos netos:</th><td>${netMovements >= 0 ? '+' : ''}$${netMovements.toLocaleString()}</td></tr>
                    <tr class="highlight"><th>Monto total (Efectivo + Transferencias):</th><td>$${montoTotal.toLocaleString()}</td></tr>
                    <tr><th>Estado:</th><td>${session.status === 'open' ? 'Abierta' : 'Cerrada'}</td></tr>
                </table>
                
                ${movements.length > 0 ? `
                <h3>📝 Detalle de Movimientos de Caja</h3>
                <table class="info-table">
                    <tr><th>Hora</th><th>Tipo</th><th>Monto</th><th>Descripción</th></tr>
                    ${movements.map(movement => `
                        <tr>
                            <td>${new Date(movement.timestamp).toLocaleTimeString()}</td>
                            <td>${movement.type === 'in' ? '💰 Entrada' : movement.type === 'out' ? '💸 Salida' : movement.type === 'opening' ? '🟢 Apertura' : '🔴 Cierre'}</td>
                            <td>${movement.type === 'out' ? '-' : '+'}$${movement.amount.toLocaleString()}</td>
                            <td>${movement.description}</td>
                        </tr>
                    `).join('')}
                </table>
                ` : ''}
                
                <p><strong>Nota:</strong> Este documento es un arqueo de caja en tiempo real.</p>
                <p><strong>Efectivo recibido:</strong> Dinero en efectivo generado durante la sesión (ventas + entradas - salidas) SIN incluir la base inicial</p>
                <p><strong>Efectivo esperado:</strong> Incluye monto inicial + ventas en efectivo + parte efectivo de pagos mixtos + entradas - salidas</p>
                <p><strong>Transferencias:</strong> Incluye ventas por transferencia + parte transferencia de pagos mixtos</p>
                <p><strong>Movimientos de caja:</strong> Registra todas las entradas y salidas de dinero adicionales a las ventas</p>
            </body>
            </html>
        `;
    }

    generateClosingSummaryContent(session) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Resumen de Cierre de Caja</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .info-table th, .info-table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    .total { font-weight: bold; font-size: 16px; }
                    .difference { font-weight: bold; }
                    .perfect { color: green; }
                    .surplus { color: orange; }
                    .deficit { color: red; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CRÊPES & KAFFEE</h1>
                    <h2>Resumen de Cierre de Caja</h2>
                    <p>Fecha: ${new Date(session.closedAt).toLocaleString()}</p>
                </div>
                
                <table class="info-table">
                    <tr><th>Cajero:</th><td>${session.userName}</td></tr>
                    <tr><th>Apertura:</th><td>${new Date(session.openedAt).toLocaleString()}</td></tr>
                    <tr><th>Cierre:</th><td>${new Date(session.closedAt).toLocaleString()}</td></tr>
                    <tr><th>Duración:</th><td>${this.calculateSessionDuration(session)}</td></tr>
                </table>
                
                <table class="info-table">
                    <tr><th>Monto inicial:</th><td>$${(session.initialAmount || 0).toLocaleString()}</td></tr>
                    <tr><th>Ventas totales:</th><td>$${(session.totalSales || 0).toLocaleString()}</td></tr>
                    <tr><th>Efectivo contado:</th><td>$${(session.finalAmount || 0).toLocaleString()}</td></tr>
                    <tr class="difference ${(session.difference || 0) === 0 ? 'perfect' : (session.difference || 0) > 0 ? 'surplus' : 'deficit'}">
                        <th>Diferencia:</th>
                        <td>${(session.difference || 0) >= 0 ? '+' : ''}$${Math.abs(session.difference || 0).toLocaleString()}</td>
                    </tr>
                </table>
                
                ${session.notes ? `<p><strong>Notas:</strong> ${session.notes}</p>` : ''}
            </body>
            </html>
        `;
    }

    // === UTILIDADES ===
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
let cajaManager;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 [DOMContentLoaded] Iniciando verificación...');
    
    // Evitar múltiples instancias
    if (cajaManager) {
        console.log('⚠️ [DOMContentLoaded] CajaManager ya existe, saltando inicialización');
        return;
    }
    
    if (document.getElementById('cashContainer')) {
        console.log('✅ [DOMContentLoaded] cashContainer encontrado, creando CajaManager');
        cajaManager = new CajaManager();
        console.log('✅ [DOMContentLoaded] CajaManager creado exitosamente');
    } else {
        console.log('❌ [DOMContentLoaded] cashContainer NO encontrado');
    }
});