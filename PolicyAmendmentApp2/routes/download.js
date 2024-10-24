const express = require('express');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const router = express.Router();
const db = require('../db');
const createWorkbook = require('./downloadTemplate').createWorkbook; // Import the createWorkbook function

// Route to handle Word document download from the database
router.get('/', async (req, res) => {
    try {
        const organisationId = req.session.user.organisation_id; // Get the organisation ID from the session

        // Fetch amendments from the database based on the organisation
        const [submittedAmendments] = await db.query(
            'SELECT * FROM amendments WHERE organisation_id = ?',
            [organisationId]
        );

        // Create a workbook using the template generation logic
        const organisationAbbreviation = req.session.user.organisation_abbreviation;
        const workbook = await createWorkbook('danish', organisationAbbreviation, db);

        // Populate the workbook with the fetched amendments
        const worksheet = workbook.getWorksheet('Template');
        submittedAmendments.forEach((amendment, index) => {
            const row = worksheet.addRow({
                amendment_number: amendment.amendment_number,
                line_from: amendment.line_from,
                line_to: amendment.line_to,
                amendment_type: amendment.amendment_type,
                proposer: amendment.stiller,
                co_proposer: amendment.co_proposer,
                original_text: amendment.original_text,
                new_text: amendment.new_text,
                motivation: amendment.motivation
            });
            row.commit();
        });

        // Generate and send the document
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Disposition', 'attachment; filename="submitted_amendments.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.error('An error occurred while generating the document:', error);
        res.status(500).send('An error occurred while generating the document.');
    }
});

module.exports = router;