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
        // Look up the paper ID and mode based on the paper name
        const [papers] = await db.query('SELECT id, state, active FROM papers WHERE name = ?', [paperName]);
        if (papers.length === 0) {
            return res.status(404).send('Paper not found');
        }
        const paperId = papers[0].id;
        const mode = papers[0].state;
        const isClosed = papers[0].active === 0;

        const [amendments] = await db.query(
            'SELECT * FROM amendments WHERE paper_id = ? AND organisation_id = ? AND status = ? ORDER BY line_from ASC',
            [paperId, organisationId, 'working']
        );
        const [allPapers] = await db.query('SELECT id, name FROM papers');
        const [organisations] = await db.query('SELECT name, abbreviation, university FROM organisations');
        organisations.pop(); // Removes the last element (DSF) from the array

        // Retrieve the abbreviation of the user's organization
        const [orgResult] = await db.query('SELECT abbreviation FROM organisations WHERE id = ?', [organisationId]);
        const proposer = orgResult[0].abbreviation;
        req.session.user.organisation_abbreviation = proposer;

        req.session.selectedPaper = req.params.paper;
        res.render('amendment', { amendments, papers: allPapers, selectedPaper: paperName, role, organisations, proposer, mode, isClosed });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// DELETE /amendment/:id - Authenticated route to delete an amendment
router.delete('/delete/:id', isAuthenticated, async (req, res) => {
    const amendmentId = req.params.id;
    const organisationId = req.session.user.organisation_id;

    try {
        const result = await db.query('DELETE FROM amendments WHERE id = ? AND organisation_id = ?', [amendmentId, organisationId]);
        if (result.affectedRows === 0) {
            return res.status(404).send('Amendment not found or not authorized to delete');
        }
        res.status(200).send('Amendment deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// DELETE /amendment/delete-all - Authenticated route to delete all visible amendments
router.delete('/delete-all', isAuthenticated, async (req, res) => {
    const organisationId = req.session.user.organisation_id;
    const paperName = req.session.selectedPaper;

    try {
        // Look up the paper ID based on the paper name
        const [papers] = await db.query('SELECT id FROM papers WHERE name = ?', [paperName]);
        if (papers.length === 0) {
            return res.status(404).send('Paper not found');
        }
        const paperId = papers[0].id;

        // Delete all amendments for the given paper and organisation
        const [result] = await db.query('DELETE FROM amendments WHERE paper_id = ? AND organisation_id = ? AND status = ?', [paperId, organisationId, 'working']);
        if (result.affectedRows === 0) {
            return res.status(404).send('No amendments found or not authorized to delete');
        }
        res.status(200).send('All amendments deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;