// routes/admin.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db'); // Your database connection
const transporter = require('../emailTransporter'); // Correctly import without destructuring


// Middleware to restrict access to authenticated users with admin privileges
function isAuthenticated(req, res, next) {
    if (req.session.user && req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/user/login');
    }
}

// GET /admin - View users
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Fetching the necessary columns from the users table
        const [users] = await db.query('SELECT id, name, email, role, signup_status FROM users');
        res.render('admin', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// GET /admin/edit/:id - View edit form for a user
router.get('/edit/:id', isAuthenticated, async (req, res) => {
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
router.post('/edit-role/:id', isAuthenticated, async (req, res) => {
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

router.get('/delete/:id', isAuthenticated, async (req, res) => {
    const userId = req.params.id;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.redirect('/admin'); // Redirect back to the admin panel after deletion
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});

// Route to handle sending invitations
// Function to send an invitation email
async function sendInvitationEmail(to, name, token) {
    const invitationLink = `http://dsf.vitagliano.dk/user/register/${token}`;

    const mailOptions = {
        from: `"DSF Amendment Application" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Invitation to Join Our Application',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="http://dsf.vitagliano.dk/dsf-logo.png" alt="DSF Logo" style="width: 150px; height: auto;" />
            </div>
            <h2 style="color: #4A90E2;">Hello ${name},</h2>
            <p>You have been invited to join our DSF Amendment Application.</p>
            <p>To complete your registration, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}" 
                    style="background-color: #4A90E2; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">
                    Register Here
                </a>
            </div>
            <p>If you have any questions, feel free to reach out to us at support@yourdomain.com.</p>
            <p>Thank you,<br/>The DSF Team</p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
    `
    };


    console.log('Transporter:', transporter);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('Type of transporter:', typeof transporter);




    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Route to handle sending invitations
router.post('/invite', isAuthenticated, async (req, res) => {
    const { name, email, role } = req.body;
    const token = crypto.randomBytes(20).toString('hex'); // Generate a unique token

    try {
        // Insert the new user with signup_status set to 'pending'
        await db.query(
            'INSERT INTO users (name, email, role, signup_status, invitation_token) VALUES (?, ?, ?, ?, ?)',
            [name, email, role, 'pending', token]
        );

        // Send the invitation email
        await sendInvitationEmail(email, name, token);

        console.log(`Invitation sent to ${email}`);
        res.redirect('/admin'); // Redirect back to the admin panel after sending the invitation
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).send('Error sending invitation');
    }
});

module.exports = router;
