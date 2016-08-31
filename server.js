const path = require('path')
, express = require('express')
, session = require('./src/session')
, ssdb = require('./src/ssdb')
, bodyParser = require('body-parser')

const PORT = 8000

var app = express()

// parse application/x-www-form-urlencoded 
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
  console.log("isAuthenticated: body:", req.body);
  sessionTok = req.query.session || req.params.session || req.body.session
  sessionUser = session.sessionUser(sessionTok)
  if ( session.sessionUser(sessionTok) ) {
    req["session"] = { user: sessionUser, token: sessionTok }
    next();
  } else {
    resp.status(401).send("not authenticated")
  }
}

// ensure the owner of the session token owns the resource
const ifAuthorizedUser = (authorizedUser, cb) => {
  if (authorizedUser === req.session.user) {
    cb(null, true)
  } else {
    cb("not authorized", false)
  }
}

// create and return a session token if successful
app.post('/api/authenticate', (req, resp) => {

  console.log(req.body)
  ssdb.loginUser(req.body.username, req.body.secret, (err, data) => {
    if (err) {
      resp.status(400).send("sorry")
      return
    }
    console.log("got session:", data, { session: data })
    resp.setHeader('Content-Type', 'application/json');
    resp.status(200).send(JSON.stringify({ session: data }))
  })
})

// create a new user
app.post('/api/register', (req, resp) => {
  console.log(req.body)
  resp.setHeader('Content-Type', 'application/json');
  ssdb.registerUser(req.body.username,
                req.body.secret,
                JSON.stringify(req.body.wrapped_master), (err, data) => {
                  if (err) {
                    console.log(err)
                    resp.status(400).send("cannot register")
                    return
                  }
                  resp.status(200).send(JSON.stringify(data))
                })
})

// change the user's secret(s)
app.post('/api/changeSecret', isAuthenticatedUser, (req, resp) => {

  console.log("changeSecret:", req.body);
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
    resp.status(403).send("cannot logout")
  }
})
         
app.get('/api/u/:user/c/:card', isAuthenticatedUser, (req, resp) => {
  // get a single card record

  ifAuthorizedUser(req.query.session, req.params.user, (err) => {
    if (err) {
      console.log( err)
      resp.status(403).send("not authorized")
      return
    }
    ssdb.getCard(req.params.card, req.params.user, (err, data) => {
      if (err) {
        console.log("failed get", err)
        resp.status(404).send("not found")
        return
      }
      resp.send(JSON.stringify(data))
    })
  })
})
  
app.delete('/api/u/:user/c/:card', isAuthenticatedUser, (req, resp) => {
  ifAuthorizedUser(req.query.session, req.params.user, (err) => {
    if (err) {
      console.log( err)
      resp.status(403).send("not authorized")
      return
    }
    ssdb.deleteCard(req.params.card, req.params.user, (err, data) => {
      if (err) {
        console.log("failed get", err)
        resp.status(404).send("not found")
        return
      }
      resp.send(JSON.stringify(data))
    })
  })
});

app.put('/api/u/:user/c/:card', isAuthenticatedUser, function(req, resp) {
  // creates a new card record
  console.log("add card", req.body)
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
    console.log(`req.session.user: ${req.session.user} != req.params.user: ${req.params.user}`)
    resp.status(403).send('"not allowed"')
  }
});

app.post('/api/u/:user/c/:card', isAuthenticatedUser, function(req, resp) {
  // update an card record
  // creates a new card record
  console.log("update card", req.body)
  resp.send('true')  
});

app.get('/api/u/:user/c',  isAuthenticatedUser, function(req, resp) {
  // return a list of cards for that user
  console.log("list cards", req.query.since)
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
    console.log(`req.session.user: ${req.session.user} != req.params.user: ${req.params.user}`)
    resp.status(403).send('"not allowed"')
  }
});


if (!module.parent) {
  app.listen(PORT);
  console.log("syncserver listening on port %d", PORT);
}

