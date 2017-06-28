const path = require('path')
, express = require('express')
, session = require('./src/session')
, ssdb = require('./src/ssdb')
, bodyParser = require('body-parser')
, jwt = require('jsonwebtoken')
, config = require('config')

const PORT = config.httpPort;

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());


// authorization is done via json web tokens

// decode jwt token if we find one, and store in the req as "session"
app.use( (req, resp, next) => {

    if (req.headers &&
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'JWT') {

        jwt.verify(req.headers.authorization.split(' ')[1],
                   'SERVER_SECRET',
                   (err, decode) => {
                       if (err) {
                           req.session = undefined;
                       } else {
                           req.session = decode;
                       }
                       next();
                   }
                  );
    } else {
        req.session = undefined;
        next();
    }
});

app.use(express.static('public'));

// a default route for '/'

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// express middleware. Do we have a valid session?
// only continue if yes

const isAuthenticatedUser = (req, resp, next) => {

    if ( req.session ) {
        next();
    } else {
        resp.status(401).json("not authenticated");
    }
}


// create and return a session token if successful
app.post('/api/authenticate', (req, resp) => {

    ssdb.loginUser(req.body.username, req.body.secret)
        .then( (data) => {
            resp.json({token: jwt.sign(data.jwt, 'SERVER_SECRET', { expiresIn: '30m'}),
                       refreshToken: data.refreshToken
                      });
        })
        .catch( (err) => {
            resp.status(401).json("not authenticated");
        });
});

// create and return a session token if successful
app.post('/api/refreshToken', (req, resp) => {

    ssdb.refreshUser(req.body.userID, req.body.refreshToken)
        .then( (data) => {
            resp.json({token: jwt.sign(data.jwt, 'SERVER_SECRET', { expiresIn: '30m'}),
                       refreshToken: data.refreshToken
                      });
        })
        .catch( (err) => {
            resp.status(401).json("not allowed");
        });
});

// N.B. vulnerable to DDOS
// create a new user
app.post('/api/register', (req, resp) => {
    
    ssdb.registerUser(req.body.username,
                      req.body.secret,
                      JSON.stringify(req.body.wrapped_master))
        .then( (data) => {
            resp.json(data);
        })
        .catch( (err) => {
            resp.status(400).json("cannot register");
        });
});

// change the user's secret(s)
app.post('/api/changeSecret', isAuthenticatedUser, (req, resp) => {

    ssdb.changeUserSecret(req.session.userID,
                          req.session.userName,
                          req.body.oldSecret,
                          req.body.newSecret,
                          JSON.stringify(req.body.wrapped_master))
        .then( (data ) => {
            resp.json('true');
        })
        .catch( (err) => {
            resp.status(400).json("cannot change secret");
        });
});

// create and return a session token if successful
app.post('/api/refreshToken', (req, resp) => {

    ssdb.refreshUser(req.body.userID, req.body.refreshToken)
        .then( (data) => {
            resp.json({token: jwt.sign(data.jwt, 'SERVER_SECRET', { expiresIn: '30m'}),
                       refreshToken: data.refreshToken
                      });
        })
        .catch( (err) => {
            resp.status(401).json("not allowed");
        });
});

// create and return a session token if successful
app.get('/api/u/:user/key', isAuthenticatedUser, (req, resp) => {

    if (req.session.userID === req.params.user) {
        ssdb.userData(req.params.user)
            .then( (data) => {

                resp.json({
                    wrapped_master: data.wrapped_master,
                    last_update: data.last_update
                });
            })
            .catch( (err) => {
                resp.status(401).json("not allowed");
            });
    } else {
        resp.status(403).json("not authorized");
    }
    
});


app.post('/api/logout', isAuthenticatedUser, (req, resp) => {
    
    if ( session.closeSession(req.query.refreshToken) ) {
        resp.json("true");
    } else {
        resp.status(403).json("cannot logout");
    }
});


// card routes ...

// get a single card record
app.get('/api/u/:user/c/:card', isAuthenticatedUser, (req, resp) => {
    
    // if authorized user is card's owner
    if (req.session.userID === req.params.user) {
        ssdb.getCard(req.params.card, req.params.user)
            .then( (data) => {
                resp.json(data);
            })
            .catch( (err) => {
                resp.status(404).json("not found");
            });
    } else {
        resp.status(403).json("not authorized");
    }
});

// delete a card
app.delete('/api/u/:user/c/:card', isAuthenticatedUser, (req, resp) => {

    if (req.session.userID === req.params.user) {
        ssdb.deleteCard(req.params.card, req.params.user, (err, data) => {
            if (err) {
                resp.status(404).json("not found");
            } else {
                resp.json(data);
            }
        });
    } else {
        resp.status(403).json("not authorized");
    }
});

// creates or updates a card record
app.put('/api/u/:user/c/:card', isAuthenticatedUser, function(req, resp) {

    if (req.session.userID === req.params.user) {

        ssdb.addOrUpdateCard(req.params.user,
                             req.params.card,
                             req.body.version,
                             JSON.stringify(req.body.encrypted))
            .then( (data) => {
                resp.json(data);
            })
            .catch( (err) => {
                resp.status(400).json('failed');
            });
    } else {
        resp.status(403).json("not authorized");
    }

});


// return a list of cards for that user
app.get('/api/u/:user/c',  isAuthenticatedUser, function(req, resp) {
    const { since = null, skip = 0, count = 999 } = req.query;

    if (req.session.userID === req.params.user) {
        ssdb.listCards(req.params.user, since, skip, count)
            .then( (data) => {
                
                const cards = data.map( card => { return { id: card.card_id,
                                                           version: card.last_update,
                                                           encrypted: JSON.parse(card.data_blob) };
                                                });
                resp.json({ meta: {}, cards: cards} );
            })
        
            .catch( (err) => {
                resp.status(400).json("failed");
            });

    } else {
        resp.status(403).json("not authorized");
    }
});


if (!module.parent) {
    app.listen(PORT);

    console.log("syncserver listening on port %d", PORT);
}

console.log("env:", process.env.NODE_ENV);

// for testing with chai-http:
module.exports = app;
