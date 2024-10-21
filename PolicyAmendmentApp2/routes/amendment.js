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
    const paperName = req.params.paper;
    const organisationId = req.session.user.organisation_id;

    try {
        // Look up the paper ID based on the paper name
        const [papers] = await db.query('SELECT id FROM papers WHERE name = ?', [paperName]);
        if (papers.length === 0) {
            return res.status(404).send('Paper not found');
        }
        const paperId = papers[0].id;

        const [amendments] = await db.query(
            'SELECT * FROM amendments WHERE paper_id = ? AND organisation_id = ? AND status = ?',
            [paperId, organisationId, 'working']
        );
        const [allPapers] = await db.query('SELECT id, name FROM papers');
        req.session.selectedPaper = req.params.paper;
        res.render('amendment', { amendments, papers: allPapers, selectedPaper: paperName, role });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;