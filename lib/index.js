// moduls
const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');
const mongoose = require('mongoose'); //модуль для работы с монгодб
mongoose.set('useFindAndModify', false);
const config = require('../config/app');

//models
require('../app/models/user'); 
require('../app/models/dialog'); 

//controllers
const users = require('../app/controllers/users');
const auth = require('../app/controllers/auth');


let auth_users = {
  'evgeniya.pusarchuk@gmail.com': false,
  'viktoriya.lukianenko@gmail.com': false,
};


const server = http.createServer();
mongoose
  .connect(config.mongo_uri)
  .then((result) => {
    server.listen(config.port, config.address, () => {
      let str = `server run!\nport: ${config.port}\naddress: ${config.address}\n`;
      console.log(str);
    });
  });

server.on('request', (req, res) => {
  let url = req.url;

  console.log(url);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  switch(req.method){
    case 'OPTIONS':
      onOptions(req, res);
      break;
    case 'POST':
      onPost(req, res); //curl -d "key1=value1&key2=value2" "uri" 
      break;
    case 'GET':
      onGet(req, res);
      break;
    case 'PUT':
      onPut(req, res); //curl -T filename "uri"
      break;
    case 'DELETE':
      onDelete(req, res); //curl -X DELETE localhost:8080
      break;
  };
});

function onOptions(req, res) {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end();
};

function onPost(req, res) {
  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(str => str === '' ? false: true);
  switch(routs[0]){
    case 'users':
      break;
    case 'profile':
      routs.length === 2 && users.create(req, res);
      if(routs.length === 3 && routs.includes('posts'))
        users.createPost(req, res);
      else if(routs.length === 5 && routs.includes('posts') && routs.includes('like'))
        users.likedPost(req, res);
      break;
    case 'signup':
      auth.signUp(req, res);
      break;
    case 'signin':
      auth.signIn(req, res, auth_users);
      break;
    case 'follow':
      users.follow(req, res);
      break;
    case 'messages':
      users.sendMessage(req, res);
      break;
  };

};

function onGet(req, res) {

  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(str => str !== '');
  switch(routs[0]){
    case 'likers':
      users.getLikersPost(req, res);
      break;
    case 'users':
      users.getUsers(req, res);
      break;
    case 'profile':
      routs.length == 2 && users.getOne(req, res);
      if(routs.includes('posts') && !routs.includes('picture') )
        users.getPosts(req, res);
      if(routs.includes('post') && routs.includes('picture') )
        users.getPostPicture(req, res);
      if(routs.includes('photos') && routs.includes('small') )
        users.getAvatarPicture(req, res);
      if(routs.includes('avatar') && routs.includes('profile'))
        users.getAvatarPicture2(req, res); 
      if(routs.includes('avatarlink') && routs.includes('profile'))
        users.getAvatarLink(req, res); 
      break;
    case 'auth':
      if(routs[1] == 'me'){
        res.end(JSON.stringify({message: 'you are not logged in', data: {}, result_code: 1}));
      };
      break;
    case 'messages':
      if(routs.length == 2 && routs.includes('messages') )
        users.getDialogs(req, res);
      if(routs.includes('dialog') )
        users.getDialog(req, res);
      break;
  };
};

function onPut(req, res) {
  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(str => str === '' ? false: true);

  switch(routs[0]){
    case 'profile':
      if(routs.length == 3 && routs[2] == 'update'){
        users.profileUpdate(req, res);
      };
      break;
    case 'messages':
      if(routs.includes('read')) {
        users.readMessages(req, res);
      };
      break;
  }
};

function onDelete(req, res) {
  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(rout => rout === '' ? false: true);
  switch(routs[0]) {
    case 'follow':
      users.unfollow(req, res);
      break;
    case 'profile':
      if(routs.length === 4 && routs.includes('posts') )
        users.deletePost(req, res);
    case 'messages':
      if(routs.includes('messages') && routs.includes('dialog') && routs.length === 4)
        users.deleteDialog(req, res);
  }
};

