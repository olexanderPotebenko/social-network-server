const mongoose = require('mongoose');

const DialogSchema = new mongoose.Schema({
    user_id1: String,
    user_id2: String,
    messages: Array,
    date: Number,
    dateLastModified: Number,
});
mongoose.model('Dialog', DialogSchema);

//message = {
//message_id,
//user_id
//date,
//text,
