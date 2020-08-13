// moduls
const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');
const mongoose = require('mongoose'); //модуль для работы с монгодб
mongoose.set('useFindAndModify', false);

//models
require('../app/models/user'); 

//controllers
const users = require('../app/controllers/users');
const auth = require('../app/controllers/auth');
const config = require('../config/app');



const server = http.createServer();
mongoose
    .connect(config.mongo_uri)
    .then(() => {
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
            auth.signIn(req, res);
            break;
        case 'follow':
            users.follow(req, res);
            break;
    };

};

function onGet(req, res) {

    let routs = url.parse(req.url, true).pathname.split('/')
        .filter(str => str === '' ? false: true);
    switch(routs[0]){
        case 'users':
            users.getUsers(req, res);
            break;
        case 'profile':
            routs.length == 2 && users.getOne(req, res);
            if(routs.includes('posts') && !routs.includes('picture') )
                users.getPosts(req, res);
            if(routs.includes('post') && routs.includes('picture') )
                users.getPostPicture(req, res);
            break;
        case 'auth':
            if(routs[1] == 'me'){
                res.end(JSON.stringify({message: 'you are not logged in', data: {}, result_code: 1}));
            };
            break;
    };
};

function onPut(req, res) {
    res.end(req.url);
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
    }
};

