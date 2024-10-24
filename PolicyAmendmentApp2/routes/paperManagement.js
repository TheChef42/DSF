const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Middleware for checking authentication and role
function isAuthenticated(req, res, next) {
    if (req.session.user && req.session.user.role === 'redaktionsMedlem') {
        next(); // Proceed if authenticated and role is redaktionsUdvalg
    } else {
        res.redirect('/user/login'); // Redirect to login if not authenticated
    }
}

// GET /paper-management - View all papers
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const [papers] = await db.query('SELECT * FROM papers');
        res.render('paperManagement', { papers });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// POST /paper-management/update - Update paper state and active status
router.post('/update', isAuthenticated, async (req, res) => {
    const { paperId, state, active } = req.body;
    try {
        await db.query('UPDATE papers SET state = ?, active = ? WHERE id = ?', [state, active, paperId]);
        res.redirect('/paper-management');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;