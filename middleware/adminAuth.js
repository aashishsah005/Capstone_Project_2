/**
 * adminAuth middleware - Placeholder for server-side admin route protection.
 * 
 * Admin access is currently enforced client-side in `public/js/auth.js` via the
 * `checkAuth()` function which redirects non-admin users away from `/admin`.
 * 
 * For production, this should be replaced with server-side session or JWT validation.
 */
const adminAuth = (req, res, next) => {
    next();
};

module.exports = adminAuth;
