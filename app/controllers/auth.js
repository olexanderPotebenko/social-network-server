const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config/app');

const User = mongoose.model('User');

const signIn = (req, res, auth_users) => {
  let data = [];
  req.on('data', chunk => {
    data.push(chunk);
  });
  req.on('end', () => {
    data = JSON.parse(data);
    let {email, password} = data;
    /*
    'evgeniya.pusarchuk@gmail.com': false,
    'viktoriya.lukianenko@gmail.com': false,
    */
    if(auth_users['alina.lukianenko@gmail.com']){
      email = 'viktoriya.dyachenko@gmail.com';
      auth_users['alina.lukianenko@gmail.com'] = false;
    }else{
      auth_users['alina.lukianenko@gmail.com'] = true;
    }

    User.findOne({email})
      .exec()
      .then(user => {
        if(!user){
          res.end(JSON.stringify({message: 'User does not exit!!!',
            result_code: 1}));
          return;
        };
        const is_valid = bcrypt.compareSync(password, user.password);
        if(is_valid){
          const token = jwt.sign(user._id.toString(), config.secret_jwt);
          console.log(`user ${user.name} is authorized`);
          res.end(JSON.stringify({
            data: {
              id: user._id,
              email: user.email,
              name: user.name,
              photo: user.photos.small,
              token: token,
              subscribers: user.subscribers,
              subscribed_to: user.subscribed_to,
              dialogs: user.dialogs,
              info: user.info,
            },
            message: 'successfully',
            result_code: 0,
          }));
        }else{
          res.end(JSON.stringify({message: 'Invalid credentials', result_code: 1}));
        };
      })
      .catch(err => {

        console.log(err);
        res.end(JSON.stringify({message: err, result_code: 1}));
      });
  });
};

const signUp = (req, res) => {
  console.log('SIGN UP');
  let data = [];
  req.on('data', chunk => {
    data.push(chunk)}) ;
  req.on('end', () => {
    data = JSON.parse(data);
    //проверка пришедших данных на валидность
    //console.log(data);
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
              password: bcrypt.hashSync(data.password, 10),
              name: data.first_name + data.last_name,
              email: data.email,
              photos: {
                small: '',
                large: '', 
              },
              subscribed_to: [],
              subscribrs: [], 
              dialogs: [],
              posts: [],
              date: +new Date(),
              info: [],

            }).then(user => {
              console.log(`user ${user.name} has been successfully registered`);
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({message: `user ${user.name} has been successfully registered`,
                result_code: 0,
              }))
            }).catch(err => {
              console.log(err);
              res.end(JSON.stringify({ message: err, result_code: 1, }))
            });
          }else{
            console.log('This email address is reserved by another user');
            res.end(JSON.stringify({
              message: 'This email address is reserved by another user',
              result_code: 1
            }))
          };
        }).catch(err => {
          console.log(err);
          res.end(JSON.stringify({message: err.message, result_code: 1}));
        });

    }else{
      console.log('data is not a valid');
      res.end(JSON.stringify({
        result_code: 1,
        message: 'data is not a valid'}
      ));
    };
  });
};

module.exports = {
  signIn,
  signUp,
};

