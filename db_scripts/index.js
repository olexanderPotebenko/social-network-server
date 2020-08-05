const http = require('http');
const mongoose = require('mongoose');
const config = require('../config/app');
require('../app/models/user'); 
mongoose.set('useFindAndModify', false);

mongoose
    .connect(config.mongo_uri)
    .then(() => {

        let resetUserData = () => {
            User.find()
                .exec()
                .then(users => {
                    console.log(users);
                    
                    users.forEach(user => {
                        User.findByIdAndUpdate(user._id, {subscribed_to: [],})
                            .exec()
                            .then(user => {
                                console.log(user.subscribed_to);
                            });
                    });
                });
        };


        const User = mongoose.model('User')
            resetUserData();
    });




