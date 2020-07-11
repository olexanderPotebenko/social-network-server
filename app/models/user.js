const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    date: Number,
    birthday: Number,
    country: String,
    city: String,
    status: String,
    phone: String,
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
});
mongoose.model('User', UserSchema);


