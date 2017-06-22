const path = require('path')
, express = require('express')
, session = require('./src/session')
, ssdb = require('./src/ssdb')
, bodyParser = require('body-parser')
, jwt = require('jsonwebtoken')

const PORT = 8000

var app = express()

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

// decode jwt token if we find one, and store in the req as "session"
app.use( (req, resp, next) => {

  if (req.headers &&
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'JWT') {

    jwt.verify(req.headers.authorization.split(' ')[1],
               'SERVER_SECRET',
               (err, decode) => {
                 if (err) {
                   //                   console.log("CANNOT DECODE")
                   req.session = undefined;
                 } else {
                   //                   console.log("DID DECODE:", decode);
                   req.session = decode;
                 }
                 next();
               }
              );
  } else {
    req.session = undefined;
    next()
  }
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

// express middleware. Do we have a valid session?
// only continue if yes

const isAuthenticatedUser = (req, resp, next) => {

  if ( req.session ) {
    next();
  } else {
    resp.status(401).send('"not authenticated"')
  }
}


// create and return a session token if successful
app.post('/api/authenticate', (req, resp) => {

  ssdb.loginUser(req.body.username, req.body.secret, (err, data) => {
    if (err) {
      resp.status(401).send('"not authenticated"')
      return
    }

    resp.json({token: jwt.sign(data, 'SERVER_SECRET')})

  })
})

// N.B. vulnerable to DDOS
// create a new user
app.post('/api/register', (req, resp) => {

  resp.setHeader('Content-Type', 'application/json');
  ssdb.registerUser(req.body.username,
                    req.body.secret,
                    JSON.stringify(req.body.wrapped_master), (err, data) => {
                      if (err) {
                        console.log(err)
                        resp.status(400).send('"cannot register"')
                        return
                      }
                      resp.json(data)
                    })
})

// change the user's secret(s)
app.post('/api/changeSecret', isAuthenticatedUser, (req, resp) => {

  ssdb.changeUserSecret(req.session.user,
                        req.body.secret,
                        JSON.stringify(req.body.wrapped_master),
                        (err, data) => {
                          if (err) {
                            console.log(err)
                            resp.status(400).send("cannot change secret")
                            return
                          }
                          resp.json('true')
                        })
})
         
app.post('/api/logout', isAuthenticatedUser, (req, resp) => {
  
  if ( session.closeSession(req.session.token) ) {
    resp.json("true")
  } else {
    // this shouldn't happen
    resp.status(403).send('"cannot logout"')
  }
})
         
// get a single card record
app.get('/api/u/:user/c/:card', isAuthenticatedUser, (req, resp) => {

  //  console.log("req.session:", req.session);
  // if authorized user is card's owner
  if (req.session.user === req.params.user) {
    ssdb.getCard(req.params.card, req.params.user, (err, data) => {
      if (err) {
        resp.status(404).send('"not found"')
        return
      }
      resp.json(data)
    })
  } else {
    resp.status(403).send('"not authorized"')
  }
})

// delete a card
app.delete('/api/u/:user/c/:card', isAuthenticatedUser, (req, resp) => {

  if (req.session.user === req.params.user) {
    ssdb.deleteCard(req.params.card, req.params.user, (err, data) => {
      if (err) {
        resp.status(404).send("not found")
        return
      }
      resp.json(data)
    })
  } else {
    resp.status(403).send("not authorized")
  }
});

// creates or updates a card record
app.put('/api/u/:user/c/:card', isAuthenticatedUser, function(req, resp) {

  if (req.session.user === req.params.user) {
    //    console.log("PUT -- req.body:", req.body)
    ssdb.addOrUpdateCard(req.params.card, req.params.user,
                         req.body.version,
                         JSON.stringify(req.body.encrypted),
                         (err, data) => {
                           //                      console.log("PUT -- err:", err, "data:", data)
                           if (err) {
                             // console.log(err)
                             resp.status(400).send('"failed"')
                             return
                           }
                           resp.json(data)
                         })
  } else {
    resp.status(403).send('"not authorized"')
  }
});


// return a list of cards for that user
app.get('/api/u/:user/c',  isAuthenticatedUser, function(req, resp) {
  const { since = null } = req.query
  //  console.log("since:", since, "query:", req.query)
  if (req.session.user === req.params.user) {
    ssdb.listCards(req.params.user, since, (err, data) => {
      if (err) {
        console.log(err)
        resp.status(400).send('"failed"')
        return
      }
      const list = data.map( card => { return { id: card.card_id,
                                                version: card.last_update,
                                                encrypted: JSON.parse(card.data_blob) } })
      resp.json(list)
    })
  } else {
    resp.status(403).send('"not authorized"')
  }
});


if (!module.parent) {
  app.listen(PORT);
  console.log("syncserver listening on port %d", PORT);
}

// for testing with chai-http:
module.exports = app;
