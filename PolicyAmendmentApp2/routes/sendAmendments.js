const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const amendmentsFolder = path.join(__dirname, '..', 'amendments');

// Ensure the amendments folder exists
if (!fs.existsSync(amendmentsFolder)) {
    fs.mkdirSync(amendmentsFolder);
}

// Route to handle saving amendments to the server folder
router.post('/', (req, res) => {
    // Save each amendment to the folder as a JSON file
    global.storedAmendments.forEach((amendment, index) => {
        const filePath = path.join(amendmentsFolder, `amendment_${index + 1}.json`);
        fs.writeFileSync(filePath, JSON.stringify(amendment, null, 2));
    });

    // Clear the in-memory amendments list
    global.storedAmendments.length = 0;

    // Redirect to confirmation page with a link back to the main page
    res.redirect('/confirmation');
});

module.exports = router;