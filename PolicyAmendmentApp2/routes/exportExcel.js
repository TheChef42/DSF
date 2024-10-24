const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const router = express.Router();
const db = require('../db'); // Your database connection
const columnMappings = require('../columnMappings.json'); // Load column mappings

// Normalize header function
const normalizeHeader = (header) => header.trim().toLowerCase();

// Route to handle Excel export with language selection
router.get('/:language/:policyPaperName', async (req, res) => {
    const { language, policyPaperName } = req.params;
    const organisationId = req.session.user.organisation_id; // Get the organisation ID from the session
    const userRole = req.session.user.role; // Get the user role from the session

    try {
        let query = 'SELECT * FROM amendments WHERE organisation_id = ? AND status = "submitted" AND paper_id = (SELECT id FROM papers WHERE name = ?)';
        let queryParams = [organisationId];

        // If the user is a redaktionsMedlem, fetch all amendments for the selected paper
        if (userRole === 'redaktionsMedlem') {
            query = 'SELECT * FROM amendments WHERE paper_id = (SELECT id FROM papers WHERE name = ?)';
            queryParams = [policyPaperName];
        }

// If the state of the paper is æf to æf, only query amendments with a value in the amendment_to_amendment column
        const [paperState] = await db.query('SELECT state FROM papers WHERE name = ?', [policyPaperName]);
        console.log('Paper state:', paperState[0].state);
        if (paperState[0].state === 'æf til æf') {
            query += ' AND (amendment_to_amendment IS NOT NULL AND amendment_to_amendment != "")';
            console.log('Paper state is æf to æf');
        } else {
            query += ' AND (amendment_to_amendment IS NULL OR amendment_to_amendment = "")';
            console.log('Paper state is æf');
        }

        // Fetch amendments from the database based on the organisation and status
        const [submittedAmendments] = await db.query(query, queryParams);


        // Determine the template file based on the selected language
        const templateFile = language === 'danish' ? 'template_danish.xlsx' : 'template_english.xlsx';
        const filePath = path.join(__dirname, '../templates', templateFile);

        // Load the existing workbook
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        // Get the first worksheet
        const worksheet = workbook.getWorksheet(1);

        // Create a mapping of header names to column indices, excluding æf_number
        const headerRow = worksheet.getRow(1).values;
        const headerMap = {};
        headerRow.forEach((header, index) => {
            if (header) {
                const normalizedHeader = normalizeHeader(header);
                for (const [key, values] of Object.entries(columnMappings)) {
                    if (key !== 'amendment_number' && values.map(v => v.toLowerCase()).includes(normalizedHeader)) {
                        headerMap[key] = index;
                        break;
                    }
                }
            }
        });

        // Populate the worksheet with the fetched amendments using column mappings
        submittedAmendments.forEach((amendment, rowIndex) => {
            const row = worksheet.getRow(rowIndex + 2); // Start from the second row
            for (const [dbField, index] of Object.entries(headerMap)) {
                if (index > 0 && index <= 16384) { // Ensure the column index is within the valid range
                    row.getCell(index).value = amendment[dbField] || '';
                }
            }
            row.commit(); // Commit the row to the worksheet
        });


        // Set headers for download as an Excel file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="amendments_${policyPaperName}.xlsx"`);

        // Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Error generating Excel file');
    }
});

module.exports = router;