const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Route to handle updating amendments in the database
router.post('/', async (req, res) => {
    const userId = req.session.user.id;
    const organisationId = req.session.user.organisation_id;

    try {
        // Retrieve the amendments from the database
        const [amendments] = await db.query(
            'SELECT id FROM amendments WHERE organisation_id = ? AND status = ?',
            [organisationId, 'working']
        );

        // Loop through each amendment and update its status to 'submitted'
        for (const amendment of amendments) {
            await db.query(
                'UPDATE amendments SET status = ? WHERE id = ? AND user_id = ?',
                ['submitted', amendment.id, userId]
            );
        }

        // Redirect to confirmation page
        res.redirect('/confirmation');
    } catch (error) {
        console.error('Error updating amendments in database:', error);
        res.status(500).send('Error updating amendments');
    }
});

module.exports = router;