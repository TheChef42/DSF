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

// POST /submit-amendment - Handle form submission
router.post('/submit-amendment', isAuthenticated, async (req, res) => {
    const {
        æfNummer,
        æfTilÆfNummer,
        linjeFra,
        linjeTil,
        stiller,
        medstillere,
        typeAfÆf,
        oprindeligTekst,
        nyTekst,
        motivationForÆf
    } = req.body;

    const userId = req.session.user.id;
    const organisationId = req.session.user.organisation_id;
    const paperId = req.session.selectedPaperId; // Assuming you store the selected paper ID in the session

    try {
        // Insert the amendment into the database
        await db.query(
            'INSERT INTO amendments (user_id, organisation_id, paper_id, amendment_number, write_in, conflicting_with, line_from, line_to, proposer, co_proposer, amendment_type, original_text_danish, new_text_danish, motivation_danish, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, organisationId, paperId, æfNummer, æfTilÆfNummer, null, linjeFra, linjeTil, stiller, medstillere, typeAfÆf, oprindeligTekst, nyTekst, motivationForÆf, 'working']
        );

        res.redirect('/amendment/' + req.session.selectedPaper); // Redirect to the amendments page for the selected paper
    } catch (error) {
        console.error('Error submitting amendment:', error);
        res.status(500).send('Error submitting amendment');
    }
});

// DELETE /amendment/:id - Delete a specific amendment
router.delete('/:id', isAuthenticated, async (req, res) => {
    const amendmentId = req.params.id;

    try {
        await db.query('DELETE FROM amendments WHERE id = ?', [amendmentId]);
        res.status(200).send('Amendment deleted successfully');
    } catch (error) {
        console.error('Error deleting amendment:', error);
        res.status(500).send('Error deleting amendment');
    }
});



module.exports = router;