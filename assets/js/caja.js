// Sistema de Caja Registradora - Crêpes & Kaffee

class CajaManager {
    constructor() {
        this.db = new Database();
        this.currentUser = null;
        this.currentSession = null;
        this.init();
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
        // Abrir caja
        const openCashBtn = document.getElementById('openCashBtn');
        if (openCashBtn) {
            openCashBtn.addEventListener('click', () => this.showOpenCashModal());
        }

        // Cerrar caja
        const closeCashBtn = document.getElementById('closeCashBtn');
        if (closeCashBtn) {
            closeCashBtn.addEventListener('click', () => this.showCloseCashModal());
        }

        // Movimientos de caja
        const addMovementBtn = document.getElementById('addMovementBtn');
        if (addMovementBtn) {
            addMovementBtn.addEventListener('click', () => this.showMovementModal());
        }

        // Ver historial
        const viewHistoryBtn = document.getElementById('viewHistoryBtn');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => this.showHistoryModal());
        }

        // Imprimir arqueo
        const printArqueoBtn = document.getElementById('printArqueoBtn');
        if (printArqueoBtn) {
            printArqueoBtn.addEventListener('click', () => this.printArqueo());
        }
    }

    startAutoRefresh() {
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.updateDisplay();
        }, 30000);
    }

    updateDisplay() {
        this.currentSession = this.db.getCurrentCashSession();
        
        if (this.currentSession) {
            this.updateCashInfo();
            this.updateMovements();
            this.updateStats();
        }
    }

    // === APERTURA DE CAJA ===
    showOpenCashModal() {
        console.log('Abriendo modal de apertura de caja');
        
        // Remover modal existente si hay alguno
        const existingModal = document.getElementById('openCashModal');
        if (existingModal) {
            existingModal.remove();
        }
        
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
    }

    openCash() {
        console.log('=== INICIANDO APERTURA DE CAJA ===');
        
        try {
            // Verificar que los elementos existan
            const initialAmountInput = document.getElementById('initialAmount');
            const notesInput = document.getElementById('openingNotes');
            
            console.log('Elementos encontrados:', {
                initialAmountInput: !!initialAmountInput,
                notesInput: !!notesInput
            });
            
            if (!initialAmountInput) {
                throw new Error('No se encontró el campo de monto inicial');
            }
            
            const initialAmount = parseFloat(initialAmountInput.value) || 0;
            const notes = notesInput ? notesInput.value.trim() : '';
            
            console.log('Valores obtenidos:', { initialAmount, notes });
            
            if (initialAmount < 0) {
                throw new Error('El monto inicial no puede ser negativo');
            }
            
            if (!this.currentUser) {
                console.error('Usuario no autenticado');
                throw new Error('No hay usuario autenticado');
            }

            console.log('Usuario actual completo:', this.currentUser);
            console.log('ID del usuario:', this.currentUser.id);
            console.log('Tipo de ID:', typeof this.currentUser.id);
            
            // Verificar que no hay sesión activa
            const existingSession = this.db.getCurrentCashSession();
            if (existingSession) {
                throw new Error('Ya hay una sesión de caja activa');
            }
            
            // Deshabilitar botón para evitar clicks múltiples
            const openButton = document.getElementById('confirmOpenCash');
            if (openButton) {
                openButton.disabled = true;
                openButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abriendo...';
            }

            console.log('Llamando a db.openCashSession...');
            const session = this.db.openCashSession(this.currentUser.id, initialAmount, notes, this.currentUser.name);
            this.currentSession = session;
            
            console.log('Sesión de caja creada exitosamente:', session);
            
            // Cerrar modal
            const modal = document.getElementById('openCashModal');
            if (modal) {
                modal.remove();
                console.log('Modal cerrado');
            }
            
            // Actualizar interfaz
            console.log('Actualizando interfaz...');
            this.showCashSessionInfo();
            this.updateDisplay();
            
            // Mostrar notificación de éxito
            this.showNotification('✅ Caja abierta exitosamente', 'success');
            console.log('Notificación mostrada');
            
            // Mostrar resumen de apertura
            setTimeout(() => {
                this.showOpeningSummary(session);
            }, 500);
            
            console.log('=== APERTURA DE CAJA COMPLETADA ===');
            
        } catch (error) {
            console.error('=== ERROR EN APERTURA DE CAJA ===');
            console.error('Error completo:', error);
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
        modal.className = 'modal';
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
        const sessionSales = sales.filter(sale => 
            new Date(sale.timestamp) >= new Date(this.currentSession.openedAt) &&
            sale.metodoPago === 'efectivo'
        );
        
        const salesCash = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
        
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
                        <div class="stat-label">Efectivo en Caja</div>
                        <div class="stat-value" id="cashAmount">$${this.calculateExpectedCash().toLocaleString()}</div>
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
        
        // Re-bind events
        this.bindEvents();
    }

    showCashOpeningForm() {
        const container = document.getElementById('cashContainer');
        if (!container) return;
        
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
        
        // Re-bind events
        this.bindEvents();
        
        // Cargar resumen del día
        this.loadDailySummary();
    }

    showClosingSummary(closedSession) {
        const modal = document.createElement('div');
        modal.className = 'modal';
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
                                    <span class="value">$${closedSession.initialAmount.toLocaleString()}</span>
                                </div>
                                <div class="financial-item">
                                    <span class="label">Ventas totales:</span>
                                    <span class="value">$${closedSession.totalSales.toLocaleString()}</span>
                                </div>
                                <div class="financial-item">
                                    <span class="label">Efectivo contado:</span>
                                    <span class="value">$${closedSession.finalAmount.toLocaleString()}</span>
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
        const start = new Date(session.openedAt);
        const end = new Date(session.closedAt);
        const duration = end - start;
        
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    // === MOVIMIENTOS DE CAJA ===
    showMovementModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
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
    }

    addMovement() {
        try {
            const type = document.getElementById('movementType').value;
            const amount = parseFloat(document.getElementById('movementAmount').value);
            const description = document.getElementById('movementDescription').value.trim();
            
            if (!amount || amount <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }
            
            if (!description) {
                throw new Error('La descripción es requerida');
            }
            
            if (!this.currentUser) {
                throw new Error('No hay usuario autenticado');
            }
            
            this.db.addCashMovement(type, amount, description, this.currentUser.id);
            
            // Cerrar modal
            document.getElementById('movementModal').remove();
            
            // Actualizar display
            this.updateDisplay();
            
            const icon = type === 'in' ? '💰' : '💸';
            const action = type === 'in' ? 'registrada' : 'registrada';
            this.showNotification(`${icon} Movimiento ${action} exitosamente`, 'success');
            
        } catch (error) {
            console.error('Error al agregar movimiento:', error);
            this.showNotification('❌ Error: ' + error.message, 'error');
        }
    }

    // === HISTORIAL ===
    showHistoryModal() {
        const sessions = this.db.getCashSessions();
        const recentSessions = sessions.slice(-10).reverse(); // Últimas 10 sesiones
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'historyModal';
        modal.innerHTML = `
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
                                ${recentSessions.map(session => `
                                    <tr>
                                        <td>${new Date(session.openedAt).toLocaleDateString()}</td>
                                        <td>${session.userName}</td>
                                        <td>${session.status === 'closed' ? this.calculateSessionDuration(session) : 'Activa'}</td>
                                        <td>$${session.totalSales.toLocaleString()}</td>
                                        <td class="${session.difference === 0 ? 'perfect' : session.difference > 0 ? 'surplus' : 'deficit'}">
                                            ${session.difference >= 0 ? '+' : ''}$${session.difference.toLocaleString()}
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
                                    </tr>
                                `).join('')}
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
    }

    // === ACTUALIZACIÓN DE DATOS ===
    updateCashInfo() {
        const cashAmountElement = document.getElementById('cashAmount');
        const sessionSalesElement = document.getElementById('sessionSales');
        const transactionCountElement = document.getElementById('transactionCount');
        
        if (cashAmountElement) {
            cashAmountElement.textContent = `$${this.calculateExpectedCash().toLocaleString()}`;
        }
        
        if (this.currentSession) {
            // Calcular ventas de la sesión
            const sales = this.db.getSales();
            const sessionSales = sales.filter(sale => 
                new Date(sale.timestamp) >= new Date(this.currentSession.openedAt)
            );
            
            const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
            
            if (sessionSalesElement) {
                sessionSalesElement.textContent = `$${totalSales.toLocaleString()}`;
            }
            
            if (transactionCountElement) {
                transactionCountElement.textContent = sessionSales.length;
            }
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
        const expectedCash = this.calculateExpectedCash();
        
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
                    <tr><th>Efectivo esperado:</th><td>$${expectedCash.toLocaleString()}</td></tr>
                    <tr><th>Estado:</th><td>${session.status === 'open' ? 'Abierta' : 'Cerrada'}</td></tr>
                </table>
                
                <p><strong>Nota:</strong> Este documento es un arqueo de caja en tiempo real.</p>
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
                    <tr><th>Monto inicial:</th><td>$${session.initialAmount.toLocaleString()}</td></tr>
                    <tr><th>Ventas totales:</th><td>$${session.totalSales.toLocaleString()}</td></tr>
                    <tr><th>Efectivo contado:</th><td>$${session.finalAmount.toLocaleString()}</td></tr>
                    <tr class="difference ${session.difference === 0 ? 'perfect' : session.difference > 0 ? 'surplus' : 'deficit'}">
                        <th>Diferencia:</th>
                        <td>${session.difference >= 0 ? '+' : ''}$${session.difference.toLocaleString()}</td>
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
    if (document.getElementById('cashContainer')) {
        cajaManager = new CajaManager();
    }
});