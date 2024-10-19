const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Middleware for checking authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next(); // Proceed if authenticated
    } else {
        res.redirect('/user/login'); // Redirect to login if not authenticated
    }
}

// GET /amendment - Authenticated route to view amendments from the database
// In routes/amendment.js
router.get('/', isAuthenticated, async (req, res) => {
    const role = req.session.role;
    const [papers] = await db.query('SELECT id, name FROM papers');
    res.render('paperSelection', {role: role, papers});
});

module.exports = router;
