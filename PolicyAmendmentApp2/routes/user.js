const express = require('express');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const db = require('../db'); // Import the db connection
const router = express.Router();

// Middleware to restrict access to authenticated users
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/user/login');
    }
}

// Registration Route - GET
router.get('/register', (req, res) => {
    console.log("Accessed registration page.");
    res.render('register');
});

// Registration Route - POST
router.post('/register', [
    check('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    check('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
], async (req, res) => {
    console.log("Received registration form submission.");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.render('register', { errors: errors.array() });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Registering user: ${username}`);

    try {
        // Insert the new user into the database
        await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        console.log("User registered successfully.");
        res.redirect('/user/login');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log("Username already taken.");
            res.render('register', { errors: [{ msg: 'Username already taken' }] });
        } else {
            console.error("Error registering user:", error);
            res.status(500).send('Error registering user');
        }
    }
});

// Login Route - GET
router.get('/login', (req, res) => {
    console.log("Accessed login page.");
    res.render('login');
});

// Login Route - POST
router.post('/login', async (req, res) => {
    console.log("Received login form submission.");
    const { username, password } = req.body;
    console.log(`Attempting to log in user: ${username}`);

    try {
        // Retrieve user from the database
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (user) {
            console.log("User found in database.");
            // Check password
            if (await bcrypt.compare(password, user.password)) {
                console.log("Password correct, logging in.");
                req.session.user = user.username;
                res.redirect('/');
            } else {
                console.log("Incorrect password.");
                res.render('login', { error: 'Invalid username or password' });
            }
        } else {
            console.log("User not found.");
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send('Error logging in');
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    console.log("User logged out.");
    req.session.destroy();
    res.redirect('/user/login');
});

module.exports = router;
