const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const db = require('../db'); // Your database connection

// Route to handle Excel export
router.get('/', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Amendments');

    // Define columns based on your format requirements
    worksheet.columns = [
        { header: 'ÆF Nummer', key: 'amendment_number', width: 15 },
        { header: 'ÆF til ÆF Nummer', key: 'amendment_reference', width: 20 },
        { header: 'Modstridende med', key: 'conflicting_with', width: 20 },
        { header: 'Linje fra', key: 'line_from', width: 10 },
        { header: 'Linje til', key: 'line_to', width: 10 },
        { header: 'Indskrivning', key: 'indskrivning', width: 30 },
        { header: 'Stiller', key: 'stiller', width: 15 },
        { header: 'Medstillere', key: 'medstillere', width: 20 },
        { header: 'Type af ÆF', key: 'amendment_type', width: 15 },
        { header: 'Oprindelig tekst', key: 'original_text', width: 30 },
        { header: 'Ny tekst', key: 'new_text', width: 30 },
        { header: 'Motivation for ÆF', key: 'motivation', width: 30 },
    ];

    try {
        // Fetch amendments from the database
        const [submittedAmendments] = await db.query('SELECT * FROM amendments');

        // Populate worksheet with data from database
        submittedAmendments.forEach(amendment => {
            worksheet.addRow({
                amendment_number: amendment.amendment_number,
                amendment_reference: amendment.amendment_reference || '',
                conflicting_with: amendment.conflicting_with || '',
                line_from: amendment.line_from || '',
                line_to: amendment.line_to || '',
                indskrivning: amendment.indskrivning || '',
                stiller: amendment.stiller || '',
                medstillere: amendment.medstillere || '',
                amendment_type: amendment.amendment_type || '',
                original_text: amendment.original_text || '',
                new_text: amendment.new_text || '',
                motivation: amendment.motivation || '',
            });
        });

        // Set headers for download as an Excel file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="amendments.xlsx"');

        // Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Error generating Excel file');
    }
});

module.exports = router;
