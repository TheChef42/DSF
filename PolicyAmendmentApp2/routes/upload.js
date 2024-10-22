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
            const errors = [];

            // Get the header row
            const headerRow = worksheet.getRow(1).values;

            // Create a mapping of header names to column indices
            const headerMap = {};
            headerRow.forEach((header, index) => {
                if (header) {
                    const normalizedHeader = header.trim().toLowerCase();
                    for (const [key, values] of Object.entries(columnMappings)) {
                        if (values.map(v => v.toLowerCase()).includes(normalizedHeader)) {
                            headerMap[key] = { index, name: header };
                        }
                    }
                }
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1 && row.hasValues) {
                    const amendment = {};
                    const rowErrors = [];

                    for (const [key, { index, name }] of Object.entries(headerMap)) {
                        const cell = row.getCell(index);
                        if (cell) {
                            let value = cell.value || "";
                            // Split the value before the occurrence of a number
                            if (key === 'amendment_number') {
                                const match = value.match(/\d+/);
                                value = match ? match[0] : value;
                                console.log(value);
                            }
                            // Add validation checks for each field
                            if (key === 'amendment_number' && isNaN(value)) {
                                rowErrors.push(`Invalid amendment number "${value}" in column "${name}". Expected a number.`);
                            }
                            if (key === 'line_from' && isNaN(value)) {
                                rowErrors.push(`Invalid line from "${value}" in column "${name}". Expected a number.`);
                            }
                            if (key === 'line_to' && isNaN(value)) {
                                rowErrors.push(`Invalid line to "${value}" in column "${name}". Expected a number.`);
                            }
                            // Add more validation checks as needed
                            amendment[key] = value;
                        }
                    }

                    if (rowErrors.length > 0) {
                        errors.push({ row: rowNumber, errors: rowErrors });
                    } else {
                        amendment.user_id = userId;
                        amendment.organisation_id = organisationId;
                        amendment.paper_id = paperId; // Use the retrieved paper_id
                        amendment.status = 'working';
                        amendments.push(amendment);
                    }
                }
            });

            // Log and insert only valid amendments
            for (const amendment of amendments) {
                console.log('Inserting amendment:', amendment); // Log the amendment being inserted
                await db.query('INSERT INTO amendments SET ?', amendment);
            }

            res.render('uploadResult', { errors, amendments, selectedPaper });
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});

module.exports = router;