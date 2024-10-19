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

// GET /amendment/:paper - Authenticated route to view amendments for a specific paper
router.get('/:papers', isAuthenticated, async (req, res) => {
    const role = req.session.role;
    const paper = req.params.papers;
    const [papers] = await db.query('SELECT id, name FROM papers');
    res.render('amendment', {amendments: req.session.storedAmendments, papers, selectedPaper: paper, role: role});
});

module.exports = router;
