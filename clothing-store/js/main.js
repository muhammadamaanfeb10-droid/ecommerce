// Global Variables
let products = [];
let cart = [];
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let shippingCost = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadCartFromStorage();
    updateCartCount();
});

// Load Products from JSON
async function loadProducts() {
    try {
        const response = await fetch('js/products.json');
        const data = await response.json();
        products = data.products;
        
        // Load products based on current page
        if (document.getElementById('featured-products')) {
            loadFeaturedProducts();
        }
        if (document.getElementById('new-arrivals-products')) {
            loadNewArrivals();
        }
        if (document.getElementById('all-products')) {
            loadAllProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load Featured Products
function loadFeaturedProducts() {
    const featuredProducts = products.filter(p => p.type === 'featured');
    const container = document.getElementById('featured-products');
    container.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
}

// Load New Arrivals
function loadNewArrivals() {
    const newProducts = products.filter(p => p.type === 'new');
    const container = document.getElementById('new-arrivals-products');
    container.innerHTML = newProducts.map(product => createProductCard(product)).join('');
}

// Load All Products
function loadAllProducts() {
    const container = document.getElementById('all-products');
    document.getElementById('product-count').textContent = products.length;
    container.innerHTML = products.map(product => createProductCard(product)).join('');
}

// Create Product Card HTML
function createProductCard(product) {
    return `
        <div class="col-6 col-md-4 col-lg-3 fade-in">
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.type === 'new' ? '<span class="product-badge">NEW</span>' : ''}
                    <div class="product-actions">
                        <button onclick="quickView(${product.id})" title="Quick View">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button onclick="addToWishlist(${product.id})" title="Add to Wishlist">
                            <i class="bi bi-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h5 class="product-name">${product.name}</h5>
                    <div class="product-rating">
                        ${generateStars(product.rating)}
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        <button class="btn btn-primary btn-sm" onclick="addToCart(${product.id})">
                            <i class="bi bi-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate Star Rating HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="bi bi-star-fill"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="bi bi-star-half"></i>';
        } else {
            stars += '<i class="bi bi-star"></i>';
        }
    }
    return stars;
}

// Quick View Function
function quickView(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Load Product Detail
function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }
    
    currentProduct = products.find(p => p.id === productId);
    
    if (!currentProduct) {
        window.location.href = 'products.html';
        return;
    }
    
    // Save to recently viewed
    saveToRecentlyViewed(currentProduct);
    
    // Update page content
    document.getElementById('main-product-image').src = currentProduct.image;
    document.getElementById('product-name').textContent = currentProduct.name;
    document.getElementById('product-category').textContent = currentProduct.category.toUpperCase();
    document.getElementById('product-price').textContent = `$${currentProduct.price.toFixed(2)}`;
    document.getElementById('product-description').textContent = currentProduct.description;
    document.getElementById('product-rating').innerHTML = generateStars(currentProduct.rating);
    document.getElementById('review-count').textContent = `(${currentProduct.reviews.length} reviews)`;
    
    // Load thumbnails
    const thumbnailContainer = document.getElementById('thumbnail-container');
    thumbnailContainer.innerHTML = currentProduct.images.map((img, index) => `
        <img src="${img}" alt="${currentProduct.name}" class="${index === 0 ? 'active' : ''}" 
             onclick="changeMainImage('${img}', this)">
    `).join('');
    
    // Load sizes
    const sizeContainer = document.getElementById('size-options');
    sizeContainer.innerHTML = currentProduct.sizes.map((size, index) => `
        <div class="size-option ${index === 0 ? 'selected' : ''}" onclick="selectSize('${size}', this)">${size}</div>
    `).join('');
    selectedSize = currentProduct.sizes[0];
    
    // Load colors
    const colorContainer = document.getElementById('color-options');
    colorContainer.innerHTML = currentProduct.colors.map((color, index) => `
        <div class="color-option ${index === 0 ? 'selected' : ''}" onclick="selectColor('${color}', this)">${color}</div>
    `).join('');
    selectedColor = currentProduct.colors[0];
    
    // Load reviews
    const reviewsContainer = document.getElementById('reviews-container');
    reviewsContainer.innerHTML = currentProduct.reviews.map(review => `
        <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                         style="width: 40px; height: 40px;">
                        ${review.user.charAt(0)}
                    </div>
                    <div class="ms-3">
                        <h6 class="mb-0 fw-bold">${review.user}</h6>
                        <div class="text-warning">${generateStars(review.rating)}</div>
                    </div>
                </div>
                <p class="mb-0 text-muted">${review.comment}</p>
            </div>
        </div>
    `).join('');
    
    // Load related products
    loadRelatedProducts(currentProduct.category, currentProduct.id);
}

// Change Main Image
function changeMainImage(src, thumbnail) {
    document.getElementById('main-product-image').src = src;
    document.querySelectorAll('.thumbnail-images img').forEach(img => img.classList.remove('active'));
    thumbnail.classList.add('active');
}

// Select Size
function selectSize(size, element) {
    selectedSize = size;
    document.querySelectorAll('.size-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

// Select Color
function selectColor(color, element) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

// Update Quantity
function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newValue = parseInt(quantityInput.value) + change;
    if (newValue >= 1 && newValue <= 10) {
        quantityInput.value = newValue;
    }
}

// Load Related Products
function loadRelatedProducts(category, currentId) {
    const relatedProducts = products.filter(p => p.category === category && p.id !== currentId).slice(0, 4);
    const container = document.getElementById('related-products');
    container.innerHTML = relatedProducts.map(product => createProductCard(product)).join('');
}

// Add to Cart from Detail Page
function addToCartFromDetail() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value);
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity
    };
    
    addItemToCart(cartItem);
    showToast('Product added to cart!', 'success');
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: product.sizes[0],
        color: product.colors[0],
        quantity: 1
    };
    
    addItemToCart(cartItem);
    showToast('Product added to cart!', 'success');
}

// Add Item to Cart
function addItemToCart(item) {
    const existingItem = cart.find(i => i.id === item.id && i.size === item.size && i.color === item.color);
    
    if (existingItem) {
        existingItem.quantity += item.quantity;
    } else {
        cart.push(item);
    }
    
    saveCartToStorage();
    updateCartCount();
}

// Save Cart to Local Storage
function saveCartToStorage() {
    localStorage.setItem('stylehub_cart', JSON.stringify(cart));
}

// Load Cart from Local Storage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('stylehub_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Update Cart Count
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
}

// Load Cart Page
function loadCart() {
    const container = document.getElementById('cart-items-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cart.length === 0) {
        container.innerHTML = '';
        emptyMessage.style.display = 'block';
        checkoutBtn.disabled = true;
        document.getElementById('cart-item-count').textContent = '0';
    } else {
        emptyMessage.style.display = 'none';
        checkoutBtn.disabled = false;
        document.getElementById('cart-item-count').textContent = cart.length;
        
        container.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h6 class="fw-bold mb-1">${item.name}</h6>
                    <p class="text-muted small mb-1">Size: ${item.size} | Color: ${item.color}</p>
                    <p class="text-primary fw-bold mb-0">$${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity me-4">
                    <button onclick="updateCartItemQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-remove" onclick="removeFromCart(${index})">
                    <i class="bi bi-trash fs-5"></i>
                </div>
            </div>
        `).join('');
    }
    
    updateCartSummary();
}

// Update Cart Item Quantity
function updateCartItemQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    saveCartToStorage();
    updateCartCount();
    loadCart();
}

// Remove from Cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartCount();
    loadCart();
    showToast('Item removed from cart', 'success');
}

// Update Cart Summary
function updateCartSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax + shippingCost;
    
    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
    
    if (shippingCost > 0) {
        document.getElementById('cart-shipping').textContent = `$${shippingCost.toFixed(2)}`;
    } else {
        document.getElementById('cart-shipping').textContent = 'Free';
    }
}

// Apply Promo Code
function applyPromoCode() {
    const code = document.getElementById('promo-code').value.toUpperCase();
    const message = document.getElementById('promo-message');
    
    if (code === 'STYLE20') {
        message.textContent = '20% discount applied!';
        message.classList.remove('d-none', 'text-danger');
        message.classList.add('text-success');
        showToast('Promo code applied!', 'success');
    } else {
        message.textContent = 'Invalid promo code';
        message.classList.remove('d-none', 'text-success');
        message.classList.add('text-danger');
    }
}

// Proceed to Checkout
function proceedToCheckout() {
    sessionStorage.setItem('checkout_cart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// Load Checkout Summary
function loadCheckoutSummary() {
    const checkoutCart = JSON.parse(sessionStorage.getItem('checkout_cart')) || cart;
    
    const container = document.getElementById('checkout-items');
    container.innerHTML = checkoutCart.map(item => `
        <div class="d-flex align-items-center mb-3">
            <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div class="ms-3 flex-grow-1">
                <h6 class="mb-0 fw-bold">${item.name}</h6>
                <p class="text-muted small mb-0">${item.size} | ${item.color} x ${item.quantity}</p>
            </div>
            <span class="fw-bold">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const subtotal = checkoutCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax + shippingCost;
    
    document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkout-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
}

// Update Shipping Cost
function updateShippingCost(cost) {
    shippingCost = cost;
    loadCheckoutSummary();
    
    if (cost > 0) {
        document.getElementById('checkout-shipping').textContent = `$${cost.toFixed(2)}`;
    } else {
        document.getElementById('checkout-shipping').textContent = 'Free';
    }
}

// Process Checkout
function processCheckout() {
    const form = document.getElementById('checkout-form');
    
    // Basic validation
    const requiredFields = ['email', 'phone', 'first-name', 'last-name', 'address', 'city', 'state', 'zip', 'country'];
    let isValid = true;
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('is-invalid');
            isValid = false;
        } else {
            element.classList.remove('is-invalid');
        }
    });
    
    // Card validation if card payment selected
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    if (paymentMethod === 'card') {
        const cardFields = ['card-number', 'card-expiry', 'card-cvv', 'card-name'];
        cardFields.forEach(field => {
            const element = document.getElementById(field);
            if (!element.value.trim()) {
                element.classList.add('is-invalid');
                isValid = false;
            } else {
                element.classList.remove('is-invalid');
            }
        });
    }
    
    if (!isValid) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Save info if checked
    if (document.getElementById('save-info').checked) {
        saveCheckoutInfo();
    }
    
    // Generate order number
    const orderNumber = 'SH' + Date.now().toString().slice(-8);
    document.getElementById('order-number').textContent = orderNumber;
    
    // Clear cart
    cart = [];
    saveCartToStorage();
    updateCartCount();
    
    // Show success modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
}

// Save Checkout Info
function saveCheckoutInfo() {
    const info = {
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        address: document.getElementById('address').value,
        address2: document.getElementById('address-2').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zip: document.getElementById('zip').value,
        country: document.getElementById('country').value
    };
    localStorage.setItem('stylehub_checkout_info', JSON.stringify(info));
}

// Load Saved Info
function loadSavedInfo() {
    const savedInfo = localStorage.getItem('stylehub_checkout_info');
    if (savedInfo) {
        const info = JSON.parse(savedInfo);
        document.getElementById('email').value = info.email || '';
        document.getElementById('phone').value = info.phone || '';
        document.getElementById('first-name').value = info.firstName || '';
        document.getElementById('last-name').value = info.lastName || '';
        document.getElementById('address').value = info.address || '';
        document.getElementById('address-2').value = info.address2 || '';
        document.getElementById('city').value = info.city || '';
        document.getElementById('state').value = info.state || '';
        document.getElementById('zip').value = info.zip || '';
        document.getElementById('country').value = info.country || '';
    }
}

// Save to Recently Viewed
function saveToRecentlyViewed(product) {
    let recentlyViewed = JSON.parse(sessionStorage.getItem('recently_viewed')) || [];
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(p => p.id !== product.id);
    
    // Add to beginning
    recentlyViewed.unshift(product);
    
    // Keep only last 4
    recentlyViewed = recentlyViewed.slice(0, 4);
    
    sessionStorage.setItem('recently_viewed', JSON.stringify(recentlyViewed));
}

// Load Recently Viewed
function loadRecentlyViewed() {
    const recentlyViewed = JSON.parse(sessionStorage.getItem('recently_viewed')) || [];
    const container = document.getElementById('recently-viewed');
    
    if (container) {
        if (recentlyViewed.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No recently viewed products</p>';
        } else {
            container.innerHTML = recentlyViewed.map(product => createProductCard(product)).join('');
        }
    }
}

// Apply Filters
function applyFilters() {
    const categories = Array.from(document.querySelectorAll('.filter-category:checked')).map(cb => cb.value);
    const minPrice = parseFloat(document.getElementById('price-min').value) || 0;
    const maxPrice = parseFloat(document.getElementById('price-max').value) || Infinity;
    const sortBy = document.getElementById('sort-products').value;
    
    let filteredProducts = products.filter(product => {
        const categoryMatch = categories.includes('all') || categories.includes(product.category);
        const priceMatch = product.price >= minPrice && product.price <= maxPrice;
        return categoryMatch && priceMatch;
    });
    
    // Sort products
    switch (sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    document.getElementById('product-count').textContent = filteredProducts.length;
    document.getElementById('all-products').innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

// Reset Filters
function resetFilters() {
    document.querySelectorAll('.filter-category').forEach(cb => cb.checked = cb.value === 'all');
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('sort-products').value = 'default';
    loadAllProducts();
}

// Change View (Grid/List)
function changeView(view) {
    const container = document.getElementById('all-products');
    if (view === 'list') {
        container.classList.remove('row-cols-md-4', 'row-cols-2');
        container.classList.add('row-cols-1');
    } else {
        container.classList.remove('row-cols-1');
        container.classList.add('row-cols-2', 'row-cols-md-4');
    }
}

// Add to Wishlist
function addToWishlist(productId) {
    showToast('Added to wishlist!', 'success');
}

// Toggle Wishlist
function toggleWishlist() {
    const btn = document.querySelector('.wishlist-btn');
    btn.classList.toggle('active');
    showToast(btn.classList.contains('active') ? 'Added to wishlist!' : 'Removed from wishlist!', 'success');
}

// Show Toast Notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast-container');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast-container';
    toast.innerHTML = `
        <div class="toast ${type}">
            <i class="bi bi-${type === 'success' ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'} fs-4"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Format Card Number Input
document.addEventListener('input', function(e) {
    if (e.target.id === 'card-number') {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    }
    
    if (e.target.id === 'card-expiry') {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    }
    
    if (e.target.id === 'card-cvv') {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }
    
    if (e.target.id === 'phone') {
        e.target.value = e.target.value.replace(/[^0-9+\-()\s]/g, '');
    }
});
