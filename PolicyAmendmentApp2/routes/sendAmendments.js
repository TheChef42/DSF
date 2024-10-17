const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Route to handle saving amendments to the database
router.post('/', async (req, res) => {
    try {
        // Loop through each amendment in the global array and save it to the database
        for (const amendment of global.storedAmendments) {
            await db.query(
                'INSERT INTO amendments (user_id, amendment_number, amendment_reference, conflicting_with, line_from, line_to, amendment_type, original_text, new_text, motivation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    amendment.user_id,
                    amendment.amendment_number,
                    amendment.amendment_reference,
                    amendment.conflicting_with,
                    amendment.line_from,
                    amendment.line_to,
                    amendment.amendment_type,
                    amendment.original_text,
                    amendment.new_text,
                    amendment.motivation
                ]
            );
        }

        // Clear the in-memory amendments list
        global.storedAmendments.length = 0;

        // Redirect to confirmation page
        res.redirect('/confirmation');
    } catch (error) {
        console.error('Error saving amendments to database:', error);
        res.status(500).send('Error saving amendments');
    }
});

module.exports = router;
