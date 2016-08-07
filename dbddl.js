var sqlite3 = require('sqlite3').verbose();

var fs = require('fs');

var privdb = function() {
  var priv = new sqlite3.Database("./unifyID.db", function(err) {
    if (err) {
      console.log(err);
    }
  });
  return priv;
}

var db = privdb();

db.serialize(function() {

  console.log('Creating users...');
  db.run("CREATE TABLE user (user_id INTEGER PRIMARY KEY, user_name TEXT, password TEXT, last_update TEXT)", function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("user table created");
    }
  });

  db.run ("CREATE TABLE account ( account_id INTEGER PRIMARY KEY, user_id INTEGER, version INTEGER, data_blob TEXT)", function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("account table created");
    }
  });
});

db.close(function(err) {
  if (err) {
    console.log("db.close:", err);
  }
});



// sqlite> insert into user values(1, 'bill', 'blah');
// Error: table user has 4 columns but 3 values were supplied
// sqlite> insert into user values(1, 'bill', 'blah', now());
// Error: no such function: now
// sqlite> insert into user values(1, 'bill', 'blah', "now");
// sqlite> insert into account values(42, 1, 12, '{ "account": "gmail", "username":"billy", "pword" : "bop" }');
 
