// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Middleware for checking if the user is an admin
function isAdmin(req, res, next) {
    if (req.session.role === 'admin') {
        next(); // Proceed if authenticated as admin
    } else {
        res.status(403).send('Access denied. You are not authorized to view this page.');
    }
}

// GET /admin - View users
router.get('/', isAdmin, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, role FROM users');
        res.render('admin', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// GET /admin/edit/:id - View edit form for a user
router.get('/edit/:id', isAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        const [users] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [userId]);
        const user = users[0];
        if (user) {
            res.render('edit_user', { user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Error fetching user');
    }
});

// POST /admin/edit/:id - Update user details
// In admin.js (Express Route)
router.post('/edit-role/:id', isAdmin, async (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    try {
        // Update the role in the database
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        res.redirect('/admin'); // Redirect back to the admin panel after saving
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send('Error updating user role');
    }
});

router.get('/delete/:id', isAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.redirect('/admin'); // Redirect back to the admin panel after deletion
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});

module.exports = router;
