const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:paper', async (req, res) => {
    try {
        const paperName = req.params.paper;
        const [papers] = await db.query('SELECT id FROM papers WHERE name = ?', [paperName]);
        const [submittedAmendments] = await db.query('SELECT * FROM amendments where status = ? AND paper_id = ?', ['submitted', papers]);

        // Log the retrieved data to the console
        console.log('Fetched submitted amendments:', submittedAmendments);

        res.render('submittedAmendments', { submittedAmendments });
    } catch (error) {
        console.error('Error fetching submitted amendments:', error);
        res.status(500).send('Error loading submitted amendments');
    }
});

module.exports = router;
