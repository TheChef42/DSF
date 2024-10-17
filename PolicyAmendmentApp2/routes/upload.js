const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();

// Route to handle Excel file upload
router.post('/', async (req, res) => {
    if (req.files && req.files.file) {
        const file = req.files.file;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.data);

        // Clear existing amendments
        global.storedAmendments.length = 0;

        const worksheet = workbook.getWorksheet(1); // Assuming data is on the first sheet

        // Iterate over rows, skipping the header row
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip the header row
                const amendment = {
                    æfNummer: row.getCell(1).value || "",         // Column 1
                    æfTilÆfNummer: row.getCell(2).value || "",    // Column 2
                    modstridendeMed: row.getCell(3).value || "",  // Column 3
                    linjeFra: row.getCell(4).value || "",         // Column 4
                    linjeTil: row.getCell(5).value || "",         // Column 5
                    indskrivning: row.getCell(6).value || "",     // Column 6
                    stiller: row.getCell(7).value || "",          // Column 7
                    medstillere: row.getCell(8).value || "",      // Column 8
                    typeAfÆf: row.getCell(9).value || "",         // Column 9
                    oprindeligTekst: row.getCell(10).value || "", // Column 10
                    nyTekst: row.getCell(11).value || "",         // Column 11
                    motivationForÆf: row.getCell(12).value || ""  // Column 12
                };
                global.storedAmendments.push(amendment);
            }
        });
    }
    res.redirect('/');
});

module.exports = router;
