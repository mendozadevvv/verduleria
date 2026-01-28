document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById("product-list");
    const adminProductList = document.getElementById("admin-product-list");
    const form = document.getElementById("product-form");

    let PRODUCTS = [
        { id: 1, name: "Manzanas", price: 2.50, image: "https://via.placeholder.com/150" },
        { id: 2, name: "Bananas", price: 1.80, image: "https://via.placeholder.com/150" },
    ];

    function renderProducts(target, adminView = false) {
        target.innerHTML = '';
        PRODUCTS.forEach((prod) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${prod.image}" alt="${prod.name}">
                <h3>${prod.name}</h3>
                <p class='price'>$${prod.price} / kg</p>
                ${
                    adminView 
                    ? `<button class="delete-btn" data-id="${prod.id}">Eliminar</button>` : ''
                }`;
            target.appendChild(card);
        });
    }

    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        let id = PRODUCTS.length + 1;
        let name = document.getElementById("product-name").value,
            price = parseFloat(document.getElementById("product-price").value),
            image = document.getElementById("product-img-url").value;
        PRODUCTS.push({ id, name, price, image });
        renderProducts(adminProductList, true); // Update admin view
    });
    
    renderProducts(productList);
});
