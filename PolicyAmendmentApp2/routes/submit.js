const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection

router.post('/', async (req, res) => {
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
        motivationForÆf: req.body.motivationForÆf,
        user_id: req.session.user.id,
        organisation_id: req.session.user.organisation_id,
        paper_id: req.session.selectedPaper,
        status: 'working'
    };

    try {
        await db.query('INSERT INTO amendments SET ?', amendment);
        res.redirect(`/amendment/${req.session.selectedPaper}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;