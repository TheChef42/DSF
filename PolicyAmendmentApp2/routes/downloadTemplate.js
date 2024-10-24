const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const router = express.Router();
const db = require('../db'); // Import the database connection
const columnMappings = require('../columnMappings.json');




const createWorkbook = async (language, organisationAbbreviation, db) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    // Add headers based on the selected language
    const headers = Object.keys(columnMappings)
        .filter(key => key !== 'line_length') // Exclude line_length
        .map(key => {
            const header = language === 'danish' ? columnMappings[key][0] : columnMappings[key][1];
            return { header, key };
        });

    worksheet.columns = headers;

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }; // White text
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF81C6E1' } // Blue background
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Ensure the header row is populated before adding the filter
    if (headerRow.cellCount > 0) {
        worksheet.autoFilter = {
            from: 'A1',
            to: headerRow.getCell(headerRow.cellCount).address
        };
    }

    // Fetch abbreviations from the database
    const [organisations] = await db.query('SELECT abbreviation FROM organisations');
    const medstillereValues = organisations.map(org => org.abbreviation).join(',');

    // Add data validation and conditional formatting for "Type af ÆF"
    const typeAfÆFColumn = headers.findIndex(header => header.key === 'amendment_type') + 1;
    const typeAfÆFValues = language === 'danish' ? ['Tilføj', 'Erstat', 'Slet'] : ['Add', 'Replace', 'Remove'];
    const typeAfÆFColors = ['FF00FF00', 'FFFFFF00', 'FFFF0000']; // Green, Yellow, Red

    worksheet.getColumn(typeAfÆFColumn).eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formula1: `"${typeAfÆFValues.join(',')}"`,
                showDropDown: true
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: typeAfÆFColors[typeAfÆFValues.indexOf(cell.value)] }
            };
        }
    });

    // Set "Stiller" column to the abbreviation of the organization
    const stillerColumn = headers.findIndex(header => header.key === 'proposer') + 1;
    worksheet.getColumn(stillerColumn).eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
            cell.value = organisationAbbreviation;
        }
    });

    // Add data validation for "Medstillere"
    const medstillereColumn = headers.findIndex(header => header.key === 'co_proposer') + 1;
    worksheet.getColumn(medstillereColumn).eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formula1: `"${medstillereValues}"`,
                showDropDown: true
            };
        }
    });

    return workbook;
};

// Route to download the Danish template
router.get('/danish', (req, res) => {
    const filePath = path.join(__dirname, '../templates/template_danish.xlsx');
    res.download(filePath, 'template_danish.xlsx', (err) => {
        if (err) {
            console.error('Error downloading Danish template:', err);
            res.status(500).send('Error downloading Danish template');
        }
    });
});

// Route to download the English template
router.get('/english', (req, res) => {
    const filePath = path.join(__dirname, '../templates/template_english.xlsx');
    res.download(filePath, 'template_english.xlsx', (err) => {
        if (err) {
            console.error('Error downloading English template:', err);
            res.status(500).send('Error downloading English template');
        }
    });
});

module.exports = router;