const url = require('url');
const fs = require('fs');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const authMiddleware = require('../middleware/auth.js');
const formidable = require('formidable');
const {base_address} = require('../../config/app');

// *** not requiring authorization ***
const getUsers = (req, res) => {

    let params = url.parse(req.url, true).query;
    //User.remove({}, ()=>{});
    User.find().exec()
        .then(users => {
            let users_parts = [];
            let start = Math.floor( (params.page - 1) * (params.count));
            let end = start + +params.count;
            if(start > users.length || Object.keys(params).length < 2)
                users_parts = users;
            else if(end >= users.length){
                users_parts = users.slice(start, users.length);
            }else
                users_parts = users.slice(start, end);
            users_parts = users_parts.map((user, i) => {
                return {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    photos: user.photos,
                    status: user.status,
                    subscribed_to: user.subscribed_to,
                    subscribers: user.subscribers,
                };
            });
            let data = {
                items: users_parts,
                totalCount: users.length,
                result_code: 0,
            };
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(data));
        })
        .catch(err => {
            console.log(err);
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
                let data = {
                    name: user.name,
                    id: user._id,
                    photos: user.photos,
                    subscribed_to: user.subscribed_to,
                    email: user.email,
                    subscribers: user.subscribers,
                    status: user.status,
                    result_code: 0,
                };
                res.end(JSON.stringify({data: data}));
            }else{
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'this user was not found', status_code: 1}));
            };
        })
        .catch(err => {
            console.log(err.message);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify({message: err.message, status_code: 1}));
        });
};

// *** requiring authorization ***

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


//get users data

const getUsersAuthorized = (req, res) => {

    let params = url.parse(req.url, true).query;
    //User.remove({}, ()=>{});
    User.find().exec()
        .then(users => {
            let users_parts = [];
            let start = Math.floor( (params.page - 1) * (params.count));
            let end = start + +params.count;
            if(start > users.length || Object.keys(params).length < 2)
                users_parts = users.slice(-5);
            else if(end >= users.length){
                users_parts = users.slice(start, users.length);
            }else
                users_parts = users.slice(start, end);
            res.writeHead(200, {'Content-Type': 'application/json'});
            users_parts = users_parts.map((user, i) => {
                return {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    photos: user.photos,
                    status: user.status,
                    followed: user.subscribers.includes(req.headers.id),
                    subscribed_to: user.subscribed_to,
                    subscribers: user.subscribers,
                };
            });
            let data = {
                items: users_parts,
                totalCount: users.length,
            };
            res.end(JSON.stringify(data));
        })
        .catch(err => {
            console.log(err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(err));
        });
};

const getOneAuthorized = (req, res) => {
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
                    result_code: 0,
                };
                res.end(JSON.stringify({data}));
            }else{
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'this user was not found', status_code: 1}));
            };
        })
        .catch(err => {
            console.log(err.message);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify({message: err.message, status_code: 1}));
        });
};

// follow

const follow = (req, res) => {
    let routs = url.parse(req.url, true).pathname.split('/')
        .filter(rout => rout === '' ? false: true);

    Promise.all([
        User.findById(routs[1])
        .exec()
        .then( user => {
            return Promise.resolve(user); 
        }),

        User.findById(req.headers.id)
        .exec()
        .then( user => Promise.resolve(user) ), 
    ])
        .then(data => {
            let user_1 = data[0];
            let user_2 = data[1];

            if( !user_1.subscribers.map(user => user.id).includes(user_2.id) ){
                let subscribers = [...user_1.subscribers];
                subscribers.push({
                    id: user_2.id,
                    name: user_2.name,
                });

                let subscribed_to = [...user_2.subscribed_to];
                subscribed_to.push({
                    id: user_1.id,
                    name: user_1.name,
                });

                Promise.all([
                    User.findByIdAndUpdate(routs[1], {subscribers})
                    .exec()
                    .then( user => Promise.resolve() ),

                    User.findByIdAndUpdate(req.headers.id, {subscribed_to})
                    .exec()
                    .then( user => Promise.resolve() ),
                ]).then( resolve => {
                    console.log(`User ${user_2.id} successfully subscribed on user ${user_1.id}`);
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end( JSON.stringify({result_code: 0, 
                        message: `user Vasya has successfully subscribed to user petya`}) );
                });
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end( JSON.stringify({result_code: 1, 
                    message: `you are already subscribed to this user`}) );
            };
            //                let subscribers = [req.headers.id];
            //                let subscribed_to = [routs[1]];

        });
};

const unfollow = (req, res) => {
    let routs = url.parse(req.url, true).pathname.split('/')
        .filter(rout => rout === '' ? false: true);

    Promise.all([
        User.findById(routs[1])
        .exec()
        .then( user => {
            return Promise.resolve(user); 
        }),

        User.findById(req.headers.id)
        .exec()
        .then( user => Promise.resolve(user) ), 
    ])
        .then(data => {
            console.log(data[0]);
            if( data[0].subscribers.map(user => user.id).includes(req.headers.id) ){
                let subscribers = data[0].subscribers
                    .filter(user => {
                        console.log(user);
                        return user.id == req.headers.id ? false: true
                    });
                let subscribed_to = data[1].subscribed_to
                    .filter(user => user.id == routs[1] ? false: true);

                Promise.all([
                    User.findByIdAndUpdate(routs[1], {subscribers})
                    .exec()
                    .then( user => Promise.resolve() ),

                    User.findByIdAndUpdate(req.headers.id, {subscribed_to})
                    .exec()
                    .then( user => Promise.resolve() ),
                ]).then( resolve => {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end( JSON.stringify({result_code: 0, 
                        message: `user Vasya has successfully unsubscribed to user petya`}) );
                });
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end( JSON.stringify({result_code: 1, 
                    message: `you are already unsubscribed to this user`}) );
            };

        });
};

const getPosts = (req, res) => {
    //`profile/${user_id}/posts/?page=${page}&count=&{count}`)  

    let routs = url.parse(req.url, true).pathname.split('/')
        .filter(rout => rout !== '' );
    let params = url.parse(req.url, true).query;

    User.findById(routs[1])
        .exec()
        .then( user => {

            if(user != null) {

            let posts = user.posts;
            let posts_parts = [];
            let start = Math.floor( (params.page - 1) * (params.count));
            let end = start + +params.count;
            if(start > posts.length || Object.keys(params).length < 2)
                posts_parts = posts.slice(-5);
            else if(end >= posts.length){
                posts_parts = posts.slice(start, posts.length);
            }else
                posts_parts = posts.slice(start, end);

            let data = {
                result_code: 0, 
                posts: posts.length && posts || [],
            };

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end( JSON.stringify(data) );

            }else{
                res.end( JSON.stringify({result_code: 1, message: 'this user was not found'}) );
            };
        })
        .catch( err => {
            if(err) throw (err);
            res.end( JSON.stringify({result_code: 1, message: err.message}) );
        })

};

let createPost = (req, res) => {


    try{
        let form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {

            let oldpath = files.image['path'];
            let name = `${Math.floor(Math.random() * 100000)}.` + files.image['name'].split('.')[1];
            console.log('name png files created' + name);
            let newpath = __dirname + '/../../images/posts/' + name;

            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;

                let routs = url.parse(req.url, true).pathname.split('/')
                    .filter(rout => rout !== '' );

                    User.findById(routs[1])
                        .exec()
                        .then(user => {
                            if(user === null){
                                res.end( JSON.stringify({result_code: 1, message: 'this user was not found'}) );

                                return;
                            }else{
                                let post_id = Math.floor( (Math.random() + Math.random()) * 1000000);

                                let post = {
                                    date: +new Date(), 
                                    text: fields.text,
                                    picture: `${base_address}profile/${routs[1]}/post/${post_id}/picture/${name}`,
                                    likes: [],
                                    id: post_id, 
                                    comments: [],
                                };
                                let posts = user.posts;
                                posts.push(post);

                                User.findByIdAndUpdate(routs[1], {posts})
                                    .then(
                                        user => {
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.end( JSON.stringify({
                                                result_code: 0, message: 'Post success added',
                                                post}) );
                                        },
                                    );
                            }
                        }).catch(err => {
                            res.end( JSON.stringify({result_code: 1, message: err.message}) );
                        });
                });
            });
    }catch(e){
        console.log(e.message);
    };
};

const getPostPicture = (req, res) => {

    let routs = url.parse(req.url, true).pathname.split('/');
    console.log(routs);
    let path = __dirname + '/../../images/posts/' + routs.slice(-1);
    fs.readFile(path, (err, data) => {
        //if (err) throw err;
        res.end(data);
    }); 
};

const likedPost = (req, res) => {
    let routs = url.parse(req.url, true).pathname.split('/').filter(rout => rout !== '');
    User.findById(routs[1])
        .exec()
        .then(user => {

            if(user === null){
                res.end( JSON.stringify({result_code: 1, message: 'this user was not found'}) );
            }else{

                let posts = user.posts.map(post => {
                    if(+post.id != +routs[3]){
                        return post;
                    }else{
                        if(post.likes.includes(req.headers.id)){
                            post.likes = post.likes.filter(id => id != req.headers.id);
                        }else{
                            post.likes.push(req.headers.id);
                        };
                        console.log(post.id);
                        return post;
                    }
                });

                User.findByIdAndUpdate(routs[1], {posts})
                    .exec()
                    .then(old_user_data => {
                        let post = user.posts.find(post => post.id === +routs[3]);
                        res.end(JSON.stringify({
                            result_code: 0, message: 'successfully',
                            post,
                        }) )
                    });
            };
        });
};

const deletePost = (req, res) => {
    console.log('Deleted post');
    let routs = url.parse(req.url, true).pathname.split('/').filter(rout => rout !== '');
    User.findById(req.headers.id)
        .exec()
        .then(user => {
            if(user) {
                let posts = user.posts.filter(post => {
                    if(post.id != routs[3]){
                        return true;
                    }else{
                        let file_name = post.picture.split('/').splice(-1)[0];
                        console.log('deleted file: ' + file_name);
                        let path = __dirname + '/../../images/posts/' + file_name;

                        fs.unlink(path, err => {
                            err && console.log('Deleted error: ' + err.message);
                        });
                        return false;
                    }
                });
                console.log('Post count: ' + posts.length);

                User.findByIdAndUpdate(req.headers.id, {posts})
                    .exec()
                    .then(user => {

                        let message = `post id=${routs[3]} successfully deleted`;
                        console.log(message);
                        res.end();
                    });
            }else{
                res.writeHead(500);
            }
        });
};



module.exports = {
    create,
    getOne: authMiddleware(getOneAuthorized, getOne),
    getUsers: authMiddleware(getUsersAuthorized, getUsers),
    update,
    follow: authMiddleware(follow),
    unfollow: authMiddleware(unfollow),
    getPosts,
    createPost: authMiddleware(createPost),
    likedPost: authMiddleware(likedPost),
    deletePost: authMiddleware(deletePost),
    getPostPicture,
};
