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
  console.log("get /")
  path = "index.html"
  res.sendFile(__dirname + '/public/' + path)
});

// express middleware. Do we have a valid session token?
// if so, inject session user and token into the request
const isAuthenticatedUser = (req, resp, next) => {
  console.log("isAuthenticated: body:", req.body);
  sessionTok = req.query.session || req.param.session || req.body.session
  sessionUser = session.sessionUser(sessionTok)
  if ( session.sessionUser(sessionTok) ) {
    req["session"] = { user: sessionUser, token: sessionTok }
    next();
  } else {
    resp.status(401).send("not authenticated")
  }
}

// ensure the owner of the session token owns the resource
const ifAuthorizedUser = (sessionToken, authorizedUser, cb) => {
  if (authorizedUser === session.sessionUser(sessionToken)) {
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
         
app.post('/api/logout', isAuthenticatedUser, (req, resp) => {
  
  if ( session.closeSession(req.session.token) ) {
    resp.setHeader('Content-Type', 'application/json');
    resp.status(200).send("true")
  } else {
    resp.status(403).send("cannot logout")
  }
})
         
app.get('/api/u/:user/c/:card', isAuthenticatedUser, (req, res) => {
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
  
app.delete('/api/u/:user/c/:card', isAuthenticatedUser, (req, res) => {
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

app.put('/api/qu/:user/c/:card', isAuthenticatedUser, function(req, res) {
  // creates a new card record
  
});

app.post('/api/u/:user/c/:card', isAuthenticatedUser, function(req, res) {
  // update an card record
});

app.get('/api/u/:user/c',  isAuthenticatedUser, function(req, res) {
  // return a list of cards for that user
  
});


if (!module.parent) {
  app.listen(8000);
  console.log("Express server listening on port %d", 8000);
}

