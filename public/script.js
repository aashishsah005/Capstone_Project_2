let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null; // Track login status

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    // Initial Routing - moved to after fetch
    // handleRoute(); 
    window.addEventListener('hashchange', handleRoute);

    // Auth listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);

    // Init cart
    updateCartCount();

    // Init Auth UI
    if (currentUser) {
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-profile').style.display = 'flex';
        document.getElementById('user-name').innerText = currentUser.username;
        document.getElementById('user-initial').innerText = currentUser.username.charAt(0).toUpperCase();
    }
});

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        // Handle new JSON structure { "products": [...] }
        allProducts = data.products.map(p => {
            // For simplicity, take the first variant and merge with top-level info
            const variant = p.variants[0];
            return {
                id: p.product_id,
                name: p.product_name,
                brand: p.brand,
                image: p.base_image_url,
                description: p.description,
                specifications: Object.entries(variant.specifications).map(([k, v]) => `${k}: ${v}`),
                sellers: variant.offers.map(o => ({
                    name: o.seller_name,
                    price: o.price,
                    rating: o.rating,
                    reviewCount: o.rating_count,
                    delivery: `${o.delivery_in_days} days`,
                    trusted: o.is_trusted_seller
                })),
                category: determineCategory(p.product_name, p.description)
            };
        });

        renderProducts(allProducts, 'product-results');
        renderProducts(allProducts, 'category-products');

        // Handle initial route now that products are loaded
        handleRoute();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

function determineCategory(name, desc) {
    const text = (name + " " + desc).toLowerCase();
    if (text.includes('phone') || text.includes('galaxy') || text.includes('iphone') || text.includes('pixel')) return 'mobiles';
    if (text.includes('laptop') || text.includes('macbook') || text.includes('dell') || text.includes('keyboard')) return 'laptops';
    if (text.includes('watch') || text.includes('fitbit')) return 'watches';
    if (text.includes('camera') || text.includes('canon') || text.includes('gopro')) return 'cameras';
    if (text.includes('audio') || text.includes('sony') || text.includes('headphone') || text.includes('speaker')) return 'audio';
    return 'electronics'; // fallback
}

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color: #64748b;">No products found.</p>';
        return;
    }

    products.forEach(product => {
        const bestPrice = Math.min(...product.sellers.map(s => s.price));

        const card = document.createElement('div');
        card.className = 'product-card';
        // Use hash routing instead of direct function call
        card.onclick = () => location.hash = '#product=' + product.id;
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">Best Price: ₹${bestPrice.toLocaleString()}</p>
                <div class="seller-list">
                    ${product.sellers.slice(0, 2).map(s => `
                        <div class="seller-item">
                            <span>${s.name}</span>
                            <span>₹${s.price.toLocaleString()}</span>
                        </div>
                    `).join('')}
                    ${product.sellers.length > 2 ? `<small style="color:var(--text-dim)">+${product.sellers.length - 2} more offers</small>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function viewProduct(id) {
    // Loose equality to handle string/number mismatch
    const product = allProducts.find(p => p.id == id);
    if (!product) return;

    document.getElementById('detail-image').src = product.image;
    document.getElementById('detail-name').innerText = product.name;
    document.getElementById('detail-desc').innerText = product.description;

    const specsList = document.getElementById('detail-specs');
    specsList.innerHTML = product.specifications.map(s => `<li>${s}</li>`).join('');

    const sellerList = document.getElementById('seller-list-horizontal');
    sellerList.innerHTML = product.sellers.map(s => `
        <div class="seller-card-detail" style="border-color: #8b5cf6">
            <h4>${s.name}</h4>
            <div class="seller-price">₹${s.price.toLocaleString()}</div>
            <div class="seller-meta">⭐ ${s.rating} (${s.reviewCount})</div>
            <div class="seller-meta">🚚 In ${s.delivery}</div>
            ${s.trusted
            ? '<div class="seller-meta" style="color:green; font-weight:600;">✔ Trusted</div>'
            : '<div class="seller-meta" style="color:#94a3b8">⚠️ Third Party</div>'}
            <button class="add-to-cart-btn" onclick="addToCart('${product.id}', '${s.name.replace(/'/g, "\\'")}', ${s.price})">Add to Cart</button>
        </div>
    `).join('');

    // Manually showing product view, overriding routing for now while keeping hash stable or we can set it
    // For now, let's just show the section.
    // If we want "Back" to work properly, we rely on the fact that Back button in standard UI goes to #home or #categories
    showSection('product-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addToCart(productId, sellerName, price) {
    if (!currentUser) {
        alert("Please login to add items to cart!");
        showLogin();
        return;
    }

    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    cart.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        seller: sellerName,
        price: price
    });

    saveCart();
    updateCartCount();
    alert('Added to cart!');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart(); // Re-render cart page
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    document.getElementById('cart-count').innerText = cart.length;
}

function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';

    let subtotal = 0;

    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-dim)">Your cart is empty. <br> <a href="#categories">Start Shopping</a></div>';
    } else {
        cart.forEach((item, index) => {
            subtotal += item.price;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>Seller: ${item.seller}</p>
                    <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            `;
            container.appendChild(div);
        });
    }

    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    document.getElementById('cart-subtotal').innerText = '₹' + subtotal.toLocaleString();
    document.getElementById('cart-tax').innerText = '₹' + tax.toLocaleString();
    document.getElementById('cart-total').innerText = '₹' + total.toLocaleString();
}

function handleRoute() {
    const hash = window.location.hash;

    // Close modals by default
    closeModal('login-modal');
    closeModal('signup-modal');

    if (hash === '#categories') {
        showSection('categories');
    } else if (hash === '#login') {
        showSection('home'); // Show home behind modal
        showLogin();
    } else if (hash === '#signup') {
        showSection('home'); // Show home behind modal
        showSignup();
    } else if (hash === '#cart') {
        showSection('cart');
        renderCart();
    } else if (hash.startsWith('#product=')) {
        const id = hash.split('=')[1];
        // Use loose equality to match string id from hash with potential int id in data
        viewProduct(id);
    } else {
        // Default to home for #home, #, or empty
        showSection('home');
    }
}

function showSection(sectionId) {
    ['home', 'categories', 'product-view', 'cart'].forEach(id => {
        document.getElementById(id).classList.add('hidden-section');
        document.getElementById(id).classList.remove('active-section');
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
    }
}

function handleSearch(query) {
    const term = query.toLowerCase();
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
    );
    renderProducts(filtered, 'product-results');
    renderProducts(filtered, 'category-products');
}

function filterByCategory(category) {
    // If this is called, we want to ensure we are in categories view
    // The HTML onclicks set location.hash = '#categories' BEFORE calling this, 
    // or we can rely on this function to just filter.
    // Given the HTML change, hash is set.

    // We just need to filter the products now.
    if (category === 'all') {
        renderProducts(allProducts, 'category-products');
    } else {
        const filtered = allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
        renderProducts(filtered, 'category-products');
    }
}

// Modal & Auth Logic with Error Messages
function showLogin() {
    document.getElementById('login-modal').style.display = 'flex';
    const msgBox = document.getElementById('login-msg');
    if (msgBox) msgBox.innerHTML = '';
}
function showSignup() {
    document.getElementById('signup-modal').style.display = 'flex';
    const msgBox = document.getElementById('signup-msg');
    if (msgBox) msgBox.innerHTML = '';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
function switchModal(closeId, openId) {
    // This function is less needed with hash routing but kept for "switch" logic if used
    // But since we use hrefs now, we might not need this.
    // It was used in HTML: onclick="switchModal..." -> changed to hrefs.
    // So this might be dead code, but keeping it safe won't hurt.
    closeModal(closeId);
    if (openId === 'login-modal') location.hash = '#login';
    if (openId === 'signup-modal') location.hash = '#signup';
}

function toggleProfileMenu() {
    const start = document.getElementById('profile-dropdown');
    start.classList.toggle('show');
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    if (!e.target.closest('#user-profile')) {
        const dropdown = document.getElementById('profile-dropdown');
        // Only if it exists
        if (dropdown) dropdown.classList.remove('show');
    }
});

function logout() {
    document.getElementById('auth-buttons').style.display = 'flex';
    document.getElementById('user-profile').style.display = 'none';
    document.getElementById('profile-dropdown').classList.remove('show');
    document.getElementById('profile-dropdown').classList.remove('show');
    location.hash = '#home'; // Reset to home
    currentUser = null; // Clear session
    localStorage.removeItem('currentUser'); // Clear persisted session
    cart = [];
    saveCart();
    updateCartCount();
    alert('Logged out successfully');
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);

    // Update button text
    const btn = document.getElementById('theme-toggle');
    btn.innerText = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function showMessage(elementId, msg, isError) {
    const el = document.getElementById(elementId);
    el.innerHTML = msg;
    // msg-box error-msg classes are defined in CSS
    el.className = isError ? 'msg-box error-msg' : 'msg-box success-msg';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            closeModal('login-modal');

            // Switch UI to logged-in state
            document.getElementById('auth-buttons').style.display = 'none';
            document.getElementById('user-profile').style.display = 'flex';

            // Update profile info
            const username = data.user.username;
            currentUser = { username: username }; // Set logged in user
            localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Persist session

            document.getElementById('user-name').innerText = username;
            document.getElementById('user-initial').innerText = username.charAt(0).toUpperCase();

            // Load logic could be here (e.g. merge local cart with server cart)
            updateCartCount();

        } else if (res.status === 404) {
            showMessage('login-msg', 'User not found. Redirecting to Signup...', true);
            setTimeout(() => {
                // Switch to signup and pre-fill email
                switchModal('login-modal', 'signup-modal');
                document.getElementById('signup-email').value = email;
            }, 1500);
        } else {
            showMessage('login-msg', 'Invalid Credentials', true);
        }
    } catch (err) {
        showMessage('login-msg', 'Server Error. Try again.', true);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!username || !email || !password) {
        showMessage('signup-msg', 'Invalid Details', true);
        return;
    }

    try {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            showMessage('signup-msg', 'Successfully Registered! Redirecting to Login...', false);
            setTimeout(() => {
                switchModal('signup-modal', 'login-modal');
                // Pre-fill login with registered details
                document.getElementById('login-email').value = email;
                document.getElementById('login-password').value = password;
            }, 1500);
        } else {
            showMessage('signup-msg', data.error || 'Invalid Details', true);
        }
    } catch (err) {
        showMessage('signup-msg', 'Server Error', true);
    }
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
