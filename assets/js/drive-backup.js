// Sistema de Respaldos Automáticos a Google Drive
class DriveBackupManager {
    constructor() {
        this.isAuthenticated = false;
        this.driveConfig = this.loadDriveConfig();
        this.init();
    }

    init() {
        // Cargar Google API
        this.loadGoogleAPI();
    }

    loadDriveConfig() {
        const defaultConfig = {
            autoUploadToDrive: false,
            driveFolder: 'Respaldos_POS_Crepes_Kaffee',
            maxBackupsInDrive: 10, // Mantener solo los últimos 10 respaldos
            autoUploadSchedule: 'daily', // daily, weekly, manual
            lastUpload: null
        };

        const stored = localStorage.getItem('drive_backup_config');
        return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    }

    saveDriveConfig(config) {
        localStorage.setItem('drive_backup_config', JSON.stringify(config));
        this.driveConfig = config;
    }

    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            // Cargar Google API dinámicamente
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('auth2', () => {
                    window.gapi.load('client', resolve);
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeGoogleDrive() {
        try {
            await window.gapi.client.init({
                apiKey: 'TU_API_KEY_AQUI', // Necesitas configurar esto
                clientId: 'TU_CLIENT_ID_AQUI', // Necesitas configurar esto
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: 'https://www.googleapis.com/auth/drive.file'
            });

            this.authInstance = window.gapi.auth2.getAuthInstance();
            this.isAuthenticated = this.authInstance.isSignedIn.get();
            
            console.log('[DriveBackup] Google Drive API inicializada');
            return true;
        } catch (error) {
            console.error('[DriveBackup] Error inicializando Google Drive API:', error);
            return false;
        }
    }

    async authenticateWithDrive() {
        try {
            if (!this.authInstance) {
                await this.initializeGoogleDrive();
            }

            if (!this.isAuthenticated) {
                await this.authInstance.signIn();
                this.isAuthenticated = true;
            }

            console.log('[DriveBackup] Autenticado con Google Drive');
            return true;
        } catch (error) {
            console.error('[DriveBackup] Error de autenticación:', error);
            return false;
        }
    }

    async createDriveFolder() {
        try {
            // Verificar si la carpeta ya existe
            const response = await window.gapi.client.drive.files.list({
                q: `name='${this.driveConfig.driveFolder}' and mimeType='application/vnd.google-apps.folder'`,
                spaces: 'drive'
            });

            if (response.result.files.length > 0) {
                return response.result.files[0].id;
            }

            // Crear nueva carpeta
            const folderResponse = await window.gapi.client.drive.files.create({
                resource: {
                    name: this.driveConfig.driveFolder,
                    mimeType: 'application/vnd.google-apps.folder'
                }
            });

            console.log('[DriveBackup] Carpeta creada en Drive:', this.driveConfig.driveFolder);
            return folderResponse.result.id;
        } catch (error) {
            console.error('[DriveBackup] Error creando carpeta en Drive:', error);
            throw error;
        }
    }

    async uploadBackupToDrive(backupData, filename) {
        try {
            console.log('[DriveBackup] Iniciando subida a Google Drive...');

            if (!await this.authenticateWithDrive()) {
                throw new Error('No se pudo autenticar con Google Drive');
            }

            const folderId = await this.createDriveFolder();
            
            // Convertir datos a blob
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
                type: 'application/json' 
            });

            // Crear FormData para la subida
            const metadata = {
                name: filename,
                parents: [folderId],
                description: `Respaldo automático del POS Crêpes & Kaffee - ${new Date().toLocaleString()}`
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], {
                type: 'application/json'
            }));
            formData.append('file', blob);

            // Subir archivo
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[DriveBackup] Archivo subido exitosamente:', result);
                
                // Actualizar configuración con último upload
                this.driveConfig.lastUpload = new Date().toISOString();
                this.saveDriveConfig(this.driveConfig);
                
                // Limpiar respaldos antiguos si es necesario
                await this.cleanOldBackups(folderId);
                
                return result;
            } else {
                throw new Error(`Error subiendo a Drive: ${response.status}`);
            }
        } catch (error) {
            console.error('[DriveBackup] Error subiendo a Google Drive:', error);
            throw error;
        }
    }

    async cleanOldBackups(folderId) {
        try {
            const response = await window.gapi.client.drive.files.list({
                q: `'${folderId}' in parents and name contains 'backup_crepes_kaffee'`,
                orderBy: 'createdTime desc',
                spaces: 'drive'
            });

            const files = response.result.files;
            if (files.length > this.driveConfig.maxBackupsInDrive) {
                const filesToDelete = files.slice(this.driveConfig.maxBackupsInDrive);
                
                for (const file of filesToDelete) {
                    await window.gapi.client.drive.files.delete({
                        fileId: file.id
                    });
                    console.log('[DriveBackup] Respaldo antiguo eliminado:', file.name);
                }
            }
        } catch (error) {
            console.error('[DriveBackup] Error limpiando respaldos antiguos:', error);
        }
    }

    async createBackupAndUpload() {
        try {
            if (!this.driveConfig.autoUploadToDrive) {
                console.log('[DriveBackup] Subida automática a Drive deshabilitada');
                return false;
            }

            // Crear respaldo usando el sistema existente
            const database = new Database();
            const backupData = database.createBackup();
            
            // Generar nombre de archivo
            const timestamp = new Date().toISOString().split('T')[0];
            const timeString = new Date().toTimeString().slice(0,5).replace(':', '');
            const filename = `backup_crepes_kaffee_auto_${timestamp}_${timeString}.json`;
            
            // Subir a Drive
            await this.uploadBackupToDrive(backupData, filename);
            
            console.log('[DriveBackup] Respaldo creado y subido automáticamente');
            return true;
        } catch (error) {
            console.error('[DriveBackup] Error en respaldo automático:', error);
            return false;
        }
    }

    // Función para integrar con el botón existente de crear respaldo
    async enhanceExistingBackup(backupData, filename) {
        try {
            if (this.driveConfig.autoUploadToDrive) {
                console.log('[DriveBackup] Subiendo respaldo a Drive automáticamente...');
                await this.uploadBackupToDrive(backupData, filename);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[DriveBackup] Error subiendo respaldo automático:', error);
            return false;
        }
    }

    // Configurar respaldos programados
    startScheduledBackups() {
        if (!this.driveConfig.autoUploadToDrive) return;

        const scheduleMs = this.getScheduleInterval();
        
        setInterval(async () => {
            console.log('[DriveBackup] Ejecutando respaldo programado...');
            await this.createBackupAndUpload();
        }, scheduleMs);

        console.log('[DriveBackup] Respaldos programados iniciados:', this.driveConfig.autoUploadSchedule);
    }

    getScheduleInterval() {
        switch (this.driveConfig.autoUploadSchedule) {
            case 'daily': return 24 * 60 * 60 * 1000; // 24 horas
            case 'weekly': return 7 * 24 * 60 * 60 * 1000; // 7 días
            default: return 24 * 60 * 60 * 1000;
        }
    }

    // Generar configuración para el HTML
    getConfigHTML() {
        return `
            <div class="drive-backup-config">
                <h4>🌐 Respaldos Automáticos a Google Drive</h4>
                
                <div class="form-group">
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="autoUploadToDrive" ${this.driveConfig.autoUploadToDrive ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Subir respaldos automáticamente a Google Drive
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Nombre de carpeta en Drive:</label>
                    <input type="text" id="driveFolder" class="form-input" value="${this.driveConfig.driveFolder}">
                </div>
                
                <div class="form-group">
                    <label>Frecuencia de respaldos automáticos:</label>
                    <select id="autoUploadSchedule" class="form-input">
                        <option value="manual" ${this.driveConfig.autoUploadSchedule === 'manual' ? 'selected' : ''}>Solo manual</option>
                        <option value="daily" ${this.driveConfig.autoUploadSchedule === 'daily' ? 'selected' : ''}>Diario</option>
                        <option value="weekly" ${this.driveConfig.autoUploadSchedule === 'weekly' ? 'selected' : ''}>Semanal</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Máximo respaldos en Drive:</label>
                    <input type="number" id="maxBackupsInDrive" class="form-input" value="${this.driveConfig.maxBackupsInDrive}" min="1" max="50">
                </div>
                
                <div class="drive-actions">
                    <button type="button" class="btn btn-secondary" onclick="driveBackupManager.authenticateWithDrive()">
                        <i class="fas fa-google-drive"></i>
                        Conectar con Google Drive
                    </button>
                    
                    <button type="button" class="btn btn-success" onclick="driveBackupManager.testUpload()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        Probar Subida
                    </button>
                </div>
                
                ${this.driveConfig.lastUpload ? `
                    <div class="last-upload-info">
                        <small>Último respaldo subido: ${new Date(this.driveConfig.lastUpload).toLocaleString()}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async testUpload() {
        try {
            const testData = {
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Archivo de prueba para verificar conexión con Google Drive'
            };
            
            await this.uploadBackupToDrive(testData, `test_connection_${Date.now()}.json`);
            alert('✅ Conexión con Google Drive exitosa!');
        } catch (error) {
            alert('❌ Error conectando con Google Drive: ' + error.message);
        }
    }
}

// Inicializar manager globalmente
window.driveBackupManager = new DriveBackupManager();