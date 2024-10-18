const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer');
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




const PORT = 80;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
