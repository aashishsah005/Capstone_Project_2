let salesChart = null;

async function loadStats() {
    try {
        const stats = await window.API.adminGetStats();
        document.getElementById('stat-revenue').innerText = `₹${stats.total_revenue.toLocaleString()}`;
        document.getElementById('stat-orders').innerText = stats.total_orders;
        document.getElementById('stat-users').innerText = stats.total_users;

        // Load Sales History for Chart
        const history = await window.API.adminGetSalesHistory();
        renderSalesChart(history);
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;

    if (salesChart) {
        salesChart.destroy();
    }

    // If no data, show empty placeholders
    const labels = data.length > 0 ? data.map(item => new Date(item.date).toLocaleDateString()) : ['No Data'];
    const totals = data.length > 0 ? data.map(item => item.total) : [0];

    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Sales (₹)',
                data: totals,
                backgroundColor: '#6366f1',
                borderRadius: 8,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: { callback: (value) => '₹' + value.toLocaleString() }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

async function loadUsers() {
    try {
        const users = await window.API.adminGetUsers();
        const tbody = document.getElementById('users-body');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><code style="background:#eee; padding:2px 4px; border-radius:4px; color:#999">••••••••</code></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-password" onclick="changeUserPassword(${user.id}, '${user.username}')">Change Password</button>
                    <button class="btn-delete" onclick="deleteUser(${user.id})">Remove</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
        await window.API.adminDeleteUser(id);
        loadUsers();
        loadStats();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function changeUserPassword(userId, username) {
    const newPassword = prompt(`Enter new password for user "${username}":`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        await window.API.adminChangePassword(userId, newPassword);
        alert(`Password for user "${username}" has been updated successfully!`);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    // Show selected section
    document.getElementById(`${sectionId}-section`).classList.add('active');

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(`'${sectionId}'`)) {
            item.classList.add('active');
        }
    });

    // Content specific loads
    if (sectionId === 'users') loadUsers();
    if (sectionId === 'analytics') loadStats();
}

// Password Form Handler
document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const msg = document.getElementById('password-msg');

    if (newPass !== confirmPass) {
        msg.style.color = 'red';
        msg.innerText = 'Passwords do not match';
        return;
    }

    try {
        const user = window.Auth.getUser();
        await window.API.adminChangePassword(user.id, newPass);
        msg.style.color = 'green';
        msg.innerText = 'Password updated successfully!';
        e.target.reset();
    } catch (err) {
        msg.style.color = 'red';
        msg.innerText = 'Error: ' + err.message;
    }
});

// Reuse original Add Product Logic
function addSpec(btn) {
    const specsList = btn.previousElementSibling;
    const newItem = document.createElement('div');
    newItem.className = 'input-group spec-item';
    newItem.style.display = 'grid';
    newItem.style.gridTemplateColumns = '1fr 1fr 40px';
    newItem.style.gap = '1rem';
    newItem.style.marginTop = '0.5rem';
    newItem.innerHTML = `
        <input type="text" class="s-key" placeholder="Key">
        <input type="text" class="s-val" placeholder="Value">
        <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color:red; cursor:pointer; font-size:1.5rem">&times;</button>
    `;
    specsList.appendChild(newItem);
}

function addOffer(btn) {
    const offersList = btn.previousElementSibling;
    const newItem = document.createElement('div');
    newItem.className = 'dynamic-item offer-row';
    newItem.style.padding = '1rem';
    newItem.style.borderStyle = 'dashed';
    newItem.innerHTML = `
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">&times;</button>
        <div class="input-group" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="field">
                <label>Seller Name</label>
                <input type="text" class="o-seller" required>
            </div>
            <div class="field">
                <label>Price (₹)</label>
                <input type="number" class="o-price" required>
            </div>
        </div>
        <div class="input-group" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-top:1rem;">
            <div class="field">
                <label>Rating</label>
                <input type="number" class="o-rating" step="0.1" value="4.5">
            </div>
            <div class="field">
                <label>Delivery (Days)</label>
                <input type="number" class="o-delivery" value="2">
            </div>
            <div class="field" style="flex-direction:row; align-items:center; gap:0.5rem; margin-top:1.5rem;">
                <input type="checkbox" class="o-trusted" checked>
                <label style="margin:0">Trusted</label>
            </div>
        </div>
    `;
    offersList.appendChild(newItem);
}

function addVariant() {
    const container = document.getElementById('variants-container');
    const newItem = document.createElement('div');
    newItem.className = 'dynamic-item variant-item';
    newItem.innerHTML = `
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">&times;</button>
        <div class="field">
            <label>Variant ID</label>
            <input type="text" class="v-id" required>
        </div>
        <div style="margin-top: 1.5rem;">
            <div class="specs-list"></div>
            <button type="button" class="add-btn" onclick="addSpec(this)">+ Add Specification</button>
        </div>
        <div style="margin-top: 1.5rem;">
            <div class="offers-list"></div>
            <button type="button" class="add-btn" onclick="addOffer(this)">+ Add Offer</button>
        </div>
    `;
    container.appendChild(newItem);
}

document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('status-msg');
    statusMsg.innerText = 'Saving...';

    try {
        const product = {
            product_id: document.getElementById('product_id').value,
            product_name: document.getElementById('product_name').value,
            brand: document.getElementById('brand').value,
            base_image_url: document.getElementById('base_image_url').value,
            description: document.getElementById('description').value,
            variants: []
        };

        document.querySelectorAll('.variant-item').forEach(vEl => {
            const variant = {
                variant_id: vEl.querySelector('.v-id').value,
                specifications: {},
                offers: []
            };
            vEl.querySelectorAll('.spec-item').forEach(sEl => {
                const k = sEl.querySelector('.s-key').value;
                const v = sEl.querySelector('.s-val').value;
                if (k && v) variant.specifications[k] = v;
            });
            vEl.querySelectorAll('.offer-row').forEach(oEl => {
                variant.offers.push({
                    seller_name: oEl.querySelector('.o-seller').value,
                    price: parseFloat(oEl.querySelector('.o-price').value),
                    rating: parseFloat(oEl.querySelector('.o-rating').value),
                    delivery_in_days: parseInt(oEl.querySelector('.o-delivery').value),
                    is_trusted_seller: oEl.querySelector('.o-trusted').checked
                });
            });
            product.variants.push(variant);
        });

        await window.API.adminAddProduct(product);
        statusMsg.style.color = 'green';
        statusMsg.innerText = 'Product added successfully!';
        e.target.reset();
    } catch (err) {
        statusMsg.style.color = 'red';
        statusMsg.innerText = 'Error: ' + err.message;
    }
});
