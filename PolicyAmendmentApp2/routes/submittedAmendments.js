const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:paper', async (req, res) => {
    try {
        const paperName = req.params.paper;
        const userRole = req.session.user.role;
        const organisationId = req.session.user.organisation_id;

        // Get the paper's ID based on the paper name
        const [paper] = await db.query('SELECT id FROM papers WHERE name = ?', [paperName]);

        const [papers] = await db.query('SELECT name FROM papers');

        // Check if the user is a 'redaktionsMedlem'
        let submittedAmendments;

        if (userRole === 'redaktionsMedlem') {
            // If the user is 'redaktionsMedlem', fetch all submitted amendments for the selected paper
            [submittedAmendments] = await db.query(
                'SELECT * FROM amendments WHERE status = ? AND paper_id = ?' +
                ' ORDER BY line_from ASC',
                ['submitted', paper[0].id]
            );
        } else {
            // If the user is not 'redaktionsMedlem', fetch only the submitted amendments of the current organisation
            [submittedAmendments] = await db.query(
                'SELECT * FROM amendments WHERE status = ? AND paper_id = ? AND organisation_id = ?' +
                ' ORDER BY line_from ASC',
                ['submitted', paper[0].id, organisationId]
            );
        }

        // Log the retrieved data to the console
        console.log('Fetched submitted amendments:', submittedAmendments);

        // Render the view with the fetched amendments
        res.render('submittedAmendments', { submittedAmendments, selectedPaper: paperName,papers: papers });
    } catch (error) {
        console.error('Error fetching submitted amendments:', error);
        res.status(500).send('Error loading submitted amendments');
    }
});

module.exports = router;