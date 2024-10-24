const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:paper', async (req, res) => {
    try {
        const paperName = req.params.paper;
        const userRole = req.session.user.role;
        const userId = req.session.user.id;

        // Get the paper's ID based on the paper name
        const [papers] = await db.query('SELECT id FROM papers WHERE name = ?', [paperName]);

        // Check if the user is a 'redaktionsMedlem'
        let submittedAmendments;

        if (userRole === 'redaktionsMedlem') {
            // If the user is 'redaktionsMedlem', fetch all submitted amendments for the selected paper
            [submittedAmendments] = await db.query(
                'SELECT * FROM amendments WHERE status = ? AND paper_id = ?',
                ['submitted', papers[0].id]
            );
        } else {
            // If the user is not 'redaktionsMedlem', fetch only the submitted amendments of the current user
            [submittedAmendments] = await db.query(
                'SELECT * FROM amendments WHERE status = ? AND paper_id = ? AND user_id = ?',
                ['submitted', papers[0].id, userId]
            );
        }

        // Log the retrieved data to the console
        console.log('Fetched submitted amendments:', submittedAmendments);

        // Render the view with the fetched amendments
        res.render('submittedAmendments', { submittedAmendments, selectedPaper: paperName });
    } catch (error) {
        console.error('Error fetching submitted amendments:', error);
        res.status(500).send('Error loading submitted amendments');
    }
});

module.exports = router;
