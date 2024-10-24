const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const db = require('../db'); // Import the database connection
const columnMappings = require('../columnMappings.json'); // Import the column mappings

router.post('/', async (req, res) => {
    if (req.files && req.files.file) {
        const file = req.files.file;
        const workbook = new ExcelJS.Workbook();

        // Load the workbook and handle errors
        try {
            await workbook.xlsx.load(file.data);
        } catch (err) {
            console.error('Error loading workbook:', err);
            return res.render('uploadResult', {
                errors: [{ row: 'N/A', errors: ['Unexpected error occurred while loading the workbook.'] }],
                amendments: [],
                unmatchedHeaders: [],
                selectedPaper: req.session.selectedPaper
            });
        }

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

            // Ensure the worksheet exists
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                return res.status(400).send('Worksheet not found');
            }

            const amendments = [];
            const errors = [];
            const unmatchedHeaders = [];

            // Get the header row
            const headerRow = worksheet.getRow(1).values;

            // Create a mapping of header names to column indices
            const headerMap = {};
            headerRow.forEach((header, index) => {
                if (header) {
                    const normalizedHeader = header.trim().toLowerCase();
                    let matched = false;
                    for (const [key, values] of Object.entries(columnMappings)) {
                        if (values.map(v => v.toLowerCase()).includes(normalizedHeader)) {
                            headerMap[key] = { index, name: header };
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        unmatchedHeaders.push(header);
                    }
                }
            });

            // Check if at least three headers are matched
            if (Object.keys(headerMap).length < 3) {
                return res.render('uploadResult', {
                    errors: [{ row: 'N/A', errors: ['Please download the template and ensure at least three headers are correct.'] }],
                    amendments: [],
                    unmatchedHeaders,
                    selectedPaper
                });
            }

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1 && row.hasValues) {
                    const amendment = {};
                    const rowErrors = [];

                    for (const [key, { index, name }] of Object.entries(headerMap)) {
                        const cell = row.getCell(index);
                        if (cell) {
                            let value = cell.value || "";
                            // Split the value before the occurrence of a number
                            if (key === 'amendment_number' && typeof value === 'string') {
                                const match = value.match(/\d+/);
                                value = match ? match[0] : value;
                            }
                            // Add validation checks for each field
                            if (key === 'line_from' && (isNaN(value) || value === "")) {
                                if (value === "")
                                    rowErrors.push(`Invalid line_from "is empty" in column "${name}". Expected a number.`);
                                else
                                    rowErrors.push(`Invalid line_from "${value}" in column "${name}". Expected a number.`);
                            }
                            if (key === 'line_to' && (isNaN(value) || value === "")) {
                                if (value === "")
                                    rowErrors.push(`Invalid line_to "is empty" in column "${name}". Expected a number.`);
                                else
                                    rowErrors.push(`Invalid line_to "${value}" in column "${name}". Expected a number.`);
                            }
                            amendment[key] = value;
                        }
                    }

                    // Validate that line_from is smaller than line_to or line_to can be empty
                    if (amendment.line_from && amendment.line_to && amendment.line_from > amendment.line_to) {
                        rowErrors.push(`line_from "${amendment.line_from}" should be smaller than line_to "${amendment.line_to}".`);
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

            // Check if there are more than 150 valid rows
            if (amendments.length > 150) {
                return res.render('uploadResult', {
                    errors: [{ row: 'N/A', errors: ['Maximum of 150 amendments upload at a time.'] }],
                    amendments: [],
                    unmatchedHeaders,
                    selectedPaper
                });
            }

            // Log and insert only valid amendments
            for (const amendment of amendments) {
                console.log('Inserting amendment:', amendment); // Log the amendment being inserted
                await db.query('INSERT INTO amendments SET ?', amendment);
            }

            res.render('uploadResult', { errors, amendments, unmatchedHeaders, selectedPaper });
        } catch (err) {
            console.error(err);
            res.render('uploadResult', {
                errors: [{ row: 'N/A', errors: ['Unexpected error occurred while processing the file.'] }],
                amendments: [],
                unmatchedHeaders,
                selectedPaper
            });
        }
    } else {
        res.status(400).send('No file uploaded');
    }
});

module.exports = router;