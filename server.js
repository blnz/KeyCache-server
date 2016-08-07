const path = require('path')
, sqlite3 = require('sqlite3').verbose()
, express = require('express')
, user = require('./src/user');

var app = express()

var privdb = function() {
  var priv = new sqlite3.Database(path.join(__dirname, "data/KeyCache.db"), function(err) {
    if (err) {
      console.log(err);
    }
  });
  return priv;
}

var db = privdb();

app.get('/', function(req, res){
  path = "index.html";
  res.sendfile('./public/' + path);
});

var isAuthenticatedUser = function(req, resp, next) {
  // we're easy
  next();
}

app.get('/api/:user/:card', isAuthenticatedUser, function(req, res) {
  // get a single card record
  
  var stmt = "SELECT card_id, user_id, version, data_blob from card where user_id = ? and card_id = ?";
  db.get(stmt, req.params.user, req.params.card,  function(err, row) {

    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(row, null, 4));
    }
  });
  
});

app.delete('/api/:user/:card/:version', isAuthenticatedUser, function(req, res) {
  // delete an card record
  var stmt = "DELETE from card wher user_id = ? and card_id = ? and version = ?";

  
});

app.put('/api/:user/:card', isAuthenticatedUser, function(req, res) {
  // creates a new card record
  
});

app.post('/api/:user/:card/:version', isAuthenticatedUser, function(req, res) {
  // update an card record
});

app.get('/api/:user',  isAuthenticatedUser, function(req, res) {
  // return a list of cards for that user
  
});



if (!module.parent) {
  app.listen(8010);
  console.log("Express server listening on port %d", 8000);
}

