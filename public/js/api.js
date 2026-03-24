const API = {
    async fetchProducts() {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    },

    async scrapeProducts(query) {
        const response = await fetch(`/api/scrape?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to scrape products');
        return await response.json();
    },

    async login(email, password) {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        return data;
    },

    async signup(username, email, password) {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Signup failed');
        return data;
    },

    async createOrder(amount) {
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create order');
        return data;
    },

    async verifyPayment(details) {
        const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(details)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Payment verification failed');
        return data;
    },

    async adminAddProduct(product) {
        const response = await fetch('/api/admin/add-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add product');
        return data;
    },

    async adminGetUsers() {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    },

    async adminDeleteUser(id) {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete user');
        return data;
    },

    async adminGetStats() {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    },

    async adminGetSalesHistory() {
        const response = await fetch('/api/admin/sales-history');
        if (!response.ok) throw new Error('Failed to fetch sales history');
        return await response.json();
    },

    async adminChangePassword(userId, newPassword) {
        const response = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to change password');
        return data;
    }
};

window.API = API;
