const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config/app');

const User = mongoose.model('User');

const signIn = (req, res) => {
    let data = [];
    req.on('data', chunk => {
        data.push(chunk);
    });
    req.on('end', () => {
        data = JSON.parse(data);
        const {email, password} = data;
        User.findOne({email})
            .exec()
            .then(user => {
                if(!user){
                    res.writeHead(401, {'Content-Type': 'text/plain'});
                    res.end(JSON.stringify({message: 'User does not exit!!!'}));
                };
                console.log(user);
                console.log(password + ' ' + user.password);
                const is_valid = bcrypt.compareSync(password, user.password);
                if(!is_valid){
                    const token = jwt.sign(user._id.toString(), config.secret_jwt);
                    console.log(token);
                    res.end(JSON.stringify({token: token}));
                }else{
                    res.writeHead(401, {'Content-Type': 'text/plain'});
                    res.end(JSON.stringify({message: 'Invalid credentials'}));
                };
            })
            .catch(err => {

                console.log(err);
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end(JSON.stringify({message: err}));
            });
    });
};

module.exports = {
    signIn,
};

