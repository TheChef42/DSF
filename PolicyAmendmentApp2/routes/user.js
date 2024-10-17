// Login Route - POST
router.post('/login', async (req, res) => {
    console.log("Received login form submission.");
    const { username, password } = req.body;
    console.log(`Attempting to log in user: ${username}`);

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (user) {
            console.log("User found in database.");
            if (await bcrypt.compare(password, user.password)) {
                console.log("Password correct, logging in.");
                req.session.user = user.username;
                // Redirect to /amendment after login
                res.redirect('/amendment');
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