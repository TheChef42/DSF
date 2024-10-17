const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Helper function to replace null with empty string
function replaceNull(value) {
    return value === null ? '' : value;
}

// Route to handle saving amendments to the database
router.post('/', async (req, res) => {
    try {
        // Loop through each amendment in the global array
        for (const amendment of global.storedAmendments) {
            if (!req.session.userId) {
                console.error('User ID is missing for amendment:', amendment);
                continue; // Skip this amendment if user_id is not defined
            }

            await db.query(
                'INSERT INTO amendments (user_id, amendment_number, amendment_reference, conflicting_with, line_from, line_to, amendment_type, original_text, new_text, motivation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    req.session.userId,
                    replaceNull(amendment.amendment_number),
                    replaceNull(amendment.amendment_reference),
                    replaceNull(amendment.conflicting_with),
                    replaceNull(amendment.line_from),
                    replaceNull(amendment.line_to),
                    replaceNull(amendment.amendment_type),
                    replaceNull(amendment.original_text),
                    replaceNull(amendment.new_text),
                    replaceNull(amendment.motivation)
                ]
            );
        }

        // Clear the in-memory amendments list after saving
        global.storedAmendments.length = 0;

        // Redirect to confirmation page
        res.redirect('/confirmation');
    } catch (error) {
        console.error('Error saving amendments to database:', error);
        res.status(500).send('Error saving amendments');
    }
});

module.exports = router;
