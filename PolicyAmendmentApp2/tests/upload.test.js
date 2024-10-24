const request = require('supertest');
const express = require('express');
const ExcelJS = require('exceljs');
const app = express();
const uploadRouter = require('../routes/upload');
const db = require('../db');
const session = require('express-session');
const fileUpload = require('express-fileupload');

app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(fileUpload());
app.use('/upload', uploadRouter);

jest.mock('../db');

async function createValidExcelBuffer() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    worksheet.addRow(['Header1', 'Header2', 'Header3']);
    worksheet.addRow(['Data1', 'Data2', 'Data3']);
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

describe('POST /upload', () => {
    beforeEach(() => {
        db.query.mockReset();
    });

    it('should upload a valid file and insert amendments', async () => {
        db.query.mockResolvedValueOnce([[{ id: 1 }]]); // Mock paper_id query
        db.query.mockResolvedValueOnce({}); // Mock insert query

        const fileBuffer = await createValidExcelBuffer();
        const response = await request(app)
            .post('/upload')
            .set('Content-Type', 'multipart/form-data')
            .attach('file', fileBuffer, 'test.xlsx')
            .set('Cookie', 'connect.sid=s%3AtestSessionId')
            .field('selectedPaper', 'Test Paper');

        expect(response.status).toBe(200);
        expect(response.text).toContain('uploadResult');
        expect(db.query).toHaveBeenCalledTimes(2);
    }, 10000); // Increase timeout to 10 seconds

    it('should return 400 if no file is uploaded', async () => {
        const response = await request(app)
            .post('/upload')
            .set('Cookie', 'connect.sid=s%3AtestSessionId');

        expect(response.status).toBe(400);
        expect(response.text).toBe('No file uploaded');
    });

    it('should return 400 if selected paper is not found', async () => {
        db.query.mockResolvedValueOnce([[]]); // Mock paper_id query with no results

        const fileBuffer = await createValidExcelBuffer();
        const response = await request(app)
            .post('/upload')
            .set('Content-Type', 'multipart/form-data')
            .attach('file', fileBuffer, 'test.xlsx')
            .set('Cookie', 'connect.sid=s%3AtestSessionId')
            .field('selectedPaper', 'Nonexistent Paper');

        expect(response.status).toBe(400);
        expect(response.text).toBe('Selected paper not found');
    }, 10000); // Increase timeout to 10 seconds

    it('should return 500 on database error', async () => {
        db.query.mockRejectedValueOnce(new Error('Database error'));

        const fileBuffer = await createValidExcelBuffer();
        const response = await request(app)
            .post('/upload')
            .set('Content-Type', 'multipart/form-data')
            .attach('file', fileBuffer, 'test.xlsx')
            .set('Cookie', 'connect.sid=s%3AtestSessionId')
            .field('selectedPaper', 'Test Paper');

        expect(response.status).toBe(500);
        expect(response.text).toBe('Internal Server Error');
    }, 10000); // Increase timeout to 10 seconds

    it('should return errors if headers are unmatched', async () => {
        db.query.mockResolvedValueOnce([[{ id: 1 }]]); // Mock paper_id query

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');
        worksheet.addRow(['WrongHeader1', 'WrongHeader2', 'WrongHeader3']);
        const fileBuffer = await workbook.xlsx.writeBuffer();

        const response = await request(app)
            .post('/upload')
            .set('Content-Type', 'multipart/form-data')
            .attach('file', fileBuffer, 'test.xlsx')
            .set('Cookie', 'connect.sid=s%3AtestSessionId')
            .field('selectedPaper', 'Test Paper');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Please download the template and ensure at least three headers are correct.');
    }, 10000); // Increase timeout to 10 seconds

    it('should return errors if more than 150 rows are uploaded', async () => {
        db.query.mockResolvedValueOnce([[{ id: 1 }]]); // Mock paper_id query

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');
        worksheet.addRow(['Header1', 'Header2', 'Header3']);
        for (let i = 0; i < 151; i++) {
            worksheet.addRow([`Data1-${i}`, `Data2-${i}`, `Data3-${i}`]);
        }
        const fileBuffer = await workbook.xlsx.writeBuffer();

        const response = await request(app)
            .post('/upload')
            .set('Content-Type', 'multipart/form-data')
            .attach('file', fileBuffer, 'test.xlsx')
            .set('Cookie', 'connect.sid=s%3AtestSessionId')
            .field('selectedPaper', 'Test Paper');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Maximum of 150 amendments upload at a time.');
    }, 10000); // Increase timeout to 10 seconds
});