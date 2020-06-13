const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
      id: Number,
      uniqueUrlName: String,
      photos: {
        small: String,
        large: String, 
      },
      status: String,
    followed: Boolean, 
});
mongoose.model('User', UserSchema);


