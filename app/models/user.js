const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
      photos: {
        small: String,
        large: String, 
      },
      status: String,
    subscribed_to: Array,
    subscribrs: Array, 
});
mongoose.model('User', UserSchema);


