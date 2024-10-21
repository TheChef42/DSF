const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const db = require('../db'); // Import the database connection
const columnMappings = require('../columnMappings.json'); // Import the column mappings

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

            // Get the header row
            const headerRow = worksheet.getRow(1).values;

            // Log the header row to check its contents
            console.log('Header Row:', headerRow);

            // Create a mapping of header names to column indices
            const headerMap = {};
            headerRow.forEach((header, index) => {
                if (header) {
                    const normalizedHeader = header.trim().toLowerCase();
                    for (const [key, values] of Object.entries(columnMappings)) {
                        if (values.map(v => v.toLowerCase()).includes(normalizedHeader)) {
                            headerMap[key] = index;
                        }
                    }
                }
            });

            // Log the headerMap to check if it is populated correctly
            console.log('Header Map:', headerMap);

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1 && row.hasValues) {
                    console.log(`Processing row ${rowNumber}`);
                    const amendment = {};
                    for (const [key, index] of Object.entries(headerMap)) {
                        const cell = row.getCell(index);
                        if (cell) {
                            amendment[key] = cell.value || "";
                        } else {
                            console.log(`Row ${rowNumber} does not have a cell at index ${index}`);
                        }
                    }
                    amendment.user_id = userId;
                    amendment.organisation_id = organisationId;
                    amendment.paper_id = paperId; // Use the retrieved paper_id
                    amendment.status = 'working';
                    console.log(`Amendment object for row ${rowNumber}:`, amendment); // Print the amendment object
                    amendments.push(amendment);
                } else {
                    console.log(`Skipping row ${rowNumber} as it has no values`);
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