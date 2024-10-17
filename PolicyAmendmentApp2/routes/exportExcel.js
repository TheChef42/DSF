const express = require('express');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const router = express.Router();

const amendmentsFolder = path.join(__dirname, '..', 'amendments');

// Route to handle Excel export
router.get('/', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Amendments');

    // Define columns to match the format of the uploaded Excel sheet
    worksheet.columns = [
        { header: 'ÆF Nummer', key: 'æfNummer', width: 15 },
        { header: 'ÆF til ÆF Nummer', key: 'æfTilÆfNummer', width: 20 },
        { header: 'Modstridende med', key: 'modstridendeMed', width: 20 },
        { header: 'Linje fra', key: 'linjeFra', width: 10 },
        { header: 'Linje til', key: 'linjeTil', width: 10 },
        { header: 'Indskrivning', key: 'indskrivning', width: 30 },
        { header: 'Stiller', key: 'stiller', width: 15 },
        { header: 'Medstillere', key: 'medstillere', width: 20 },
        { header: 'Type af ÆF', key: 'typeAfÆf', width: 15 },
        { header: 'Oprindelig tekst', key: 'oprindeligTekst', width: 30 },
        { header: 'Ny tekst', key: 'nyTekst', width: 30 },
        { header: 'Motivation for ÆF', key: 'motivationForÆf', width: 30 },
    ];

    // Read all JSON files from the amendments folder
    const files = fs.readdirSync(amendmentsFolder);
    files.forEach(file => {
        const filePath = path.join(amendmentsFolder, file);
        const amendmentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Add a new row to the worksheet for each amendment
        worksheet.addRow({
            æfNummer: amendmentData.æfNummer,
            æfTilÆfNummer: amendmentData.æfTilÆfNummer,
            modstridendeMed: amendmentData.modstridendeMed,
            linjeFra: amendmentData.linjeFra,
            linjeTil: amendmentData.linjeTil,
            indskrivning: amendmentData.indskrivning,
            stiller: amendmentData.stiller,
            medstillere: amendmentData.medstillere,
            typeAfÆf: amendmentData.typeAfÆf,
            oprindeligTekst: amendmentData.oprindeligTekst,
            nyTekst: amendmentData.nyTekst,
            motivationForÆf: amendmentData.motivationForÆf,
        });
    });

    // Set response headers to prompt download as Excel file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="amendments.xlsx"');

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
});

module.exports = router;
