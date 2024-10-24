const request = require('supertest');
const express = require('express');
const session = require('express-session');
const db = require('../db');
const submittedAmendmentsRouter = require('../routes/submittedAmendments');

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use('/submittedAmendments', submittedAmendmentsRouter);

jest.mock('../db');

describe('GET /submittedAmendments/:paper', () => {
    beforeEach(() => {
        db.query.mockReset();
    });

    it('fetches all submitted amendments for redaktionsMedlem', async () => {
        const paperName = 'Test Paper';
        const paperId = 1;
        const amendments = [{ id: 1, text: 'Amendment 1' }];
        const papers = [{ name: 'Test Paper' }];

        db.query.mockResolvedValueOnce([[{ id: paperId }]]);
        db.query.mockResolvedValueOnce([papers]);
        db.query.mockResolvedValueOnce([amendments]);

        const res = await request(app)
            .get(`/submittedAmendments/${paperName}`)
            .set('Cookie', 'connect.sid=s%3Atest')
            .session({ user: { role: 'redaktionsMedlem', organisation_id: 1 } });

        expect(res.status).toBe(200);
        expect(res.body.submittedAmendments).toEqual(amendments);
    });

    it('fetches submitted amendments for the current organisation', async () => {
        const paperName = 'Test Paper';
        const paperId = 1;
        const organisationId = 1;
        const amendments = [{ id: 1, text: 'Amendment 1' }];
        const papers = [{ name: 'Test Paper' }];

        db.query.mockResolvedValueOnce([[{ id: paperId }]]);
        db.query.mockResolvedValueOnce([papers]);
        db.query.mockResolvedValueOnce([amendments]);

        const res = await request(app)
            .get(`/submittedAmendments/${paperName}`)
            .set('Cookie', 'connect.sid=s%3Atest')
            .session({ user: { role: 'member', organisation_id: organisationId } });

        expect(res.status).toBe(200);
        expect(res.body.submittedAmendments).toEqual(amendments);
    });

    it('returns 500 if there is an error fetching the paper ID', async () => {
        const paperName = 'Test Paper';

        db.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .get(`/submittedAmendments/${paperName}`)
            .set('Cookie', 'connect.sid=s%3Atest')
            .session({ user: { role: 'redaktionsMedlem', organisation_id: 1 } });

        expect(res.status).toBe(500);
        expect(res.text).toBe('Error loading submitted amendments');
    });

    it('returns 500 if there is an error fetching the amendments', async () => {
        const paperName = 'Test Paper';
        const paperId = 1;

        db.query.mockResolvedValueOnce([[{ id: paperId }]]);
        db.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .get(`/submittedAmendments/${paperName}`)
            .set('Cookie', 'connect.sid=s%3Atest')
            .session({ user: { role: 'redaktionsMedlem', organisation_id: 1 } });

        expect(res.status).toBe(500);
        expect(res.text).toBe('Error loading submitted amendments');
    });
});