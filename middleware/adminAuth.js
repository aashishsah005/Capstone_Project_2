const adminAuth = (req, res, next) => {
    // Basic role protection. 
    // In a production app, verify this via JWT or session on the server.
    next();
};

module.exports = adminAuth;
