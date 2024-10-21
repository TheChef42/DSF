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
router.get('/:paper', isAuthenticated, async (req, res) => {
    const role = req.session.role;
    const paperId = req.params.paper;
    const organisationId = req.session.user.organisation_id;

    try {
        const [amendments] = await db.query(
            'SELECT * FROM amendments WHERE paper_id = ? AND organisation_id = ? AND status = ?',
            [paperId, organisationId, 'working']
        );
        const [papers] = await db.query('SELECT id, name FROM papers');
        req.session.selectedPaper = paperId;
        res.render('amendment', { amendments, papers, selectedPaper: paperId, role });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;