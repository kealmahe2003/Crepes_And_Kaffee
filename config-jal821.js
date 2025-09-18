// Configuración específica para JAL-821
// Agregar a configuracion.js si es necesario

const jaltech821Config = {
    // Configuración específica para JAL-821
    printer: {
        name: 'JAL-821',
        type: 'thermal',
        width: '80mm',
        paperWidth: 300, // pixels
        marginTop: 5,
        marginBottom: 10,
        marginLeft: 5,
        marginRight: 5,
        
        // Configuración de corte
        autoCut: true,
        cutAfterPrint: true,
        
        // Configuración de gaveta
        openDrawer: true,
        drawerPort: 'RJ12', // Puerto para gaveta
        
        // Configuración de velocidad
        printSpeed: 'high', // low, medium, high
        density: 'medium',  // low, medium, high
        
        // Configuración de papel
        paperFeed: 3, // líneas después de imprimir
        
        // ESC/POS Commands (para configuración avanzada)
        commands: {
            init: '\x1B\x40',     // Inicializar impresora
            cut: '\x1D\x56\x00',  // Corte completo
            openDrawer: '\x1B\x70\x00\x19\xFA' // Abrir gaveta
        }
    },
    
    // Configuración para tu sistema actual
    integration: {
        defaultPrinter: true,
        autoSelect: true,
        paperSize: '80mm',
        orientation: 'portrait'
    }
};

// Función para aplicar configuración
function applyJAL821Config() {
    // Tu sistema ya está configurado para 80mm
    // Esta función es para futuras personalizaciones
    console.log('Configuración JAL-821 aplicada');
}

// Auto-aplicar al cargar
if (typeof configuracionManager !== 'undefined') {
    // Integrar con sistema existente
    configuracionManager.printerConfig = jaltech821Config;
}