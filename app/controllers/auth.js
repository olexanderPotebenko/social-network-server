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
                    res.writeHead(401, {'Content-Type': 'application/json'});
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
                    res.writeHead(401, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: 'Invalid credentials'}));
                };
            })
            .catch(err => {

                console.log(err);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: err}));
            });
    });
};

const signUp = (req, res) => {
    let data = [];
    req.on('data', chunk => {
        data.push(chunk)}) ;
    req.on('end', () => {
        data = JSON.parse(data);
        //проверка пришедших данных на валидность
        let is_valid = true;
        if(data.first_name == '' || data.first_name == undefined ||
            data.last_name == '' || data.last_name == undefined ||
            data.email == '' || data.email == undefined ||
            data.password == undefined || data.password.length < 6){
            is_valid = false;
        };
        if(is_valid){
            console.log('data is valid');
            User.findOne({email: data.email})
                .exec()
                .then(user => {
                    //проверка на наличие в базе пользователя с таким же email
                    if(!user){
                        User.create({
                            ...data,
                            password: bcrypt.hashSync(data.password, 10),
                            name: data.first_name + data.last_name,
                            photos: {
                                small: '',
                                large: '', 
                            },
                            status: '',
                            subscribed_to: [],
                            subscribrs: [], 

                        }).then(user => {
                            console.log(user);
                            console.log(`user ${user.name} has been successfully registered`);
                    res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({message: `user ${user.name} has been successfully registered`,
                                status_code: 0,
                            }))
                        }).catch(err => {
                            console.log(err);
                    res.writeHead(401, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({ message: err, status_code: 1, }))
                        });
                    }else{
                        console.log('This email address is reserved by another user');
                    res.writeHead(401, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({
                            message: 'This email address is reserved by another user'
                        }))
                    };
                }).catch(err => {
                    console.log(err);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: err, status_code: 1}));
                });

        }else{
            console.log('data is not a valid');
            res.writeHead(401, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                status_code: 1,
                message: 'data is not a valid'}
            ));
        };
    });
};

module.exports = {
    signIn,
    signUp,
};

