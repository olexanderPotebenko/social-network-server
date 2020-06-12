// moduls
const fs = require('fs');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose'); //модуль для работы с монгодб

mongoose.connect('mongodb://localhost:27017/online-store');

//configuration
const port = 8080;
const address = '127.0.0.1';
//links template 
//https://social-network.samuraijs.com/api/1.0/users/?page=${this.props.page_current}&count=${this.props.page_size}
//https://www.allthetests.com/quiz22/picture/pic_1171831236_1.png'
//https://social-network.samuraijs.com/api/1.0/users/?page=${page_current}&count=${props.page_size}
//https://social-network.samuraijs.com/api/1.0/profile/2
//

const server = http.createServer();

server.listen(port, address, () => {
    console.log(`server run!\nport: ${port}\naddress: ${address}\n`);
});

server.on('request', (req, res) => {
    let url = req.url;
    switch(req.method){
        case 'POST':
            reqPostHandler(req, res); //curl -d "key1=value1&key2=value2" "uri" 
            break;
        case 'GET':
            reqGetHandler(req, res);
            break;
        case 'PUT':
            reqPutHandler(req, res); //curl -T filename "uri"
            break;
        case 'DELETE':
            reqDeleteHandler(req, res); //curl -X DELETE localhost:8080
            break;
    };
    console.log(url + '\n' + req.method);
});

function reqPostHandler(req, res) {
    res.end(req.url);

};

function reqGetHandler(req, res) {
    res.end(req.url);
};

function reqPostHandler(req, res) {
    res.end(req.url);
};

function reqPutHandler(req, res) {
    res.end(req.url);
};

function reqDeleteHandler(req, res) {
    res.end(req.url);
};
