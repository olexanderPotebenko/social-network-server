const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
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


