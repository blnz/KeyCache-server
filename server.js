var sqlite3 = require('sqlite3').verbose();
var express = require('express')

var app = express()

var privdb = function() {
  var priv = new sqlite3.Database("./unifyID.db", function(err) {
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

app.get('/api/:user/:account', isAuthenticatedUser, function(req, res) {
  // get a single account record

  
  
  var stmt = "SELECT account_id, user_id, version, data_blob from account where user_id = ? and account_id = ?";
  db.get(stmt, req.params.user, req.params.account,  function(err, row) {

    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(row, null, 4));
    }
  });
  
});

app.delete('/api/:user/:account/:version', isAuthenticatedUser, function(req, res) {
  // delete an account record
  var stmt = "DELETE from account wher user_id = ? and account_id = ? and version = ?";

  
});

app.put('/api/:user/:account', isAuthenticatedUser, function(req, res) {
  // creates a new account record
  
});

app.post('/api/:user/:account/:version', isAuthenticatedUser, function(req, res) {
  // update an account record
});

app.get('/api/:user',  isAuthenticatedUser, function(req, res) {
  // return a list of accounts for that user
  
});



if (!module.parent) {
  app.listen(8010);
  console.log("Express server listening on port %d", 8000);
}

