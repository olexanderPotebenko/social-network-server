const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    date: Number,
    email: String,
    password: String,
    photos: {
        small: String,
        large: String, 
    },
    subscribed_to: Array,
    subscribers: Array, 
    posts: Array,
    dialogs: Array,
    info: Array,
});
mongoose.model('User', UserSchema);


