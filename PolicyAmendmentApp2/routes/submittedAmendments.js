// In routes/submittedAmendments.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    try {
        const [submittedAmendments] = await db.query('SELECT * FROM amendments');
        res.render('submittedAmendments', { submittedAmendments });
    } catch (error) {
        console.error('Error fetching submitted amendments:', error);
        res.status(500).send('Error loading submitted amendments');
    }
});

module.exports = router;
