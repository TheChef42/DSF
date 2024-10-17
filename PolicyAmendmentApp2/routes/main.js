const express = require('express');
const router = express.Router();

// Route for the landing page
router.get('/', (req, res) => {
    res.render('landing');
});

module.exports = router;