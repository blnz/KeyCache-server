const path = require('path')
, express = require('express')
, session = require('./src/session')
, ssdb = require('./src/ssdb')
, bodyParser = require('body-parser')

const PORT = 8000

var app = express()

app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json 
app.use(bodyParser.json())

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

// express middleware. Do we have a valid session token?
// if so, inject session user and token into the request

const isAuthenticatedUser = (req, resp, next) => {

  sessionTok = req.query.session || req.params.session || req.body.session
  sessionUser = session.sessionUser(sessionTok)
  if ( session.sessionUser(sessionTok) ) {
    req["session"] = { user: sessionUser, token: sessionTok }
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
    resp.setHeader('Content-Type', 'application/json');
    resp.status(200).send(JSON.stringify({ session: data }))
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

