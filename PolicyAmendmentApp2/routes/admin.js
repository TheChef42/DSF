// routes/admin.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db'); // Your database connection
const transporter = require('../emailTransporter'); // Correctly import without destructuring

// Middleware to restrict access to authenticated users with admin privileges
function isAuthenticated(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/user/login');
    }
}

// GET /admin - View users
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Fetching the necessary columns from the users and organisations tables
        const [users] = await db.query(`
            SELECT users.*, organisations.name AS organisation_name, organisations.university AS organisation_university
            FROM users
            LEFT JOIN organisations ON users.organisation_id = organisations.id
        `);
        const [organisations] = await db.query('SELECT id, name, university FROM organisations');
        res.render('admin', { users, organisations });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// POST /admin/edit-user/:id - Update user details
router.post('/edit-user/:id', isAuthenticated, async (req, res) => {
    const userId = req.params.id;
    const { name, email, role, signup_status, organisation_id } = req.body;

    try {
        // Update the user details in the database
        await db.query('UPDATE users SET name = ?, email = ?, role = ?, signup_status = ?, organisation_id = ? WHERE id = ?',
            [name, email, role, signup_status, organisation_id, userId]);
        res.redirect('/admin'); // Redirect back to the admin panel after saving
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).send('Error updating user details');
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

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Route to handle sending invitations
router.post('/invite', isAuthenticated, async (req, res) => {
    const { name, email, role, organisation_id } = req.body;
    const token = crypto.randomBytes(20).toString('hex'); // Generate a unique token

    try {
        // Insert the new user with signup_status set to 'pending'
        await db.query(
            'INSERT INTO users (name, email, role, signup_status, invitation_token, organisation_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, role, 'pending', token, organisation_id]
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

// Route to handle password reset
router.post('/reset-password/:id', isAuthenticated, async (req, res) => {
    const userId = req.params.id;
    const token = crypto.randomBytes(20).toString('hex'); // Generate a unique token

    try {
        // Delete the user's password, set a new invite token, and update the signup status to 'pending'
        await db.query('UPDATE users SET password = NULL, invitation_token = ?, signup_status = ? WHERE id = ?', [token, 'pending', userId]);

        // Fetch the user's email and name
        const [user] = await db.query('SELECT email, name FROM users WHERE id = ?', [userId]);
        if (user.length > 0) {
            // Send the invitation email
            await sendInvitationEmail(user[0].email, user[0].name, token);
        }

        res.redirect('/admin'); // Redirect back to the admin panel after resetting the password
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send('Error resetting password');
    }
});

module.exports = router;