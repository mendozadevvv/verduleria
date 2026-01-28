document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById("product-list");
    const adminProductList = document.getElementById("admin-product-list");
    const form = document.getElementById("product-form");
    
    // Enhanced product catalog with better placeholder images
    const PRODUCTS = [
        { name: "Manzanas", price: 2.50, image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop" },
        { name: "Bananas", price: 1.80, image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=300&fit=crop" },
        { name: "Tomates", price: 1.90, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop" },
        { name: "Zanahorias", price: 1.50, image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop" },
        { name: "Lechuga", price: 1.20, image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop" },
        { name: "Naranjas", price: 2.80, image: "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400&h=300&fit=crop" },
    ];

    // Render products with improved UI
    const renderProducts = (target, isAdmin = false) => {
        target.innerHTML = "";
        PRODUCTS.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x300/4CAF50/ffffff?text=${product.name}'">
                <h3>${product.name}</h3>
                <p>$${product.price.toFixed(2)} / kg</p>
                ${isAdmin ? `<button class="btn remove-btn" data-index="${index}">Eliminar</button>` : ''}
            `;
            target.appendChild(productCard);
        });
    };

    // Handle form submission with validation
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("product-name").value.trim();
            const price = parseFloat(document.getElementById("product-price").value);
            const image = document.getElementById("product-img-url").value.trim();

            // Validation
            if (!name || price <= 0 || !image) {
                alert("Por favor, completa todos los campos correctamente.");
                return;
            }

            PRODUCTS.push({ name, price, image });
            
            // Re-render both admin and public views
            if (adminProductList) renderProducts(adminProductList, true);
            if (productList) renderProducts(productList, false);

            form.reset();
            
            // Show success feedback
            showNotification("¡Producto agregado exitosamente!");
        });
    }

    // Handle product deletion in admin panel
    if (adminProductList) {
        adminProductList.addEventListener("click", (e) => {
            if (e.target.classList.contains("remove-btn")) {
                const index = parseInt(e.target.getAttribute("data-index"));
                const productName = PRODUCTS[index].name;
                
                if (confirm(`¿Estás seguro de que quieres eliminar "${productName}"?`)) {
                    PRODUCTS.splice(index, 1);
                    renderProducts(adminProductList, true);
                    if (productList) renderProducts(productList, false);
                    showNotification("Producto eliminado exitosamente.");
                }
            }
        });
    }

    // Show notification helper function
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #66BB6A);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add CSS animations for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initial render
    if (productList) renderProducts(productList, false);
    if (adminProductList) renderProducts(adminProductList, true);
});
