document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById("product-list");
    const adminProductList = document.getElementById("admin-product-list");
    const form = document.getElementById("product-form");
    
    const PRODUCTS = [
        { name: "Manzanas", price: 2.50, image: "https://via.placeholder.com/150" },
        { name: "Bananas", price: 1.80, image: "https://via.placeholder.com/150" },
        { name: "Tomates", price: 1.90, image: "https://via.placeholder.com/150" },
    ];

    const renderProducts = (target) => {
        target.innerHTML = "";
        PRODUCTS.forEach((product, index) => {
            const productCard = `<div class="card">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>$${product.price.toFixed(2)} / kg</p>
                <button class="btn remove-btn" data-index="${index}">Eliminar</button>
            </div>`;
            target.innerHTML += productCard;
        });
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("product-name").value;
        const price = parseFloat(document.getElementById("product-price").value);
        const image = document.getElementById("product-img-url").value;

        PRODUCTS.push({ name, price, image });
        renderProducts(adminProductList);
        renderProducts(productList);

        form.reset();
    });

    adminProductList.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-btn")) {
            const index = e.target.getAttribute("data-index");
            PRODUCTS.splice(index, 1);
            renderProducts(adminProductList);
            renderProducts(productList);
        }
    });

    renderProducts(productList);
    renderProducts(adminProductList);
});
