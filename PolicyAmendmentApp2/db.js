const mysql = require('mysql2');

// Replace with your MySQL server details
const pool = mysql.createPool({
    host: '130.225.39.23',    // IP of your MySQL server
    user: 'root',   // MySQL username
    password: 'root', // MySQL password
    database: 'user_management'  // Database name
});

module.exports = pool.promise(); // Use promise-based queries