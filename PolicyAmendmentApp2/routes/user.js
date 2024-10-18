const express = require('express');
const bcrypt = require('bcryptjs');
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

// GET /register/:token - Registration page with token
router.get('/register/:token', async (req, res) => {
    const token = req.params.token;

    try {
        // Check if a user with this token exists and has not signed up yet
        const [users] = await db.query('SELECT * FROM users WHERE invitation_token = ? AND signup_status = "pending"', [token]);
        if (users.length === 0) {
            return res.status(400).send('Invalid or expired invitation link.');
        }

        // Get the user details to prefill the form
        const user = users[0];
        res.render('register', { token, email: user.email, name: user.name, isInvited: true });
    } catch (error) {
        console.error('Error fetching user for registration:', error);
        res.status(500).send('Error fetching user for registration');
    }
});

// POST /register - Handle user registration form submission
router.post('/register', [
    check('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
    check('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
    check('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register', { errors: errors.array(), token: req.body.token, email: req.body.email, name: req.body.name, role: req.body.role, isInvited: req.body.token ? true : false });
    }

    const { name, password, token, role, email } = req.body;

    try {
        if (token) {
            // Retrieve the user with the provided token
            const [users] = await db.query('SELECT * FROM users WHERE invitation_token = ? AND signup_status = "pending"', [token]);
            const user = users[0];

            if (!user) {
                return res.status(400).send('Invalid or expired token.');
            }

            // Hash the password and update user details
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query('UPDATE users SET name = ?, password = ?, signup_status = "completed", invitation_token = NULL WHERE id = ?', [name, hashedPassword, user.id]);
        } else {
            // No token, create a new user
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query('INSERT INTO users (name, email, password, role, signup_status) VALUES (?, ?, ?, ?, "completed")', [name, email, hashedPassword, role]);
        }

        res.redirect('/user/login'); // Redirect to login after successful registration
    } catch (error) {
        console.error('Error registering user:', error);
        res.render('register', { errors: [{ msg: error.sqlMessage }], token, email, name, role, isInvited: token ? true : false });
    }
});


// Registration Route - GET
router.get('/register', (req, res) => {
    console.log("Accessed registration page.");
    res.render('register');
});

// Login Route - GET
router.get('/login', (req, res) => {
    console.log("Accessed login page.");
    res.render('login');
});

// Login Route - POST
router.post('/login', async (req, res) => {
    console.log("Received login form submission.");
    const { name, password } = req.body;
    console.log(`Attempting to log in user: ${name}`);

    try {
        // Retrieve user from the database by name
        const [rows] = await db.query('SELECT * FROM users WHERE name = ?', [name]);
        const user = rows[0];

        if (user) {
            console.log("User found in database.");
            // Check password
            if (await bcrypt.compare(password, user.password)) {
                console.log("Password correct, logging in.");
                // Store user details in session
                req.session.user = user.name;
                req.session.userId = user.id; // Store the user ID for later use
                req.session.role = user.role; // Store the user role
                res.redirect('/amendment');
            } else {
                console.log("Incorrect password.");
                res.render('login', { error: 'Invalid name or password' });
            }
        } else {
            console.log("User not found.");
            res.render('login', { error: 'Invalid name or password' });
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
