const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const mongoose = require("mongoose");
const router = express.Router();
const adminCode = 'admin1243'

mongoose.connect('mongodb+srv://skalap2endra:kGOM7z5V54vBFdp1@cluster0.vannl.mongodb.net/lab1_7?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Auth: Connected to MongoDB Atlas'))
    .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// REGISTER
router.get('/register', (req, res) => res.render('registration', {role: 'user'}));

router.post('/register', async (req, res) => {
    const { username, email, password, role, secretCode } = req.body;

    const existingUser = await User.findOne({ username: username });
    if (existingUser !== null) {
        return res.render('error', { errorMessage: 'User already exists' });
    }

    if (role === 'admin' && secretCode !== adminCode) {
        return res.render('error', { errorMessage: 'Invalid secret code' });
    }

    const userId = await getNextFreeUserId();
    if (isNaN(userId)) {
        throw new Error('Failed to generate a valid user_id');
    }

    // const hashedPassword = await bcrypt.hash(password, 11);

    const newUser = new User({
        user_id: userId,
        username: username,
        email: email,
        password: password,
        role: role,
        created_at: new Date(),
        updated_at: new Date(),
    });

    await newUser.save();
    res.redirect('/login');
});

// LOGIN
router.get('/login', (req, res) => {
    if (req.session.userId !== undefined) {
        return res.redirect('/todo');
    }
    res.render('login');
});

// Route to handle user login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });

    if (user === null || password !== user.password) {
        return res.send('Invalid login credentials');
    }

    req.session.userId = user.user_id;
    req.session.isLoggedIn = true;
    res.redirect('todo');
});

// Route to handle logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.render('error', {errorMessage: 'Error logging out'});
        }
        res.redirect('/');
    });
});

async function getNextFreeUserId() {
    try {
        const lastUser = await User.findOne().sort({ user_id: -1 });
        if (lastUser === null) {
            return 0;
        }
        return parseInt(lastUser.user_id + 1);
    } catch (err) {
        console.error('Error retrieving next free user_id:', err.message);
        throw new Error('Failed to retrieve next free user ID');
    }
}


module.exports = router;
