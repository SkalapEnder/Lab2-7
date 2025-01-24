const express = require('express');
const Task = require('../models/Task');
const mongoose = require("mongoose");
const {ObjectId} = require("mongodb");
const router = express.Router();

mongoose.connect('mongodb+srv://skalap2endra:kGOM7z5V54vBFdp1@cluster0.vannl.mongodb.net/lab1_7?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Task: Connected to MongoDB Atlas'))
    .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

const collection = mongoose.connection.collection('todo_lists');

router.get('/todo', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/login');
    }

    const tasks = await collection.find({ user_id: parseInt(req.session.userId, 10) }).toArray();
    res.render('todo', {tasks});
});

router.post('/todo', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/login');
    }

    const title = req.body.title;
    const description = req.body.description;

    const newTask = {
        user_id: parseInt(req.session.userId, 10),
        title: title,
        description: description,
        is_done: false,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const result = await collection.insertOne(newTask);
    if (result === null) {
        return res.status(500).send({ error: 'Failed to insert all students.' });
    }
    res.redirect('/todo');
});

router.put('/todo/put/:id', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/login');
    }
    const taskId = new ObjectId(req.params.id);
    const title = req.body.title;
    const description = req.body.description;
    const is_done = req.body.is_done;

    try {
        const task = await collection.findOne({ _id: taskId, user_id: req.session.userId });

        if (task === null) {
            return res.status(403).send('You are not authorized to update this task.');
        }

        if (title) task.title = title;
        if (description) task.description = description;
        if (is_done !== undefined) task.is_done = Boolean(is_done); // Cast to boolean

        task.updated_at = new Date();

        const updates = {
            title: title,
            description: description,
            is_done: is_done,
        }

        const result = await collection.updateOne(
            { _id: taskId },
            { $set: updates }
        );
        if(result === null) {
            return res.status(403).send('The task not updated.');
        }
        return res.status(200).send('Task updated successfully.');
    } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/todo/delete/:id', async (req, res) => {
    if (req.session.userId === undefined) {
        return res.redirect('/login');
    }

    const id = new ObjectId(req.params.id);

    try {
        const result = await collection.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            return res.status(402).send('No task was deleted');
        }
        return res.status(200).send('Task was deleted');
    } catch (err) {
        console.error('Error deleting task:', err);
        throw err;
    }
});

module.exports = router;