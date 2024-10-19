const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const app = express();
const nodemailer = require('nodemailer');
const config = require('./config'); // Import the configuration
global.storedAmendments = []; // Initialize globally accessible array


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('express-fileupload')());
app.use(express.static(path.join(__dirname, 'public')));



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

// Middleware for session handling
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user; // Set the user from session to be available globally
    next();
});

// Middleware for checking authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next(); // User is authenticated, proceed
    } else {
        res.redirect('/user/login'); // Redirect to login if not authenticated
    }
}



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
app.use('/submitted-amendments',isAuthenticated, submittedAmendmentsRoute);
app.use('/admin', isAuthenticated, adminRouter);
app.use('/home', isAuthenticated, homeRouter);

// Determine which server to start (HTTP or HTTPS) based on the configuration
if (config.https) {
    // Production setup - HTTPS
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
