// emailTransporter.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

const transporter = nodemailer.createTransport({
    host: 'smtp.simply.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.SMTP_USER, // Load from environment variables
        pass: process.env.SMTP_PASS  // Load from environment variables
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

module.exports = transporter; // Export the transporter object
