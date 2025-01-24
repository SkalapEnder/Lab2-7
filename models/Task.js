const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user_id: { type: Number, default: -1 },
    title: { type: String, required: true, unique: false },
    description: { type: String, required: true },
    is_done: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});


taskSchema.pre('save', async function (next) {
    next();
});

const Task = mongoose.model('todo_list', taskSchema);
module.exports = Task;
