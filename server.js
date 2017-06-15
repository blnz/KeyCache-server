const path = require('path')
, express = require('express')
, session = require('./src/session')
, ssdb = require('./src/ssdb')
, bodyParser = require('body-parser')
, jwt = require('jsonwebtoken')

const PORT = 8000

var app = express()

app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json 
app.use(bodyParser.json())

// decode jwt token if we find one, and store in the req as "session"
app.use( (req, resp, next) => {
  if (req.headers &&
      req.headers.authentication &&
      req.headers.authentication.split(' ')[0] === 'JWT') {

    jwt.verify(req.headers.verify(req.headers.authentication.split(' ')[1],
                                  'SERVER-SECRET',
                                  (err, decode) => {
                                    if (err) {
                                      req.session = undefined;
                                    } else {
                                      console.log(decode);
                                      req.session = decode;
                                    }
                                    next();
                                  }
                                 ));
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

    resp.json({token: jwt.sign({ data }, 'SERVER_SECRET')})

  })
})

// FIXME: handle ddos attacks
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
                      resp.status(200).send(JSON.stringify(data))
                    })
})

// change the user's secret(s)
app.post('/api/changeSecret', isAuthenticatedUser, (req, resp) => {

  ssdb.changeUserSecret(req.session.user,
                        req.body.secret,
                        JSON.stringify(req.body.wrapped_master), (err, data) => {
                          if (err) {
                            console.log(err)
                            resp.status(400).send("cannot change secret")
                            return
                          }
                          resp.setHeader('Content-Type', 'application/json');
                          resp.status(200).send(JSON.stringify('true'))
                        })
})
         
app.post('/api/logout', isAuthenticatedUser, (req, resp) => {
  
  if ( session.closeSession(req.session.token) ) {
    resp.setHeader('Content-Type', 'application/json');
    resp.status(200).send("true")
  } else {
    // this shouldn't happen
    resp.status(403).send('"cannot logout"')
  }
})
         
// get a single card record
app.get('/api/u/:user/c/:card', isAuthenticatedUser, (req, resp) => {

  if (req.session.user === req.params.user) {
    ssdb.getCard(req.params.card, req.params.user, (err, data) => {
      if (err) {
        console.log("failed get", err)
        resp.status(404).send('"not found"')
        return
      }
      resp.send(JSON.stringify(data))
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
        console.log("failed get", err)
        resp.status(404).send("not found")
        return
      }
      resp.send(JSON.stringify(data))
    })
  } else {
    resp.status(403).send("not authorized")
  }
});

// creates a new card record
app.put('/api/u/:user/c/:card', isAuthenticatedUser, function(req, resp) {

  if (req.session.user === req.params.user) {
    ssdb.createCard(req.params.card, req.params.user,
                    JSON.stringify(req.body.encrypted), (err, data) => {
                      if (err) {
                        console.log(err)
                        resp.status(400).send('"failed"')
                        return
                      }
                      resp.status(200).send(JSON.stringify(data))
                    })
  } else {
    resp.status(403).send('"not authorized"')
  }
});

// update an card record
app.post('/api/u/:user/c/:card', isAuthenticatedUser, function(req, resp) {

  if (req.session.user === req.params.user) {
    console.log("update card", req.body)
    resp.send('true')
  } else {
    resp.status(403).send('"not authorized"')
  }
});

// return a list of cards for that user
app.get('/api/u/:user/c',  isAuthenticatedUser, function(req, resp) {

  if (req.session.user === req.params.user) {
    ssdb.listCards(req.params.user, null, (err, data) => {
      if (err) {
        console.log(err)
        resp.status(400).send('"failed"')
        return
      }
      const list = data.map( card => { return { id: card.card_id,
                                                version: card.last_update,
                                                encrypted: JSON.parse(card.data_blob) } })
      
      resp.status(200).send(JSON.stringify(list))
    })
  } else {
    resp.status(403).send('"not authorized"')
  }
});


if (!module.parent) {
  app.listen(PORT);
  console.log("syncserver listening on port %d", PORT);
}

module.exports = app;
