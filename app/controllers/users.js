const url = require('url');
const fs = require('fs');
const mongoose = require('mongoose');
const formidable = require('formidable');
const { v4: uuidv4 } = require('uuid');


const User = mongoose.model('User');
const Dialog = mongoose.model('Dialog');
const authMiddleware = require('../middleware/auth.js');
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
          info: user.info,
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
          info: user.info,
          dialogs: user.dialogs,
          result_code: 0,
        };
        res.end(JSON.stringify({data: data}));
      }else{
        res.writeHead(401, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'this user was not found', result_code: 1}));
      };
    })
    .catch(err => {
      console.log(err.message);
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end(JSON.stringify({message: err.message, result_code: 1}));
    });
};

// *** requiring authorization ***


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
          info: user.info,
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
          info: user.info,
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
      if( data[0].subscribers.map(user => user.id).includes(req.headers.id) ){
        let subscribers = data[0].subscribers
          .filter(user => {
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

      if(user) {

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

const getLikersPost = (req, res) => {

  let {user_id, post_id} = url.parse(req.url, true).query;

  try {
    User.findById(user_id).exec()
      .then(user => {
        if(user) {
          let likers = user.posts.find(post => post.id == post_id).likes;
          if(Array.isArray(likers)) {
            users = likers.map(id => {
              return User.findById(id).exec()
                .then(user => {
                  if(!user) user = {};
                  return {
                    name: user.name,
                    id: user._id,
                    photos: user.photos,
                    subscribed_to: user.subscribed_to,
                    email: user.email,
                    subscribers: user.subscribers,
                    info: user.info,
                    result_code: 0,
                  };

                });
            });
            Promise.all(users)
              .then(users => {
                let data = {
                  users,
                  result_code: 0,
                };
                res.end(JSON.stringify(data));
              });
          }else{
            res.writeHead(401, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({message: 'this post was not found', result_code: 1}));
          }

        }else{
          res.writeHead(401, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({message: 'this user was not found', result_code: 1}));
        }
      })
      .catch(err => {
        console.log(err.message);
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(JSON.stringify({message: err.message, result_code: 1}));
      });
  }catch(err) {
    console.log(err.message);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end(JSON.stringify({message: err.message, result_code: 1}));
  }
}

let createPost = (req, res) => {


  try{
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      if(files.image) {
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
                  text: fields.text == 'undefined'? '': fields.text,
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
      }else{
        res.end( JSON.stringify({
          result_code: 1,
          message: 'sends posts dos`nt photo exists'
        }) );
      }
    });
  }catch(e){
    console.log(e.message);
  };
};

const getPostPicture = (req, res) => {

  console.log('getPostPicture');
  let routs = url.parse(req.url, true).pathname.split('/');
  let path = __dirname + '/../../images/posts/' + routs.slice(-1);
  fs.readFile(path, (err, data) => {
    //if (err) throw err;
    res.end(data);
  }); 
};

const getAvatarPicture = (req, res) => {

  console.log('getAvatarPicture');
  let routs = url.parse(req.url, true).pathname.split('/');
  let path = __dirname + '/../../images/avatars/' + routs.slice(-1);
  fs.readFile(path, (err, data) => {
    //if (err) throw err;
    res.end(data);
  }); 
};

const getAvatarPicture2 = (req, res) => {
  console.log('GET USER`S AVATAR');

  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(rout => rout != '');

  User.findById(routs[1]).exec()
    .then(user => {
      if(user) {
        let path = __dirname + '/../../images/avatars/' 
          + user.photos.small.split('/')
          .slice(-1).filter(item => item != '');
        fs.readFile(path, (err, data) => {
          if(err){
            res.end('');
          }else{
            res.end(data);
          };
        });
      } else {
        res.end(JSON.stringify({message: 'user was not found',
          result_code: 1 }) );
      };
    });
}


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
            console.log(post.id + ' liked by ' + user.id);
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

const profileUpdate = (req, res) => {
  console.log('profile update !!!');
  let routs = url.parse(req.url, true).pathname.split('/').filter(rout => rout !== '');
  let form = new formidable.IncomingForm();

  form.parse(req, function (err, fields, files) {

    let oldpath = '', newpath = '', name = '';
    if( Object.keys(files).length ){
      oldpath = files.image['path'];
      name = `${Math.floor(Math.random() * 1000000000000000)}.` + files.image['name'].split('.')[1];
      newpath = __dirname + '/../../images/avatars/' + name;
    };

    fs.rename(oldpath, newpath, function (err) {

      User.findById(req.headers.id)
        .exec()
        .then(user => {

          //delete old avatar
          let file_name = user.photos.small.split('/').splice(-1)[0];
          console.log('deleted file: ' + file_name);
          let path = __dirname + '/../../images/avatars/' + file_name;

          fs.unlink(path, err => {
            err && console.log('Deleted error: ' + err.message);
          });

          let photos = user.photos;
          if( Object.keys(files).length ) {
            photos.small = `${base_address}profile/${routs[1]}/photos/small/${name}`;
          }

          let info = {};
          Object.assign(info, fields);
          info = [info];

          let options = {
            photos,
            info,
          }
          User.findByIdAndUpdate(req.headers.id, options)
            .exec()
            .then(user => {
              if(user){
                res.end(JSON.stringify({result_code: 0, message: 'User data was been successfully updated'}) );
              }else{
                res.end(JSON.stringify({result_code: 1, message: 'this user does not exist'}) );
              };
            }).catch(err => {
              console.log(err);
              res.writeHead(500, {'Content-Type': 'text/plain'});
              res.end(JSON.stringify(err));
            });
        });
    });
  });
}

//dialogs

const getDialogs = (req, res) => {

  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(rout => rout != '');
  console.log('GET DIALOGS: ' + routs[1]);

  User.findById(routs[1]).exec()
    .then(user => {
      if(user){
        let dialogs = user.dialogs;
        console.log('DIALOG COUNT :' + dialogs);
        // dialogs = dialogs.filter(item => item != '602001e445452eca905fbfed');
        // dialogs = dialogs.filter(item => item != '601ff65645452eca905fbfea');
        // dialogs = dialogs.filter(item => item != '601ab975ec457513035d1935');
        // dialogs = dialogs.filter(item => item != '601ab96fec457513035d1934');
        // dialogs = dialogs.filter(item => item != '601ff7d045452eca905fbfeb');
        // dialogs = dialogs.filter(item => item != '601ff99b45452eca905fbfec');
        // dialogs = dialogs.filter(item => item != '601f2885bf439f7603903192');
        // dialogs = dialogs.filter(item => item != '601f27367ad5f46a463f7ec9');
        // User.findByIdAndUpdate(routs[1], {dialogs}).exec()
        //   .then(user => {
        dialogs = dialogs.map(dialog_id => {
          return Dialog.findById(dialog_id).exec()
            .then(dialog => {
              if(dialog) {
                let user_id;
                if(dialog.user_id1 === routs[1])
                  user_id = dialog.user_id2;
                else
                  user_id = dialog.user_id1;
                //console.log(dialog);
                return User.findById(user_id).exec()
                  .then(user => {
                    console.log('/////////////');
                    //console.log(user);
                    //console.log(dialog);
                    console.log('/////////////');
                    return {
                      dialog_id: dialog._id,
                      lastMessage: dialog.messages[dialog.messages.length -1],
                      user_id,
                      user_avatar: user.photos.small,
                      user_name: user.name,
                      dateLastModified: dialog.dateLastModified,
                    };
                  });
              }
            })
        });
        Promise.all([...dialogs])
          .then(dialogs => {

            //console.log(dialogs);
            let data = {
              result_code: 0,
              dialogs,
            };
            //console.log('DIALOGS :' + dialogs);
            res.end(JSON.stringify({
              data,
            }) );
          });
        //  })
      }else {
        res.end(JSON.stringify({result_code: 1, message: 'this user does not exist'}) );
      };
    });
}

const sendMessage = (req, res) => {

  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(rout => rout != '');

  let bodyData = '';
  req.on('data', chunk => {
    console.log(chunk);
    bodyData += chunk;
  });

  try {
  new Promise( (res, rej) => {
    req.on('end', () => {
      console.log(bodyData);
      bodyData = JSON.parse(bodyData);
      bodyData.message && console.log('MESSAGE TEXT :' + bodyData.message.text);
      res();
    })
  }).then(data => {
    return Promise.all([
      User.findById(routs[1]).exec()
      .then(user => Promise.resolve(user)),
      User.findById(routs[3]).exec()
      .then(user => Promise.resolve(user)),
    ])
  }).then(data => {
    user = data[0];
    user2 = data[1];

    return new Promise ( (resolve, reject) => {

      let jointDialog = false;
      let jointDialogId = '';
      user.dialogs.forEach(item => {
        if(jointDialog) return;
        let jointDialogIndex = user2.dialogs.indexOf(item);
        console.log('IS jointDialogIndex :' + jointDialogIndex);
        if(~jointDialogIndex) {
          console.log('DIALOG IS INSTEAD');
          jointDialog = true;
          jointDialogId = user2.dialogs[jointDialogIndex];
        };
      });
      if(jointDialog){
        Dialog.findById(jointDialogId).exec()
          .then(dialog => {
            resolve(dialog)
          });
      } else {
        Dialog.create({
          user_id1: user.id,
          user_id2: user2.id,
          messages: [],
          date: new Date(),
          dateLastModified: new Date(),
        }).then(dialog => {
          Promise.all([

            User.findByIdAndUpdate(routs[1], 
              {dialogs: user.dialogs.concat(dialog._id)}
            ).exec().then(),
            User.findByIdAndUpdate(routs[3], 
              {dialogs: user2.dialogs.concat(dialog._id)}
            ).exec().then(),


          ]).then(res => {
            console.log('CREATE NEW DIALOG');
            resolve(dialog);
          });
        });
      }
    });
  }).then(dialog => {
    let isBodyData = bodyData.message.text;
    console.log('isbodydata: ' + isBodyData);
    if(isBodyData){
      let messages = dialog.messages;
      messages.push({
        id: uuidv4(),
        userId: routs[1],
        text: isBodyData, 
        read: false,
        date: new Date(),
      });
      return Dialog.findByIdAndUpdate(dialog._id, {messages, dateLastModified: new Date()}).exec()
        .then(dialog => {
          console.log('ADD NEW MESSAGE TO DIALOG: ' + dialog._id);
          return dialog;
        })
    } else {
      console.log('MESSAGE IS EMPTY');
      return dialog;
    }
  }).then(dialog => {
    // console.log(user.dialogs);
    // console.log(user2.dialogs);
    Dialog.find().then(dialogs => {
      //console.log('DIALOGS ' + dialog)
    });

    // User.findByIdAndUpdate(routs[1], 
    //   {dialogs: []}
    // ).exec().then();
    // User.findByIdAndUpdate(routs[3], 
    //   {dialogs: []}
    // ).exec().then();
    //
    // Dialog.remove({}, ()=>{});

    console.log('SEND REQUEST');
    res.end(JSON.stringify({
      result_code: 0,
      id: dialog._id,
      user_id: routs[3],
    }));
  });
  } catch (e) {
    console.log(e.mess);
  }
}


const getDialog = (req, res) => {

  let routs = url.parse(req.url, true).pathname.split('/')
    .filter(rout => rout != '');

  console.log('GET DIALOG');
  console.log(req.url);
  Dialog.findById(routs[3]).exec()
    .then(dialog => {
      if(dialog) {
      let user_id = routs[1] === dialog.user_id1 ? dialog.user_id2: dialog.user_id1;
      if(dialog.messages.length)
        console.log('LAST MESSAGE: ' + dialog.messages[dialog.messages.length -1].text);
      User.findById(user_id).exec()
        .then(user => {
          let data = {
            result_code: 0,
            dialog_id: dialog._id,
            user_id,
            date: dialog.date,
            dateLastModified: dialog.dateLastModified,
            messages: dialog.messages,
            user_avatar: user.photos.small,
            user_name: user.name,
          };
          res.end(JSON.stringify({data}) );
        });
      } else {
        res.end(JSON.stringify({data: {result_code: 1}}));
      }
    });
}

const deleteDialog = (req, res) => {

  const routs = url.parse(req.url, true).pathname.split('/')
    .filter(rout => rout != '');
  console.log('DELETE_DIALOG');
  console.log(routs);
  Dialog.findByIdAndRemove(routs[3]).exec()
    .then(dialog => {
      console.log(dialog);
      Promise.all([
        User.findById(dialog.user_id1).exec()
        .then(user => {
          console.log(user);
          let dialogs = user.dialogs.filter(dialog_id => dialog_id != routs[3]);
          console.log(routs[3]);
          console.log(dialogs);
          User.findByIdAndUpdate(user._id, {dialogs}).exec()
            .then(res => {
              console.log(res);
              return res;
            })
        }),
        User.findById(dialog.user_id2).exec()
        .then(user => {
          let dialogs = user.dialogs.filter(dialog_id => dialog_id != routs[3]);
          User.findByIdAndUpdate(user._id, {dialogs}).exec()
            .then(res => res);
        }),
      ]).then(resolve => {
        let user_id1 = resolve[0],
          user_id2 = resolve[1];
        let data = {
          result_code: 0,
        };
        res.end(JSON.stringify({data}));
      });
    });
}

const readMessages = (req, res) => {
  const routs = url.parse(req.url, true).pathname.split('/')
    .filter(rout => rout != '');
  console.log('READ MESSAGES');
  console.log(routs);

  let bodyData = '';
  req.on('data', chunk => {
    console.log(chunk);
    bodyData += chunk;
  });

  new Promise( (resolve, reject) => {
    req.on('end', () => {
      console.log(bodyData);
      bodyData = JSON.parse(bodyData);
      if(bodyData.messages && bodyData.messages.length)
        resolve(bodyData.messages);
      else reject();
    })
  }).then(messages => {
    return Dialog.findById(routs[3]).exec()
      .then(dialog => {
        return Dialog.findByIdAndUpdate(routs[3], 
          {messages: dialog.messages.map(mess => 
            messages.find(item => mess.dialog_id === item.dialog_id)? {...mess, read: true}: mess),
          })
      })
  },
    () => {
     // res.end(JSON.stringify({data: {result_code: 1}}));
    }
  ).then(resolve => {
      res.end(JSON.stringify({data: {result_code: 0}}));
  });

  console.log('READ MESSAGES');
  //res.end(JSON.stringify({data: {result_code: 0}}));
}

module.exports = {
  getOne: authMiddleware(getOneAuthorized, getOne),
  getUsers: authMiddleware(getUsersAuthorized, getUsers),
  //follow
  follow: authMiddleware(follow),
  unfollow: authMiddleware(unfollow),
  //posts
  getPosts,
  getLikersPost,
  createPost: authMiddleware(createPost),
  likedPost: authMiddleware(likedPost),
  deletePost: authMiddleware(deletePost),
  getPostPicture,
  //message
  getDialogs: authMiddleware(getDialogs),
  getDialog: authMiddleware(getDialog),
  sendMessage: authMiddleware(sendMessage),
  deleteDialog: authMiddleware(deleteDialog),
  readMessages: authMiddleware(readMessages),
  //commons
  getAvatarPicture,
  getAvatarPicture2,
  profileUpdate: authMiddleware(profileUpdate),
};
