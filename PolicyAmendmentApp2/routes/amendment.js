const express = require('express');
const router = express.Router();

// Middleware for checking authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next(); // Proceed if authenticated
    } else {
        res.redirect('/user/login'); // Redirect to login if not authenticated
    }
}

// GET /amendment - Authenticated route to view locally stored amendments
router.get('/', isAuthenticated, (req, res) => {
    try {
        // Load amendments from the locally stored array
        const amendments = global.storedAmendments || []; // Use empty array if undefined
        res.render('amendment', { amendments }); // Render page with amendments data
    } catch (error) {
        console.error('Error retrieving amendments from local array:', error);
        res.status(500).send('Error retrieving amendments');
    }
});

module.exports = router;
