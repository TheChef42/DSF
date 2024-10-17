const express = require('express');
const router = express.Router();
const storedAmendments = [];

// Home route to render the form
router.get('/', (req, res) => {
    res.render('amendments', { amendments: storedAmendments });
});

module.exports = router;
global.storedAmendments = storedAmendments; // Make accessible to other routes
