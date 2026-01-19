let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    // Auth listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
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
        card.onclick = () => viewProduct(product.id);
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
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('detail-image').src = product.image;
    document.getElementById('detail-name').innerText = product.name;
    document.getElementById('detail-desc').innerText = product.description;

    const specsList = document.getElementById('detail-specs');
    specsList.innerHTML = product.specifications.map(s => `<li>${s}</li>`).join('');

    const sellerList = document.getElementById('seller-list-horizontal');
    sellerList.innerHTML = product.sellers.map(s => `
        <div class="seller-card-detail" style="border-color: ${s.trusted ? '#8b5cf6' : '#e2e8f0'}">
            <h4>${s.name}</h4>
            <div class="seller-price">₹${s.price.toLocaleString()}</div>
            <div class="seller-meta">⭐ ${s.rating} (${s.reviewCount})</div>
            <div class="seller-meta">🚚 In ${s.delivery}</div>
            ${s.trusted
            ? '<div class="seller-meta" style="color:green; font-weight:600;">✔ Trusted</div>'
            : '<div class="seller-meta" style="color:#94a3b8">⚠️ Third Party</div>'}
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); alert('Added to cart!');">Add to Cart</button>
        </div>
    `).join('');

    showSection('product-view');
}

function showSection(sectionId) {
    ['home', 'categories', 'product-view'].forEach(id => {
        document.getElementById(id).classList.add('hidden-section');
        document.getElementById(id).classList.remove('active-section');
    });

    const target = document.getElementById(sectionId);
    target.classList.remove('hidden-section');
    target.classList.add('active-section');
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
    showSection('categories');
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
    document.getElementById('login-msg').innerHTML = ''; // Clear msgs
}
function showSignup() {
    document.getElementById('signup-modal').style.display = 'flex';
    document.getElementById('signup-msg').innerHTML = '';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
function switchModal(closeId, openId) {
    closeModal(closeId);
    document.getElementById(openId).style.display = 'flex';
    document.getElementById(openId === 'login-modal' ? 'login-msg' : 'signup-msg').innerHTML = '';
}

function logout() {
    document.getElementById('auth-buttons').style.display = 'inline-block';
    document.getElementById('user-profile').style.display = 'none';
    alert('Logged out');
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
            document.getElementById('auth-buttons').style.display = 'none';
            const profile = document.getElementById('user-profile');
            profile.style.display = 'flex';
            document.getElementById('user-name').innerText = data.user.username;
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
            showMessage('signup-msg', 'Successfully Registered!', false);
            setTimeout(() => switchModal('signup-modal', 'login-modal'), 1500);
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
