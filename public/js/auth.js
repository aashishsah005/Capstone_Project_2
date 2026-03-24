const Auth = {
    getUser() {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    setUser(user) {
        sessionStorage.setItem('user', JSON.stringify(user));
    },

    logout() {
        sessionStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    isLoggedIn() {
        return !!this.getUser();
    },

    checkAuth() {
        const user = this.getUser();
        if (!user && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
            window.location.href = '/login.html';
        }

        // Admin Page Protection
        if (window.location.pathname.endsWith('admin.html') || window.location.pathname.endsWith('/admin')) {
            if (!user || !user.is_admin) {
                alert('Access Denied: Admin only.');
                window.location.href = '/index.html';
            }
        } 
        // Force Admins to Dashboard if they try to visit Home/Products
        else if (user && user.is_admin) {
            const path = window.location.pathname;
            const isHomePage = path === '/' || path === '' || path.endsWith('index.html');
            const isOtherUserPage = path.endsWith('orders.html') || path.endsWith('cart.html'); // Add others if needed
            
            if (isHomePage || isOtherUserPage) {
                window.location.href = '/admin';
            }
        }
    }
};

window.Auth = Auth;

// Handle Login Form
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const data = await window.API.login(email, password);
        Auth.setUser(data.user);
        
        // Redirect Admin to Dashboard, others to Home
        if (data.user.is_admin) {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/index.html';
        }
    } catch (err) {
        errorMessage.textContent = err.message;
        errorMessage.style.display = 'block';
    }
});

// Handle Signup Form
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        await window.API.signup(username, email, password);
        alert('Signup successful! Please login.');
        window.location.href = '/login.html';
    } catch (err) {
        errorMessage.textContent = err.message;
        errorMessage.style.display = 'block';
    }
});
