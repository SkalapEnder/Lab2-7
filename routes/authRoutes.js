const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
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

    // Find new free ID from collection (starts from 0)
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

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });

    if (user === null) {
        return res.render('error', {errorMessage: 'User not found'});
    }
    if (password !== user.password){
        return res.render('error', {errorMessage: 'Invalid password'});
    }

    req.session.userId = user.user_id;
    req.session.username = user.username;
    req.session.isLoggedIn = true;
    res.redirect('todo');
});

// UPDATE part
router.get('/update', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/login');
    }

    const user = await getUser(req.session.userId);
    if (user === null) {
        return res.render('error', {errorMessage: 'User not found'});
    }
    res.render('update', {user});
})

router.post('/update', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/login');
    }

    const { username, email, role, secret_code } = req.body;

    if (role === 'admin' && secret_code === null) {
        return res.render('error', {errorMessage: 'Secret code is required for admins'});
    }

    try {
        const updateData = {
            username: username,
            email: email,
            role: role };
        if (role === 'admin') {
            if (secret_code !== adminCode) {
                return res.render('error', {errorMessage: 'Invalid secret code'});
            }
        }

        const user_id = req.session.userId;
        const updatedUser = await User.findOneAndUpdate(
            {user_id: user_id},
            {$set: updateData}
        );
        if (updatedUser === null) {
            return res.render('error', {errorMessage: 'Error updating user'});
        }
        req.session.username = username;
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user.');
    }
});

// LOG OUT part
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.render('error', {errorMessage: 'Error logging out'});
        }
        res.redirect('/');
    });
});

router.post('/delete-account', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/');
    }

    const userId = req.session.userId;

    try {
        const response = await Task.deleteMany({ user_id: userId });

        if (response === null) {
            console.error(`Failed to delete tasks.`);
        }

        const deletedUser = await User.findOneAndDelete({ user_id: userId });
        if (deletedUser === null) {
            return res.render('error', {errorMessage: 'User not found or not deleted'});
        }

        req.session.destroy();
        res.redirect('/');
    } catch (err) {
        return res.render('error', {errorMessage: err});
    }
});

router.get('/profile', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/login');
    }

    const user = await getUser(req.session.userId);
    if (user === null) {
        return res.render('error', {errorMessage: 'User not found'});
    }
    return res.render('profile', {user});
})

async function getUser(id){
    const user = await User.findOne({ user_id: id });
    if (user === null) return null;
    return user;
}

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
