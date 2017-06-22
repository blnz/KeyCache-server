const pbkdf2 = require('./pbkdf2')
, session = require('./session');

// postgres
var pgp = require('pg-promise')({
    // Initialization Options 
});

var cn = {
    host: process.env.PGHOST || 'localhost',
    port: 5432,
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'ssdb',
    password: process.env.PGPASSWORD || 'ssdb'
};

var db = pgp(cn);


exports.createCard = (cardID, userID, cardData, cb) => {

  const query = "insert into ssdb.card (card_id, user_id, data_blob) " +
        " values ($1, $2, $3) returning card_id, last_update"
  
  db.one(query, [cardID, userID, cardData ] )
    .then( (data) => {
      cb(null, {id: data.card_id, version: data.last_update})
    })
    .catch( (error) => {
      cb(error)
    });
}


exports.addOrUpdateCard = (cardID, userID, lastUpdate, cardData, cb) => {

  exports.getCard(cardID, userID, (err, data) => {
    if (err) {
      console.log("got err:", err);
      exports.createCard(cardID, userID, cardData, cb);
    } else {
      console.log("addOrUpdata data:", data)
      console.log("typeof data.last_update:", typeof data.last_update);
      if (lastUpdate == data.last_update.toISOString()) {
        console.log("lastUpdate:", "|" + lastUpdate + "|", " == ", "|" + data.last_update.toISOString() + "|")
        exports.updateCard(cardID, userID, cardData, cb);
      } else {
        console.log("lastUpdate:", "|" + lastUpdate + "|", " != ", "|" + data.last_update.toISOString() + "|")
        
        cb(new Error("attempt to update card with mismatch version"))
      }
    }
  });
  
}


exports.updateCard = (cardID, userID, cardData, cb) => {
  
  const query = "update ssdb.card set data_blob = $1, last_update = now() where card_id = $2 and user_id = $3 returning card_id, last_update"
  
  db.one(query, [cardData, cardID, userID ] )
    .then( (data) => {
      cb(null, {id: data.card_id, version: data.last_update})
    })
    .catch( (error) => {
      //      console.log("updateCard error:", error)
      cb(error)
    });
}

exports.deleteCard = (cardID, userID, cb) => {
  
  const query ="update ssdb.card set active = FALSE, data_blob = '{}', last_update = now() where card_id = $1 and user_id = $2";
  
  db.one(query, [cardID, userID] )
    .then( () => {
      cb(null)
    })
    .catch( (error) => {
      //      console.log("ERROR: deleteCard:", error.message || error); 
      cb(error)
    });
}

exports.getCard = (cardID, userID, cb) => {
  const query = "select card_id, user_id, last_update, data_blob, active from ssdb.card where card_id = $1 and user_id = $2"
  db.one(query, [cardID, userID] )
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      cb(new Error(`cannot get ${cardID}`))
    });
}

// FIXME: pagination limits, maybe?
exports.listCards = (userID, since, cb) => {
  since = since || "2017-06-01T18:51:00.765Z"
  const query = "select card_id, user_id, last_update, data_blob, active from ssdb.card where user_id = $1 and last_update > $2 order by last_update asc"
  
  db.any(query, [userID, since])
    .then( (data) => {
      cb(null, data)
    })
    .catch( (error) => {
      cb(error)
    });
}


//
// users
//

// checks if username exists, returns user_id
const checkUsername = (username, cb)  => {

  var query ="select user_id from ssdb.user where username = $1";
  db.one(query, username)
    .then( (data) => {
      cb(null, {user: data.user_id });
    })
    .catch(function (error) {
      cb(error)
    });
}


//  
//   username: "jimmy",
//   secret: "secret password",
//   wrapped_master: "{iv, wrapped}"

exports.registerUser = (username, secret, wrapped_master, cb)  => {

  const myWrapped_master = wrapped_master;
  const myUsername = username;
  const mySecret = secret;

  checkUsername(username, (err, data) => {
    if (err) {

      var query ="insert into ssdb.user (user_id, username, pword_hash_hash, pword_salt, wrapped_master, last_update) values ( $1, $2, $3, $4, $5, now()) returning *";
      
      const userID = require('node-uuid').v4()  // generate a new guid for this user
      
      pbkdf2.newPassHash(mySecret, (err, data) => {
        if (err) {
          console.log(err);
        } else {

          db.one(query, [userID, username, data.hash, data.salt, wrapped_master] )
            .then( (data) => {
              const returnable = { user_id: data.user_id,
                                   username: data.username,
                                   last_updated: data.last_update}
              
              cb(null, returnable)
            })
            .catch( (error) => {
              console.log("ERROR:", error.message || error); 
              cb(error)
            });
        }
      })
                       
    } else {
      cb ("username exists")
    }
  });
}


exports.changeUserSecret = (userID, secret, wrapped_master, cb)  => {

  var query ="update ssdb.user set pword_hash_hash = $1, pword_salt = $2, wrapped_master = $3, last_update = now() where user_id = $4 returning *";

  pbkdf2.newPassHash(secret, (err, data) => {

    db.one(query, [data.hash, data.salt, wrapped_master, userID] )
      .then( (data) => {
        cb(null, data)
      })
      .catch( (error) => {
        cb("ERROR:", error.message || error)
      });
  });
}


// checks the pbkdf2 hash of the provided secret for user & returns user data if valid
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
        cb(null, {user: data.user_id });
      })
    })
    .catch(function (error) {
      cb(error)
    });
}



