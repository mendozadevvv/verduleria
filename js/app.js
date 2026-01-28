document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById("product-list");
    const adminProductList = document.getElementById("admin-product-list");
    const form = document.getElementById("product-form");
    
    // Enhanced product catalog with styled placeholder images and unique IDs
    let nextId = 7;
    const PRODUCTS = [
        { id: 1, name: "Manzanas", price: 2.50, image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%234CAF50' width='400' height='300'/%3E%3Ccircle cx='200' cy='150' r='80' fill='%23FF5252'/%3E%3Ccircle cx='185' cy='120' r='15' fill='%23FFF59D'/%3E%3Cellipse cx='200' cy='90' rx='8' ry='20' fill='%238D6E63'/%3E%3Cpath d='M195 90 Q190 70 210 75' stroke='%234CAF50' stroke-width='3' fill='none'/%3E%3Ctext x='200' y='250' font-size='24' text-anchor='middle' fill='white' font-family='Arial'%3EManzanas%3C/text%3E%3C/svg%3E" },
        { id: 2, name: "Bananas", price: 1.80, image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%234CAF50' width='400' height='300'/%3E%3Cpath d='M150 100 Q160 80 180 90 Q200 100 210 120 Q215 140 210 160 Q200 180 180 185 Q160 180 150 160 Q145 140 150 120 Z' fill='%23FFEB3B'/%3E%3Cpath d='M190 100 Q200 85 215 95 Q230 105 235 125 Q238 145 230 165 Q220 180 200 182 Q185 178 180 160' fill='%23FDD835'/%3E%3Ctext x='200' y='250' font-size='24' text-anchor='middle' fill='white' font-family='Arial'%3EBananas%3C/text%3E%3C/svg%3E" },
        { id: 3, name: "Tomates", price: 1.90, image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%234CAF50' width='400' height='300'/%3E%3Ccircle cx='200' cy='150' r='70' fill='%23F44336'/%3E%3Ccircle cx='185' cy='135' r='12' fill='%23FF7961'/%3E%3Cpath d='M190 100 L195 90 L200 100 L205 90 L210 100' stroke='%234CAF50' stroke-width='4' fill='none'/%3E%3Ctext x='200' y='250' font-size='24' text-anchor='middle' fill='white' font-family='Arial'%3ETomates%3C/text%3E%3C/svg%3E" },
        { id: 4, name: "Zanahorias", price: 1.50, image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%234CAF50' width='400' height='300'/%3E%3Cpath d='M200 100 L220 180 L200 190 L180 180 Z' fill='%23FF6F00'/%3E%3Cpath d='M195 95 L198 85 L195 80' stroke='%234CAF50' stroke-width='3' fill='none'/%3E%3Cpath d='M200 95 L203 83 L200 75' stroke='%234CAF50' stroke-width='3' fill='none'/%3E%3Cpath d='M205 95 L208 85 L205 78' stroke='%234CAF50' stroke-width='3' fill='none'/%3E%3Ctext x='200' y='250' font-size='24' text-anchor='middle' fill='white' font-family='Arial'%3EZanahorias%3C/text%3E%3C/svg%3E" },
        { id: 5, name: "Lechuga", price: 1.20, image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%234CAF50' width='400' height='300'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%238BC34A'/%3E%3Ccircle cx='180' cy='130' r='40' fill='%239CCC65'/%3E%3Ccircle cx='220' cy='130' r='40' fill='%239CCC65'/%3E%3Ccircle cx='200' cy='110' r='35' fill='%23AED581'/%3E%3Ctext x='200' y='250' font-size='24' text-anchor='middle' fill='white' font-family='Arial'%3ELechuga%3C/text%3E%3C/svg%3E" },
        { id: 6, name: "Naranjas", price: 2.80, image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%234CAF50' width='400' height='300'/%3E%3Ccircle cx='200' cy='150' r='70' fill='%23FF9800'/%3E%3Ccircle cx='185' cy='135' r='8' fill='%23FFB74D'/%3E%3Cellipse cx='200' cy='100' rx='10' ry='15' fill='%234CAF50'/%3E%3Ctext x='200' y='250' font-size='24' text-anchor='middle' fill='white' font-family='Arial'%3ENaranjas%3C/text%3E%3C/svg%3E" },
    ];

    // Render products with improved UI
    const renderProducts = (target, isAdmin = false) => {
        target.innerHTML = "";
        PRODUCTS.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'card';
            
            // Create elements safely to prevent XSS
            const img = document.createElement('img');
            img.src = product.image;
            img.alt = product.name;
            img.onerror = function() { this.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%234CAF50' width='400' height='300'/%3E%3Ctext x='200' y='150' font-size='24' text-anchor='middle' fill='white' font-family='Arial'%3E${encodeURIComponent(product.name)}%3C/text%3E%3C/svg%3E`; };
            
            const h3 = document.createElement('h3');
            h3.textContent = product.name;
            
            const p = document.createElement('p');
            p.textContent = `$${product.price.toFixed(2)} / kg`;
            
            productCard.appendChild(img);
            productCard.appendChild(h3);
            productCard.appendChild(p);
            
            if (isAdmin) {
                const button = document.createElement('button');
                button.className = 'btn remove-btn';
                button.textContent = 'Eliminar';
                button.dataset.id = product.id;
                productCard.appendChild(button);
            }
            
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
            if (!name || !price || isNaN(price) || price <= 0 || !image) {
                showNotification("Por favor, completa todos los campos correctamente.", true);
                return;
            }

            PRODUCTS.push({ id: nextId++, name, price, image });
            
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
                const productId = parseInt(e.target.dataset.id);
                const product = PRODUCTS.find(p => p.id === productId);
                
                if (product && confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
                    const index = PRODUCTS.indexOf(product);
                    PRODUCTS.splice(index, 1);
                    renderProducts(adminProductList, true);
                    if (productList) renderProducts(productList, false);
                    showNotification("Producto eliminado exitosamente.", false);
                }
            }
        });
    }

    // Show notification helper function
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = isError ? 'notification error' : 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('slide-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initial render
    if (productList) renderProducts(productList, false);
    if (adminProductList) renderProducts(adminProductList, true);
});
