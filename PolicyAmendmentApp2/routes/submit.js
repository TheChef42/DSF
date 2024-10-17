const express = require('express');
const router = express.Router();

// Route to handle individual amendment submissions
router.post('/', (req, res) => {
    const amendment = {
        æfNummer: req.body.æfNummer,
        æfTilÆfNummer: req.body.æfTilÆfNummer,
        modstridendeMed: req.body.modstridendeMed,
        linjeFra: req.body.linjeFra,
        linjeTil: req.body.linjeTil,
        indskrivning: req.body.indskrivning,
        stiller: req.body.stiller,
        medstillere: req.body.medstillere,
        typeAfÆf: req.body.typeAfÆf,
        oprindeligTekst: req.body.oprindeligTekst,
        nyTekst: req.body.nyTekst,
        motivationForÆf: req.body.motivationForÆf
    };

    global.storedAmendments.push(amendment);
    res.redirect('amendment');
});

module.exports = router;
