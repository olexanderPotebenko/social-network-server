const jwt = require('jsonwebtoken');
const {secret_jwt} = require('../../config/app');

module.exports = (authorizedFunc, unAuthorizedFunc) => {

    return function (req, res) {
        let token = req.headers.authorize;

        console.log(req.headers);
        console.log(token);
        if( !(token) ){
            if(unAuthorizedFunc){
                unAuthorizedFunc(req, res);
            }else{
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify( {result_code: 1, 
                    mssage: 'necessary data not provided'} ));
            };
        }else{
            try{
                jwt.verify(token, secret_jwt);
                authorizedFunc(req, res);
            }catch(e) {
                console.log(e.message);
        console.log('!!!' + req.headers);
        console.log('!!!' + token);
                if(e.name === 'JsonWebTokenError'){
                    res.writeHead(501, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: e.message, result_code: 1}));
                };

            };
        };
    };

};
