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

// GET /amendment - Authenticated route to view amendments
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.session.userId; // Retrieve user ID from the session

    try {
        // Query amendments associated with the logged-in user
        const [amendments] = await db.query('SELECT * FROM amendments WHERE user_id = ?', [userId]);
        res.render('amendment', { amendments }); // Render the amendments page with data
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('Table does not exist, skipping query.');
            res.render('amendment', { amendments: [] }); // Render page with empty data
        } else {
            console.error('Error retrieving amendments:', error);
            res.status(500).send('Error retrieving amendments');
        }
    }
});

module.exports = router;
