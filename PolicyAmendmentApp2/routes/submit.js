const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection

router.post('/', async (req, res) => {
    const userId = req.session.user.id;
    const organisationId = req.session.user.organisation_id;
    const selectedPaperName = req.session.selectedPaper;

    try {
        // Retrieve the abbreviation of the user's organization
        const [orgResult] = await db.query('SELECT abbreviation FROM organisations WHERE id = ?', [organisationId]);
        const proposer = orgResult[0].abbreviation;

        // Join the co_proposer values into a single string
        const coProposers = Array.isArray(req.body['medstillere']) ? req.body['medstillere'].join(', ') : req.body['medstillere'];

        // Retrieve the paper_id based on the selected paper name
        const [paperResult] = await db.query('SELECT id FROM papers WHERE name = ?', [selectedPaperName]);
        if (paperResult.length === 0) {
            return res.status(400).send('Selected paper not found');
        }
        const paperId = paperResult[0].id;

        const amendment = {
            amendment_number: req.body['æfNummer'],
            amendment_to_amendment: req.body['aef_to_aef'],
            line_from: req.body['linjeFra'],
            line_to: req.body['linjeTil'],
            write_in: req.body['stiller'],
            proposer: proposer, // Use the abbreviation of the user's organization
            co_proposer: coProposers, // This will be handled in the Pug file
            amendment_type: req.body['typeAfÆf'],
            original_text_danish: req.body['oprindeligTekst'],
            new_text_danish: req.body['nyTekst'],
            motivation_danish: req.body['motivationForÆf'],
            original_text_english: req.body['oprindeligTekstEngelsk'],
            new_text_english: req.body['nyTekstEngelsk'],
            motivation_english: req.body['motivationForÆfEngelsk'],
            user_id: userId,
            organisation_id: organisationId,
            paper_id: paperId, // Use the retrieved paper_id
            status: 'working'
        };

        console.log(
            'Amendment to be inserted:', amendment
        )

        await db.query('INSERT INTO amendments SET ?', amendment);
        res.redirect(`/amendment/${selectedPaperName}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;