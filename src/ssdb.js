const pbkdf2 = require('./pbkdf2')
, session = require('./session');

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


// FIXME: is this style of query safe against sql injection with pg-promise?

exports.createCard = (cardID, userID, cardData, cb) => {

  const query = "insert into ssdb.card (card_id, user_id, data_blob) " +
        " values ($1, $2, 3) returning card_id, last_update"

  db.one(query, [cardID, userID, cardData ] )
    .then( (data) => {
      cb(null, {id: data.card_id, version: data.last_update})
    })
    .catch( (error) => {
      console.log("ERROR: createCard:", error.message || error); 
      cb(error)
    });
}


exports.updateCard = (cardID, userID, lastUpdate, cardData, cb) => {

  const query = "update ssdb.card set data_blob = $1, last_update = now() where card_id = $2 and last_update = $3 and userID = $4 returning *"

  db.one(query, [cardData, cardID, lastUpdate, userID ] )
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      console.log("ERROR: updateCard:", error.message || error); 
      cb(error)
    });
}

exports.deleteCard = (cardID, userID, cb) => {

  const query ="delete from ssdb.card where card_id = $1 and user_id = $2";

  db.one(query, [cardID, userID] )
    .then( () => {
      cb(null)
    })
    .catch( (error) => {
      console.log("ERROR: deleteCard:", error.message || error); 
      cb(error)
    });
}

exports.getCard = (cardID, userID, cb) => {
  const query = "select card_id, user_id, last_update, data_blob from ssdb.card where card_id = $1 and userID = $2"
  db.one(query, [cardID, userID] )
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      console.log("ERROR: getCard:", error.message || error); 
      cb(error)
    });
}

// FIXME: pagination limits, maybe?
exports.listCards = (userID, since, cb) => {
  since = since || "2016-08-01T18:51:00.765Z"
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


//  
//   username: "jimmy",
//   secret: "secret password",
//   wrapped_master: "{iv, wrapped}"

exports.registerUser = (username, secret, wrapped_master, cb)  => {

  var query ="insert into ssdb.user (user_id, username, pword_hash_hash, pword_salt, wrapped_master, last_update) values ( $1, $2, $3, $4, $5, now()) returning *";

  const userID = require('node-uuid').v4()  // generate a new guid for this user
  
  pbkdf2.newPassHash(secret, (err, data) => {

    db.one(query, [userID, username, data.hash, data.salt, wrapped_master] )
      .then( (data) => {
        console.log("new registration:", data);
        const returnable = { user_id: data.user_id,
                             username: data.username,
                             last_updated: data.last_update}
                             
        cb(null, returnable)
      })
      .catch( (error) => {
        console.log("ERROR:", error.message || error); 
        cb(error)
      });
  });
}


exports.changeUserSecret = (userID, secret, wrapped_master, cb)  => {

  var query ="update ssdb.user set pword_hash_hash = $1, pword_salt = $2, wrapped_master = $3, last_update = now() where user_id = $4 returning *";

  pbkdf2.newPassHash(secret, (err, data) => {

    db.one(query, [data.hash, data.salt, wrapped_master, userID] )
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


// checks the pbkdf2 hash of the provided secret for user & gets or creates a session if valid
exports.loginUser = (username, secret, cb)  => {

  var query ="select user_id, pword_hash_hash, pword_salt from ssdb.user where username = $1";
  db.one(query, username)
    .then( (data) => {
      pbkdf2.testPassHash(secret, data.pword_salt, data.pword_hash_hash, (err, didPass) => {
        if (err) {
          console.log("login ERROR:", err); 
          cb(err);
          return;
        }
        console.log("hash matches for", data, didPass);
        session.sessionToken(data.user_id, cb)
      })
    })
    .catch(function (error) {
      console.log("login ERROR:", error.message || error); 
      cb(error)
    });
}
