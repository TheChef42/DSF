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
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.session.userId; // Retrieve user ID from the session

    try {
        // Query the database for amendments associated with the logged-in user
        const [amendments] = await db.query('SELECT * FROM amendments WHERE user_id = ?', [userId]);
        res.render('amendment', { amendments }); // Render page with amendments data
    } catch (error) {
        console.error('Error retrieving amendments from database:', error);
        res.status(500).send('Error retrieving amendments');
    }
});

module.exports = router;
