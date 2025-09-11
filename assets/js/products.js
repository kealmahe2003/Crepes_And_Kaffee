// Base de datos de productos para Crêpes & Kaffee
const PRODUCTS = {
    bebidas: [
        // Bebidas Calientes con Café
        {
            id: 'americano',
            name: 'Americano',
            price: 4500,
            category: 'bebidas',
            subcategory: 'caliente-cafe',
            description: 'Café americano clásico',
            icon: 'fas fa-coffee'
        },
        {
            id: 'cappuccino',
            name: 'Cappuccino',
            price: 5500,
            category: 'bebidas',
            subcategory: 'caliente-cafe',
            description: 'Espresso con leche vaporizada y espuma',
            icon: 'fas fa-coffee'
        },
        {
            id: 'latte',
            name: 'Latte',
            price: 6000,
            category: 'bebidas',
            subcategory: 'caliente-cafe',
            description: 'Espresso con leche vaporizada y un poco de espuma',
            icon: 'fas fa-coffee'
        },
        {
            id: 'mocha',
            name: 'Mocha',
            price: 6500,
            category: 'bebidas',
            subcategory: 'caliente-cafe',
            description: 'Latte con chocolate y crema batida',
            icon: 'fas fa-coffee'
        },
        {
            id: 'caramel-macchiato',
            name: 'Caramel Macchiato',
            price: 7000,
            category: 'bebidas',
            subcategory: 'caliente-cafe',
            description: 'Latte con caramelo y espuma',
            icon: 'fas fa-coffee'
        },
        
        // Bebidas Frías con Café
        {
            id: 'frappe-vainilla',
            name: 'Frappé Vainilla',
            price: 7500,
            category: 'bebidas',
            subcategory: 'fria-cafe',
            description: 'Café helado con helado de vainilla',
            icon: 'fas fa-snowflake'
        },
        {
            id: 'frappe-chocolate',
            name: 'Frappé Chocolate',
            price: 8000,
            category: 'bebidas',
            subcategory: 'fria-cafe',
            description: 'Café helado con chocolate y crema',
            icon: 'fas fa-snowflake'
        },
        {
            id: 'cold-brew',
            name: 'Cold Brew',
            price: 5500,
            category: 'bebidas',
            subcategory: 'fria-cafe',
            description: 'Café extraído en frío, suave y refrescante',
            icon: 'fas fa-snowflake'
        },
        {
            id: 'iced-latte',
            name: 'Iced Latte',
            price: 6500,
            category: 'bebidas',
            subcategory: 'fria-cafe',
            description: 'Latte servido con hielo',
            icon: 'fas fa-snowflake'
        },
        
        // Bebidas Sin Café
        {
            id: 'chocolate-caliente',
            name: 'Chocolate Caliente',
            price: 5000,
            category: 'bebidas',
            subcategory: 'sin-cafe',
            description: 'Chocolate caliente con crema batida',
            icon: 'fas fa-mug-hot'
        },
        {
            id: 'te-chai',
            name: 'Té Chai Latte',
            price: 5500,
            category: 'bebidas',
            subcategory: 'sin-cafe',
            description: 'Té especiado con leche vaporizada',
            icon: 'fas fa-leaf'
        },
        {
            id: 'te-verde',
            name: 'Té Verde',
            price: 3500,
            category: 'bebidas',
            subcategory: 'sin-cafe',
            description: 'Té verde natural',
            icon: 'fas fa-leaf'
        },
        {
            id: 'limonada',
            name: 'Limonada Natural',
            price: 4000,
            category: 'bebidas',
            subcategory: 'sin-cafe',
            description: 'Limonada fresca con hielo',
            icon: 'fas fa-lemon'
        },
        {
            id: 'jugo-naranja',
            name: 'Jugo de Naranja',
            price: 4500,
            category: 'bebidas',
            subcategory: 'sin-cafe',
            description: 'Jugo de naranja natural',
            icon: 'fas fa-glass-whiskey'
        },
        {
            id: 'agua',
            name: 'Agua',
            price: 2000,
            category: 'bebidas',
            subcategory: 'sin-cafe',
            description: 'Agua natural',
            icon: 'fas fa-tint'
        }
    ],
    
    'crepes-dulces': [
        {
            id: 'crepe-nutella',
            name: 'Crêpe Nutella',
            price: 8500,
            category: 'crepes-dulces',
            description: 'Crêpe con Nutella y azúcar en polvo',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-fresa',
            name: 'Crêpe de Fresa',
            price: 9000,
            category: 'crepes-dulces',
            description: 'Crêpe con fresas frescas y crema',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-banana',
            name: 'Crêpe de Banana',
            price: 8500,
            category: 'crepes-dulces',
            description: 'Crêpe con banana y canela',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-manzana',
            name: 'Crêpe de Manzana',
            price: 9000,
            category: 'crepes-dulces',
            description: 'Crêpe con manzana caramelizada',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-nutella-fresa',
            name: 'Crêpe Nutella & Fresa',
            price: 10500,
            category: 'crepes-dulces',
            description: 'Crêpe con Nutella y fresas frescas',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-nutella-banana',
            name: 'Crêpe Nutella & Banana',
            price: 10000,
            category: 'crepes-dulces',
            description: 'Crêpe con Nutella y banana',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-mermelada',
            name: 'Crêpe de Mermelada',
            price: 7500,
            category: 'crepes-dulces',
            description: 'Crêpe con mermelada de tu elección',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-dulce-leche',
            name: 'Crêpe Dulce de Leche',
            price: 8500,
            category: 'crepes-dulces',
            description: 'Crêpe con dulce de leche',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-tres-leches',
            name: 'Crêpe Tres Leches',
            price: 11000,
            category: 'crepes-dulces',
            description: 'Crêpe estilo tres leches con crema',
            icon: 'fas fa-cookie-bite'
        },
        {
            id: 'crepe-mixto-frutas',
            name: 'Crêpe Mixto de Frutas',
            price: 11500,
            category: 'crepes-dulces',
            description: 'Crêpe con mix de frutas frescas',
            icon: 'fas fa-cookie-bite'
        }
    ],
    
    'crepes-salados': [
        {
            id: 'crepe-jamon-queso',
            name: 'Crêpe Jamón y Queso',
            price: 10000,
            category: 'crepes-salados',
            description: 'Crêpe con jamón y queso derretido',
            icon: 'fas fa-cheese'
        },
        {
            id: 'crepe-solo-queso',
            name: 'Crêpe Solo Queso',
            price: 8500,
            category: 'crepes-salados',
            description: 'Crêpe con queso derretido',
            icon: 'fas fa-cheese'
        },
        {
            id: 'crepe-pollo-queso',
            name: 'Crêpe Pollo y Queso',
            price: 11000,
            category: 'crepes-salados',
            description: 'Crêpe con pollo desmechado y queso',
            icon: 'fas fa-drumstick-bite'
        },
        {
            id: 'crepe-champiñones',
            name: 'Crêpe de Champiñones',
            price: 9500,
            category: 'crepes-salados',
            description: 'Crêpe con champiñones salteados',
            icon: 'fas fa-seedling'
        },
        {
            id: 'crepe-espinaca-queso',
            name: 'Crêpe Espinaca y Queso',
            price: 9500,
            category: 'crepes-salados',
            description: 'Crêpe con espinaca y queso',
            icon: 'fas fa-leaf'
        },
        {
            id: 'crepe-atun',
            name: 'Crêpe de Atún',
            price: 10500,
            category: 'crepes-salados',
            description: 'Crêpe con atún y vegetales',
            icon: 'fas fa-fish'
        }
    ]
};

// Función para obtener productos por categoría
function getProductsByCategory(category) {
    return PRODUCTS[category] || [];
}

// Función para obtener un producto por ID
function getProductById(id) {
    for (const category in PRODUCTS) {
        const product = PRODUCTS[category].find(p => p.id === id);
        if (product) return product;
    }
    return null;
}

// Función para buscar productos
function searchProducts(query) {
    const results = [];
    for (const category in PRODUCTS) {
        const categoryProducts = PRODUCTS[category].filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...categoryProducts);
    }
    return results;
}

// Función para formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}
