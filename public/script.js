let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentSort = 'none';
let currentMode = 'static';
let currentCategory = 'all';
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let currentProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    window.addEventListener('hashchange', handleRoute);

    // Init cart
    updateCartCount();

    // Init Auth UI
    const currentUser = window.Auth.getUser();
    if (currentUser && !currentUser.is_admin) {
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-profile').style.display = 'flex';
        document.getElementById('user-name').innerText = currentUser.username;
        document.getElementById('user-initial').innerText = currentUser.username.charAt(0).toUpperCase();
    } else {
        // Ensure buttons are shown if admin is viewing or no user
        document.getElementById('auth-buttons').style.display = 'flex';
        document.getElementById('user-profile').style.display = 'none';
    }
});

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode + '-btn').classList.add('active');

    if (mode === 'scrape') {
        document.getElementById('scrape-search-container').style.display = 'block';
    } else {
        document.getElementById('scrape-search-container').style.display = 'none';
    }

    fetchProducts(); // Reload products based on mode
}

async function scrapeProducts() {
    const query = document.getElementById('scrape-search').value.trim();
    if (!query) {
        alert('Please enter a search query');
        return;
    }

    try {
        const data = await window.API.scrapeProducts(query);

        // Transform scraped data to match the product structure
        allProducts = data.map((item, index) => {
            const parsedPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
            return {
                id: 'scraped-' + index,
                name: item.title,
                brand: 'Scraped',
                image: item.image || 'https://via.placeholder.com/150',
                description: item.title,
                specifications: [],
                sellers: [{
                    name: item.site,
                    price: isNaN(parsedPrice) ? 0 : parsedPrice,
                    rawPrice: item.price, // Keep original for display if needed
                    rating: 4.5,
                    reviewCount: 100,
                    delivery: '3-5 days',
                    trusted: true
                }],
                category: determineCategory(item.title, '')
            };
        });

        renderProducts(allProducts, 'product-results');
        renderProducts(allProducts, 'category-products');
        populateFilters(allProducts);
    } catch (error) {
        console.error('Error scraping products:', error);
        alert('Error scraping products. Please try again.');
    }
}

async function fetchProducts() {
    if (currentMode === 'static') {
        try {
            const data = await window.API.fetchProducts();

            // Handle new JSON structure { "products": [...] }
            allProducts = data.products.map(p => {
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

            // Populate Sidebar Filters
            populateFilters(allProducts);

            // Handle initial route now that products are loaded
            handleRoute();
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    } else {
        // For scrape mode, products are loaded on search
        allProducts = [];
        renderProducts(allProducts, 'product-results');
        renderProducts(allProducts, 'category-products');
        populateFilters(allProducts);
        handleRoute();
    }
}

// Filter Logic
function populateFilters(products) {
    const brands = [...new Set(products.map(p => p.brand))].sort();
    const categories = [...new Set(products.map(p => p.category))].sort();

    const brandContainer = document.getElementById('brand-filters');
    const categoryContainer = document.getElementById('category-filters');

    if (brandContainer) {
        let brandHtml = `
            <label class="custom-radio">
                <input type="radio" name="brand" value="all" class="brand-filter" checked onchange="applyFilters()">
                <span class="radio-mark"></span>
                All Brands
            </label>
        `;
        brandHtml += brands.map(b => `
            <label class="custom-radio">
                <input type="radio" name="brand" value="${b}" class="brand-filter" onchange="applyFilters()">
                <span class="radio-mark"></span>
                ${b}
            </label>
        `).join('');
        brandContainer.innerHTML = brandHtml;
    }

    if (categoryContainer) {
        let catHtml = `
            <label class="custom-radio">
                <input type="radio" name="category" value="all" class="category-filter" checked onchange="applyFilters()">
                <span class="radio-mark"></span>
                All Categories
            </label>
        `;
        catHtml += categories.map(c => `
            <label class="custom-radio">
                <input type="radio" name="category" value="${c}" class="category-filter" onchange="applyFilters()">
                <span class="radio-mark"></span>
                ${c.charAt(0).toUpperCase() + c.slice(1)}
            </label>
        `).join('');
        categoryContainer.innerHTML = catHtml;
    }

    // Set max price range dynamically based on most expensive product
    const maxPrice = products.length > 0 ? Math.max(...products.flatMap(p => p.sellers.map(s => s.price))) : 100000;
    const ceilMax = Math.ceil(maxPrice / 1000) * 1000; // Round up to nearest 1000

    const maxInput = document.getElementById('max-price');
    const rangeInput = document.getElementById('price-range');
    const rangeMaxDisplay = document.getElementById('range-max');

    if (maxInput) maxInput.value = ceilMax;
    if (rangeInput) {
        rangeInput.max = ceilMax;
        rangeInput.value = ceilMax;
    }
    if (rangeMaxDisplay) rangeMaxDisplay.innerText = ceilMax.toLocaleString();
}

function syncPriceInput(value) {
    document.getElementById('max-price').value = value;
    document.getElementById('range-max').innerText = parseInt(value).toLocaleString();
    applyFilters();
}

function applyFilters() {
    const minPrice = parseInt(document.getElementById('min-price').value) || 0;
    const maxPrice = parseInt(document.getElementById('max-price').value) || Infinity;

    // Get selected radio values
    const selectedBrandEl = document.querySelector('.brand-filter:checked');
    const selectedCategoryEl = document.querySelector('.category-filter:checked');

    const selectedBrand = selectedBrandEl ? selectedBrandEl.value : 'all';
    const selectedCategory = selectedCategoryEl ? selectedCategoryEl.value : 'all';

    const selectedPlatforms = Array.from(document.querySelectorAll('.platform-filter:checked')).map(cb => cb.value.toLowerCase());

    const categorySearch = document.getElementById('category-search');
    const mainSearch = document.getElementById('main-search');
    const searchTerm = (categorySearch && categorySearch.value) ? categorySearch.value.toLowerCase() :
        (mainSearch && mainSearch.value) ? mainSearch.value.toLowerCase() : '';

    let filtered = allProducts.filter(p => {
        // Search Term Check
        if (searchTerm) {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm) ||
                p.brand.toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }

        // Price Check (check if ANY seller is within range)
        const bestPrice = Math.min(...p.sellers.map(s => s.price));
        if (bestPrice < minPrice || bestPrice > maxPrice) return false;

        // Brand Check
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;

        // Category Check
        const finalCategory = currentCategory !== 'all' ? currentCategory : selectedCategory;
        if (finalCategory !== 'all' && p.category !== finalCategory) return false;

        // Platform Check (check if ANY seller matches selected platform)
        if (selectedPlatforms.length > 0) {
            const hasPlatform = p.sellers.some(s => {
                const sellerLower = s.name.toLowerCase();
                return selectedPlatforms.some(platform => sellerLower.includes(platform));
            });
            if (!hasPlatform) return false;
        }

        return true;
    });

    // Apply Sorting
    if (currentSort === 'asc') {
        filtered.sort((a, b) => {
            const priceA = Math.min(...a.sellers.map(s => s.price));
            const priceB = Math.min(...b.sellers.map(s => s.price));
            return priceA - priceB;
        });
    } else if (currentSort === 'desc') {
        filtered.sort((a, b) => {
            const priceA = Math.min(...a.sellers.map(s => s.price));
            const priceB = Math.min(...b.sellers.map(s => s.price));
            return priceB - priceA;
        });
    }

    const hash = window.location.hash;
    const targetContainer = (hash === '#categories') ? 'category-products' : 'product-results';
    renderProducts(filtered, targetContainer);
}

function sortProducts(direction) {
    currentSort = direction;

    // Update UI buttons
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active-sort'));
    if (direction === 'asc') {
        document.getElementById('sort-asc').classList.add('active-sort');
    } else if (direction === 'desc') {
        document.getElementById('sort-desc').classList.add('active-sort');
    }

    applyFilters();
}

function clearFilters() {
    document.getElementById('min-price').value = 0;
    const rangeInput = document.getElementById('price-range');
    document.getElementById('max-price').value = rangeInput.max;
    rangeInput.value = rangeInput.max;
    document.getElementById('range-min').innerText = "0";
    document.getElementById('range-max').innerText = parseInt(rangeInput.max).toLocaleString();

    const allBrand = document.querySelector('input[name="brand"][value="all"]');
    if (allBrand) allBrand.checked = true;

    const allCat = document.querySelector('input[name="category"][value="all"]');
    if (allCat) allCat.checked = true;

    document.querySelectorAll('.platform-filter').forEach(cb => cb.checked = false);

    applyFilters();
}

function determineCategory(name, desc) {
    const text = (name + " " + (desc || "")).toLowerCase();
    if (text.includes('phone') || text.includes('galaxy') || text.includes('iphone') || text.includes('pixel')) return 'mobiles';
    if (text.includes('laptop') || text.includes('macbook') || text.includes('dell') || text.includes('keyboard')) return 'laptops';
    if (text.includes('watch') || text.includes('fitbit')) return 'watches';
    if (text.includes('camera') || text.includes('canon') || text.includes('gopro')) return 'cameras';
    if (text.includes('audio') || text.includes('sony') || text.includes('headphone') || text.includes('speaker')) return 'audio';
    return 'electronics'; // fallback
}

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color: #64748b;">No products found.</p>';
        return;
    }

    products.forEach(product => {
        const validPrices = product.sellers.map(s => s.price).filter(p => p > 0);
        const bestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
        const bestPriceDisplay = bestPrice > 0 ? `₹${bestPrice.toLocaleString()}` : 'Check Site';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => location.hash = '#product=' + product.id;
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">Best Price: ${bestPriceDisplay}</p>
                <div class="seller-list">
                    ${product.sellers.slice(0, 2).map(s => `
                        <div class="seller-item">
                            <span>${s.name}</span>
                            <span>${s.price > 0 ? '₹' + s.price.toLocaleString() : 'Check Site'}</span>
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

    showSection('product-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    currentProductId = id;
    loadFeedback(id);
}

async function loadFeedback(productId) {
    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = '<p class="no-feedback">Loading feedback...</p>';

    try {
        const response = await fetch(`/api/feedback/${productId}`);
        const feedback = await response.json();

        if (feedback.length === 0) {
            feedbackList.innerHTML = '<p class="no-feedback">No feedback yet. Be the first to share your thoughts!</p>';
        } else {
            feedbackList.innerHTML = feedback.map(f => `
                <div class="feedback-card">
                    <div class="feedback-header">
                        <div class="feedback-user">
                            <div class="user-avatar">${f.username.charAt(0).toUpperCase()}</div>
                            <span class="username">${f.username}</span>
                        </div>
                        <span class="feedback-date">${formatRelativeTime(f.created_at)}</span>
                    </div>
                    <div class="feedback-content">${f.feedback}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        feedbackList.innerHTML = '<p class="no-feedback" style="color: #ef4444">Failed to load feedback.</p>';
    }
}

async function submitFeedback() {
    const feedbackText = document.getElementById('feedback-text').value.trim();
    const statusEl = document.getElementById('feedback-status');

    if (!window.Auth.isLoggedIn()) {
        alert("Please login to post feedback!");
        window.location.href = 'login.html';
        return;
    }

    if (!feedbackText) {
        statusEl.innerText = "Please enter some feedback.";
        statusEl.style.color = "#ef4444";
        return;
    }

    const currentUser = window.Auth.getUser();
    const btn = document.querySelector('.submit-btn');
    btn.disabled = true;
    btn.innerText = 'Posting...';

    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: currentProductId,
                username: currentUser.username,
                feedback: feedbackText
            })
        });

        if (response.ok) {
            document.getElementById('feedback-text').value = '';
            statusEl.innerText = "Feedback posted!";
            statusEl.style.color = "#10b981";
            loadFeedback(currentProductId);
            setTimeout(() => { statusEl.innerText = ""; }, 3000);
        } else {
            throw new Error('Failed to post feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        statusEl.innerText = "Error posting feedback.";
        statusEl.style.color = "#ef4444";
    } finally {
        btn.disabled = false;
        btn.innerText = 'Post Feedback';
    }
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function addToCart(productId, sellerName, price) {
    if (!window.Auth.isLoggedIn()) {
        alert("Please login to add items to cart!");
        window.location.href = 'login.html';
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

    if (hash === '#categories') {
        showSection('categories');
    } else if (hash === '#cart') {
        showSection('cart');
        renderCart();
    } else if (hash.startsWith('#product=')) {
        const id = hash.split('=')[1];
        viewProduct(id);
    } else {
        showSection('home');
    }
}

function showSection(sectionId) {
    ['home', 'categories', 'product-view', 'cart'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden-section');
            el.classList.remove('active-section');
        }
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
    }
}

function filterByCategory(category) {
    currentCategory = category;
    applyFilters();
}

function setActivePill(element) {
    document.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active-pill'));
    element.classList.add('active-pill');
}

function highlightPill(category) {
    const pills = document.querySelectorAll('.pill');
    pills.forEach(pill => {
        if (pill.innerText.toLowerCase() === category.toLowerCase()) {
            setActivePill(pill);
        }
    });
}

function toggleProfileMenu() {
    const start = document.getElementById('profile-dropdown');
    start.classList.toggle('show');
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    if (!e.target.closest('#user-profile')) {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

function logout() {
    window.Auth.logout();
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerText = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}
