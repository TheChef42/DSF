const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const app = express();
const nodemailer = require('nodemailer');
const config = require('./config'); // Import the configuration
const db = require('./db'); // Import the database connection

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('express-fileupload')());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for session handling
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Middleware to initialize storedAmendments in session if not present
app.use(async (req, res, next) => {
    if (!req.session.storedAmendments) {
        try {
            const [papers] = await db.query('SELECT name FROM papers');
            req.session.storedAmendments = {};
            papers.forEach(paper => {
                req.session.storedAmendments[paper.name] = [];
            });
        } catch (err) {
            return next(err);
        }
    }
    next();
});

app.use(async (req, res, next) => {
    if (!req.session.organisations) {
        try {
            const [organisations] = await db.query('SELECT id, name FROM organisations');
            req.session.organisations = organisations;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Middleware to initialize selectedPaper in session if not present
app.use((req, res, next) => {
    if (!req.session.selectedPaper) {
        req.session.selectedPaper = null;
    }
    next();
});

app.use((req, res, next) => {
    res.locals.user = req.session.user; // Set the user from session to be available globally
    next();
});



// Middleware for checking authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        res.locals.user = req.session.user; // Make user info available to templates
        res.locals.role = req.session.user.role; // Make role available to templates
        next();
    } else {
        res.redirect('/user/login');
    }
}

// Route to set the selected paper
app.post('/select-paper', (req, res) => {
    req.session.selectedPaper = req.body.selectedPaper;
    res.redirect('/home'); // Redirect to home or any other page after setting the paper
});

// Import routes
const mainRoute = require('./routes/main');
const submitRoute = require('./routes/submit');
const uploadRoute = require('./routes/upload');
const downloadRoute = require('./routes/download');
const sendAmendmentsRoute = require('./routes/sendAmendments');
const exportExcelRoute = require('./routes/exportExcel');
const confirmationRoute = require('./routes/confirmation');
const userRoute = require('./routes/user'); // User routes
const amendmentRoute = require('./routes/amendment');
const submittedAmendmentsRoute = require('./routes/submittedAmendments');
const adminRouter = require('./routes/admin');
const homeRouter = require('./routes/home');

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// User routes for registration and login, no authentication required
app.use('/', mainRoute);
app.use('/user', userRoute);

// Protected routes that require authentication
app.use('/amendment', isAuthenticated, amendmentRoute);
app.use('/submit-amendment', isAuthenticated, submitRoute);
app.use('/upload', isAuthenticated, uploadRoute);
app.use('/export', isAuthenticated, downloadRoute);
app.use('/send-amendments', isAuthenticated, sendAmendmentsRoute);
app.use('/export-excel', isAuthenticated, exportExcelRoute);
app.use('/confirmation', isAuthenticated, confirmationRoute);
app.use('/submitted-amendments', isAuthenticated, submittedAmendmentsRoute);
app.use('/admin', isAuthenticated, adminRouter);
app.use('/home', isAuthenticated, homeRouter);

// Determine which server to start (HTTP or HTTPS) based on the configuration
if (config.https) {
    const httpsOptions = {
        key: fs.readFileSync(config.httpsOptions.key),
        cert: fs.readFileSync(config.httpsOptions.cert)
    };

    // Create an HTTPS server
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(config.port, () => {
        console.log(`HTTPS server running on port ${config.port}`);
    });

    // Optional: HTTP server that redirects to HTTPS
    http.createServer((req, res) => {
        res.writeHead(301, {
            Location: `https://${req.headers.host}${req.url}`
        });
        res.end();
    }).listen(config.httpRedirectPort, () => {
        console.log(`HTTP server redirecting to HTTPS on port ${config.httpRedirectPort}`);
    });
} else {
    // Development setup - HTTP only
    const httpServer = http.createServer(app);
    httpServer.listen(config.port, () => {
        console.log(`HTTP server running on port ${config.port}`);
    });
}