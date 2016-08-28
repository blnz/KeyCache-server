const pbkdf2 = require('./pbkdf2')

// postgres
var pgp = require('pg-promise')({
    // Initialization Options 
});

var cn = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'ssdb',
    password: 'ssdb'
};

var db = pgp(cn);


exports.createCard = (cardObj, cb) => {

  const query = "insert into ssdb.card (card_id, user_id, data_blob) " +
        " values ($1, $2, 3) returning last_update"

  db.one(query, [cardObj.card_id, cardObj.user_id, cardObj.data_blob ] )
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      console.log("ERROR: createCard:", error.message || error); 
      cb(error)
    });
}


exports.updateCard = (cardObj, cb) => {

  const query = "update ssdb.card set data_blob = $1, last_update = (now() at time zone 'utc') where card_id = $2 and last_update = $3"

  db.one(query, [cardObj.encrypted, cardObj.card_id, cardObj.last_update ] )
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      console.log("ERROR: updateCard:", error.message || error); 
      cb(error)
    });
}

exports.deleteCard = (cardID, cb) => {

  const query ="delete from ssdb.card where card_id = $1";

  db.one(query,cardID )
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      console.log("ERROR: deleteCard:", error.message || error); 
      cb(error)
    });
}

exports.getCard = (cardID, cb) => {
  const query = "select card_id, user_id, last_update, data_blob from ssdb.card where card_id = $1"
  db.one(query, cardID )
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      console.log("ERROR: getCard:", error.message || error); 
      cb(error)
    });
}

exports.listCards = (userID, since, cb) => {
  since = since || "2016-08-01 00:00:00.000000"
  const query = "select card_id, user_id, last_update, data_blob from ssdb.card where user_id = $1 and last_update > $2"
  
  db.one(query, userID, since)
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      console.log("ERROR: getCard:", error.message || error); 
      cb(error)
    });
}


// const sample_userObj = {
//   username: "jimmy",
//   password: "secret password",
//   wrapped_master: "{iv, wrapped}"
// }

exports.registerUser = (userObj, cb)  => {

  var query ="insert into ssdb.user (user_name, pword_hash_hash, pword_salt, wrapped_master, last_update) values ( $1, $2, $3, $4, now()) returning user_id";

  pbkdf2.newPassHash(userObj.password, (err, data) => {

    db.one(query,[ userObj.username, data.hash, data.salt, userObj.wrapped_master] )
      .then( (data) => {
        console.log(data);
        cb(null, data)
      })
      .catch( (error) => {
        console.log("ERROR:", error.message || error); 
        cb("ERROR:", error.message || error)
      });
  });
}

// the simplest session implementation, ever:
// an array of pairs: [ user_id, session_token ] 
// N.B. session is local to this node instance

var sessions = []

// creates a session for the user if it doesn't already exist

const sessionToken = (user_id, cb) => {
  var session = sessions.filter( (elem) => elem[0] == user_id )
  if (session) {
    callback(null, session[1])
    return
  }
  crypto.randomBytes(16, (err, buf) => {
    if (err) {
      cb(err);
      return;
    }
    const token =  buf.toString('hex')
    sessions.push([user_id, token])
    cb(null, token)
  });
}

const sessionUser = (token) => {
  return sessions.filter( (elem) => elem[1] == token )
}


// checks password for user & gets or creates a session if valid

exports.loginUser = (userObj, cb)  => {

  // userObj := { username: "foo", password: "secret" }
  
  var query ="select user_id, pword_hash_hash, pword_salt from ssdb.user where user_name = $1";
  db.one(query, userObj.username)
    .then( (data) => {
      pbkdf2.testPassHash(userObj.password, data.pword_salt, data.pword_hash_hash, (err, data) => {
        if (err) {
          console.log("login ERROR:", error.message || error); 
          cb(err);
          return;
        }
        console.log(data);
        sessionToken(data.user_id, cb)
      })
    })
    .catch(function (error) {
      console.log("login ERROR:", error.message || error); 
      cb(error)
    });
}

exports.closeSession = (token) => {
  const userID = sessionUser(token)
  if (userID) {
    sessions = sessions.filter( (entry) => entry[0] != userID )
  }
}
