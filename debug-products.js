// Script de depuración para productos y categorías
console.log('=== DEPURACIÓN DEL SISTEMA DE PRODUCTOS ===');

// Verificar base de datos
console.log('1. Verificando base de datos...');
if (typeof db !== 'undefined') {
    console.log('✓ Base de datos cargada');
    
    // Verificar productos
    const products = db.getProducts();
    console.log(`✓ Productos en base de datos: ${products.length}`);
    
    if (products.length > 0) {
        console.log('Primeros 3 productos:');
        products.slice(0, 3).forEach(product => {
            console.log(`  - ${product.name} ($${product.price}) [${product.category}]`);
        });
    } else {
        console.log('⚠️ No hay productos en la base de datos');
        console.log('Creando productos de ejemplo...');
        
        // Crear productos de ejemplo
        const exampleProducts = [
            { name: 'Americano', price: 4500, cost: 1500, category: 'bebidas-calientes', active: true },
            { name: 'Cappuccino', price: 5500, cost: 2000, category: 'bebidas-calientes', active: true },
            { name: 'Latte', price: 6000, cost: 2200, category: 'bebidas-calientes', active: true },
            { name: 'Frappé Vainilla', price: 7500, cost: 3000, category: 'bebidas-frias', active: true },
            { name: 'Crêpe Nutella', price: 8500, cost: 3500, category: 'crepes-dulces', active: true },
            { name: 'Crêpe Jamón y Queso', price: 9000, cost: 4000, category: 'crepes-salados', active: true }
        ];
        
        exampleProducts.forEach(product => {
            db.addProduct(product);
        });
        
        console.log('✓ Productos de ejemplo creados');
    }
    
    // Verificar categorías
    const categories = db.getCategories();
    console.log(`✓ Categorías disponibles: ${categories.join(', ')}`);
    
} else {
    console.log('❌ Base de datos no disponible');
}

// Verificar sistema de ventas
console.log('\n2. Verificando sistema de ventas...');
if (typeof salesManager !== 'undefined') {
    console.log('✓ SalesManager cargado');
    
    // Recargar productos
    salesManager.loadProducts();
    console.log('✓ Productos recargados en ventas');
    
} else {
    console.log('⚠️ SalesManager no disponible (normal si no estás en ventas.html)');
}

// Verificar sistema de configuración
console.log('\n3. Verificando sistema de configuración...');
if (typeof configuracionManager !== 'undefined' || window.configuracionManager) {
    console.log('✓ ConfiguracionManager cargado');
    
    if (window.configuracionManager) {
        window.configuracionManager.loadProducts();
        window.configuracionManager.loadCategories();
        console.log('✓ Productos y categorías recargados en configuración');
    }
    
} else {
    console.log('⚠️ ConfiguracionManager no disponible (normal si no estás en configuracion.html)');
}

// Funciones de utilidad
window.debugProducts = {
    // Mostrar todos los productos
    showAll: () => {
        const products = db.getProducts();
        console.table(products);
    },
    
    // Crear producto de prueba
    createTest: () => {
        const testProduct = {
            name: 'Producto de Prueba',
            price: 5000,
            cost: 2000,
            category: 'test',
            description: 'Producto creado para testing',
            active: true
        };
        const result = db.addProduct(testProduct);
        console.log('Producto de prueba creado:', result);
        
        // Recargar en ventas si está disponible
        if (typeof salesManager !== 'undefined') {
            salesManager.loadProducts();
        }
        
        return result;
    },
    
    // Limpiar productos de prueba
    cleanTest: () => {
        const products = db.getProducts();
        const testProducts = products.filter(p => p.category === 'test');
        
        testProducts.forEach(product => {
            db.deleteProduct(product.id);
        });
        
        console.log(`${testProducts.length} productos de prueba eliminados`);
        
        // Recargar en ventas si está disponible
        if (typeof salesManager !== 'undefined') {
            salesManager.loadProducts();
        }
    },
    
    // Recargar todo
    reload: () => {
        if (typeof salesManager !== 'undefined') {
            salesManager.loadProducts();
            console.log('✓ Productos recargados en ventas');
        }
        
        if (window.configuracionManager) {
            window.configuracionManager.loadProducts();
            window.configuracionManager.loadCategories();
            console.log('✓ Productos recargados en configuración');
        }
    }
};

console.log('\n=== FUNCIONES DE DEPURACIÓN DISPONIBLES ===');
console.log('debugProducts.showAll() - Mostrar todos los productos');
console.log('debugProducts.createTest() - Crear producto de prueba');
console.log('debugProducts.cleanTest() - Limpiar productos de prueba');
console.log('debugProducts.reload() - Recargar productos en todas las vistas');

console.log('\n✅ Script de depuración completado');
