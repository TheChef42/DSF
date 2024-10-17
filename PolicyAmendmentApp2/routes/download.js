const express = require('express');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const router = express.Router();
const db = require('../db'); // Ensure your DB is correctly imported

// Route to handle Word document download from the database
router.get('/', async (req, res) => {
    try {
        // Fetch amendments from the database
        const [submittedAmendments] = await db.query('SELECT * FROM amendments');

        // Format the amendments into the document
        const doc = new Document({
            sections: [{
                children: submittedAmendments.map(amendment => [
                    new Paragraph({
                        children: [
                            new TextRun({ text: `ÆF Nummer: ${amendment.amendment_number}`, bold: true, break: 1 }),
                            new TextRun({ text: `Linje(r): ${amendment.line_from} - ${amendment.line_to}`, break: 1 }),
                            new TextRun({ text: `Hvad: ${amendment.amendment_type}`, break: 1 }),
                            new TextRun({ text: `Stillere: ${amendment.stiller}`, break: 1 }),
                            new TextRun({ text: "Original tekst:", bold: true, break: 1 }),
                            new TextRun({ text: amendment.original_text, break: 1 }),
                            new TextRun({ text: "Foreslået ændring:", bold: true, break: 1 }),
                            new TextRun({ text: amendment.new_text, break: 1 }),
                            new TextRun({ text: `Motivation: ${amendment.motivation}`, break: 2 })
                        ]
                    })
                ]).flat()
            }]
        });

        // Generate and send the document
        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Disposition', 'attachment; filename="submitted_amendments.docx"');
        res.send(buffer);
    } catch (error) {
        console.error('An error occurred while generating the document:', error);
        res.status(500).send('An error occurred while generating the document.');
    }
});

module.exports = router;
