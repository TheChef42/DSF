const express = require('express');
const { Document, Packer, Paragraph } = require('docx');
const router = express.Router();

// Route to handle Word document download
router.get('/', async (req, res) => {
    const doc = new Document({
        sections: [{
            children: global.storedAmendments.map(amendment => [
                new Paragraph({ text: `ÆF Nummer: ${amendment.æfNummer}`, heading: 'Heading1' }),
                new Paragraph({ text: `ÆF til ÆF Nummer: ${amendment.æfTilÆfNummer}` }),
                new Paragraph({ text: `Modstridende Med: ${amendment.modstridendeMed}` }),
                new Paragraph({ text: `Linje Fra: ${amendment.linjeFra}` }),
                new Paragraph({ text: `Linje Til: ${amendment.linjeTil}` }),
                new Paragraph({ text: `Indskrivning: ${amendment.indskrivning}` }),
                new Paragraph({ text: `Stiller: ${amendment.stiller}` }),
                new Paragraph({ text: `Medstillere: ${amendment.medstillere}` }),
                new Paragraph({ text: `Type af ÆF: ${amendment.typeAfÆf}` }),
                new Paragraph({ text: `Oprindelig Tekst: ${amendment.oprindeligTekst}` }),
                new Paragraph({ text: `Ny Tekst: ${amendment.nyTekst}` }),
                new Paragraph({ text: `Motivation for ÆF: ${amendment.motivationForÆf}` }),
                new Paragraph({ text: "" }) // Adds spacing between amendments
            ]).flat()
        }]
    });

    try {
        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Disposition', 'attachment; filename="amendments.docx"');
        res.send(buffer);
    } catch (error) {
        res.status(500).send('An error occurred while generating the document.');
    }
});

module.exports = router;
