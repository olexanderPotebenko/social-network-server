// moduls
const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');
const mongoose = require('mongoose'); //модуль для работы с монгодб

//models
require('../app/models/user'); 

//controllers
const users = require('../app/controllers/users');
const auth = require('../app/controllers/auth');

const config = require('../config/app');


//links template 
//https://social-network.samuraijs.com/api/1.0/users/?page=${this.props.page_current}&count=${this.props.page_size}
//https://www.allthetests.com/quiz22/picture/pic_1171831236_1.png'
//https://social-network.samuraijs.com/api/1.0/users/?page=${page_current}&count=${props.page_size}
//https://social-network.samuraijs.com/api/1.0/profile/2
//
//     name: 'Olexander Morozuk', id: 1, uniqueUrlName: '', photos: { small: '', large: '', }, status: 'im fine', followed: true,


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
    res.setHeader("Access-Control-Allow-Origin", "*");

    switch(req.method){
        case 'OPTIONS':
            onOptions(req, res);
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
};

function onPost(req, res) {
    let routs = url.parse(req.url, true).pathname.split('/')
        .filter(str => str === '' ? false: true);
    switch(routs[0]){
        case 'users':
            break;
        case 'profile':
            users.create(req, res);
            break;
        case 'auth':
            auth.signUp(req, res);
            break;
        case 'signin':
            auth.signIn(req, res);
            break;
    };

};

function onGet(req, res) {
    let routs = url.parse(req.url, true).pathname.split('/')
        .filter(str => str === '' ? false: true);
    switch(routs[0]){
        case 'users':
            users.getSomething(req, res);
            break;
        case 'profile':
            users.getOne(req, res);
            break;
        case 'auth':
            if(routs[1] == 'me'){
                console.log('auth/me');
                res.end(JSON.stringify({message: 'you are not logged in', data: {}, result_code: 1}));
            };
            break;
    };
};

function onPut(req, res) {
    res.end(req.url);
};

function onDelete(req, res) {
    res.end(req.url);
};

