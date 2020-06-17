const url = require('url');
const mongoose = require('mongoose');

const User = mongoose.model('User');

const getAll = (req, res) => {
    //User.remove({}, ()=>{});
    User.find().exec()
        .then(users => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            let data = {
                items: users,
                totalCount: users.length,
            };
            res.end(JSON.stringify(data));
        })
        .catch(err => {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(err));
        });
};

const getOne = (req, res) => {
    let user_id = url.parse(req.url, true).pathname.split('/')
        .filter(str => str === '' ? false: true)[1];
    User.findById(user_id).exec()
        .then(user => {
            if(user){
                res.writeHead(200, {'Content-Type': 'application/json'});
                let data = {
                    name: user.name,
                    id: user._id,
                    photos: user.photos,
                    subscribed_to: user.subscribed_to,
                    email: user.email,
                    subscribers: user.subscribers,
                    status: user.status,
                };
                res.end(JSON.stringify({data: data, status_code: 0}));
            }else{
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'this user was not found', status_code: 1}));
            };
        })
        .catch(err => {
            console.log('error');
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify({message: err, status_code: 1}));
        });
};

const create = (req, res) => {
    let data = [];
    req.on('data', chunk => {
        data.push(chunk);
    });
    req.on('end', () => {
        data = JSON.parse(data);
        User.create(data)
            .then(createdUser => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(createdUser));
            }).catch(err => {
                console.log(err);
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end(JSON.stringify(err));
            });
    });

};

const update = (req, res) => {
    let data = [];
    req.on('data', chunk => {
        data.push(chunk);
    });
    req.on('end', () => {

        let params = url.parse(req.url, true).query;
        User.findOneAndUpdate({id: params.id}, data)
            .exec()
            .then(user => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(user));
            }).catch(err => {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end(JSON.stringify(err));
            });
    });
};

const remove = (req, res) => {
    let params = url.parse(req.url, true).query;
    User.deleteOne({id: params.id})
        .exec()
        .then(() => {
            res.end(JSON.stringify({success: true}));
        }).catch(err => {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(err));
        });
};

module.exports = {
    create,
    getOne,
    getAll,
    update,
    remove,
};
