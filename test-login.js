// Script de prueba del sistema de login
// Para ejecutar en la consola del navegador

console.log('=== SISTEMA DE LOGIN - CRÊPES & KAFFEE ===');
console.log('');

// Verificar que todos los módulos están cargados
console.log('1. Verificando módulos...');
console.log('✓ Database:', typeof db !== 'undefined' ? 'CARGADO' : 'ERROR');
console.log('✓ Auth:', typeof auth !== 'undefined' ? 'CARGADO' : 'ERROR');
console.log('✓ AuthGuard:', typeof authGuard !== 'undefined' ? 'CARGADO' : 'ERROR');
console.log('');

// Verificar usuarios disponibles
console.log('2. Usuarios disponibles para pruebas:');
try {
    const users = db.getUsers();
    users.forEach(user => {
        console.log(`   ${user.username} / ${user.password} (${user.role}) - ${user.name}`);
    });
} catch (error) {
    console.error('Error obteniendo usuarios:', error);
}
console.log('');

// Función de prueba de login
window.testLogin = function(username, password) {
    console.log(`Probando login: ${username}...`);
    const result = auth.login(username, password);
    
    if (result.success) {
        console.log('✓ Login exitoso:', result.user);
        console.log('  - Permisos disponibles para este usuario:');
        
        const permissions = [
            'view_sales', 'create_sale', 'view_orders', 'create_order',
            'view_tables', 'update_tables', 'view_products', 'print_receipts',
            'view_statistics', 'open_cash', 'close_cash', 'admin_access'
        ];
        
        permissions.forEach(permission => {
            const hasPermission = auth.hasPermission(permission);
            console.log(`    ${hasPermission ? '✓' : '✗'} ${permission}`);
        });
        
        console.log('');
        console.log('Para cerrar sesión: auth.logout()');
    } else {
        console.log('✗ Error en login:', result.message);
    }
    
    return result;
};

// Función para limpiar datos de prueba
window.clearTestData = function() {
    console.log('Limpiando datos de prueba...');
    localStorage.removeItem('pos_current_user');
    localStorage.removeItem('pos_current_cash_session');
    console.log('✓ Datos limpiados. Recarga la página para reiniciar.');
};

console.log('3. Funciones de prueba disponibles:');
console.log('   testLogin("admin", "admin123") - Probar login como administrador');
console.log('   testLogin("cajero", "cajero123") - Probar login como cajero');
console.log('   testLogin("mesero", "mesero123") - Probar login como mesero');
console.log('   clearTestData() - Limpiar datos de sesión');
console.log('');

console.log('4. Estado actual:');
console.log('   Logueado:', auth.isLoggedIn() ? 'SÍ' : 'NO');
if (auth.isLoggedIn()) {
    const user = auth.getCurrentUser();
    console.log('   Usuario actual:', user.name, `(${user.role})`);
    console.log('   Necesita abrir caja:', auth.needsCashOpening() ? 'SÍ' : 'NO');
}

console.log('');
console.log('=== ¡SISTEMA LISTO PARA PRUEBAS! ===');
