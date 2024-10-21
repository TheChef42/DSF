const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const db = require('../db'); // Import the database connection

router.post('/', async (req, res) => {
    if (req.files && req.files.file) {
        const file = req.files.file;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.data);

        const selectedPaper = req.session.selectedPaper;
        const userId = req.session.user.id;
        const organisationId = req.session.user.organisation_id;

        try {
            // Retrieve the paper_id based on the selectedPaper name
            const [papers] = await db.query('SELECT id FROM papers WHERE name = ?', [selectedPaper]);
            if (papers.length === 0) {
                return res.status(400).send('Selected paper not found');
            }
            const paperId = papers[0].id;

            const worksheet = workbook.getWorksheet(1);
            const amendments = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    const amendment = {
                        amendment_number: row.getCell(1).value || "",
                        amendment_reference: row.getCell(2).value || "",
                        conflicting_with: row.getCell(3).value || "",
                        line_from: row.getCell(4).value || "",
                        line_to: row.getCell(5).value || "",
                        amendment_type: row.getCell(6).value || "",
                        original_text: row.getCell(7).value || "",
                        new_text: row.getCell(8).value || "",
                        motivation: row.getCell(9).value || "",
                        user_id: userId,
                        organisation_id: organisationId,
                        paper_id: paperId, // Use the retrieved paper_id
                        status: 'working'
                    };
                    amendments.push(amendment);
                }
            });

            for (const amendment of amendments) {
                await db.query('INSERT INTO amendments SET ?', amendment);
            }
            res.redirect('/amendment/' + selectedPaper);
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});

module.exports = router;