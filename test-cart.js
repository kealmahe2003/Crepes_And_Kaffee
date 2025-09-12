// Script de prueba para carrito
console.log('🧪 Test Script Cargado');

// Test de función addToCart
function testCart() {
    console.log('🔍 Verificando salesManager...', typeof window.salesManager);
    
    if (!window.salesManager) {
        console.error('❌ SalesManager no está disponible');
        return;
    }

    console.log('✅ SalesManager disponible');
    console.log('📦 Carrito actual:', window.salesManager.cart.length);
    
    // Obtener productos
    const products = window.salesManager.db.getProducts();
    console.log('🛍️ Productos disponibles:', products.length);
    
    if (products.length > 0) {
        const testProduct = products[0];
        console.log('🎯 Probando con producto:', testProduct.nombre || testProduct.name);
        
        const cartBefore = window.salesManager.cart.length;
        console.log('📊 Carrito antes:', cartBefore);
        
        // Probar addToCart
        try {
            window.salesManager.addToCart(testProduct.id);
            console.log('✅ addToCart ejecutado sin errores');
            
            const cartAfter = window.salesManager.cart.length;
            console.log('📊 Carrito después:', cartAfter);
            
            if (cartAfter > cartBefore) {
                console.log('🎉 ¡ÉXITO! Producto agregado al carrito');
            } else {
                console.log('⚠️ El carrito no cambió (posible duplicado)');
            }
            
            // Mostrar contenido del carrito
            console.log('🛒 Contenido del carrito:', window.salesManager.cart);
            
        } catch (error) {
            console.error('❌ Error en addToCart:', error);
        }
    }
}

// Ejecutar después de un segundo
setTimeout(testCart, 1000);

// Función para test manual
window.testAddToCart = function(productId) {
    if (productId) {
        window.salesManager.addToCart(productId);
    } else {
        testCart();
    }
};

console.log('💡 Usa window.testAddToCart() para probar el carrito');