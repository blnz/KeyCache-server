// the simplest session implementation, ever:
// an array of pairs: [ user_id, session_key ] 
// N.B. session is local to this node instance
// and is stateful

const crypto = require('crypto');

var sessions = []

// creates a session for the user if it doesn't already exist
exports.sessionKey = (user_id, cb) => {
  crypto.randomBytes(16, (err, buf) => {
    if (err) {
      cb(err);
      return;
    }
    const key =  buf.toString('hex')
    sessions.push([user_id, key])
    cb(null, key)
  });
}

exports.checkSessionKey = (user_id, key, cb) => {
  
  var session = sessions.filter( (elem) => elem[1] == key )
  if (session.length > 0 ) {
    cb(null, user_id)
  } else {
    cb(new Error("not found"))
  }
}


exports.sessionUser = (key) => {
  const hits = sessions.filter( (elem) => elem[1] == key )
  if (hits.length == 1) {
    return hits[0][0]
  } else {
    return undefined
  }
}

exports.closeSession = (key) => {
  const userID = exports.sessionUser(key)
  if (userID) {
    sessions = sessions.filter( (entry) => entry[0] != userID )
    return true
  } else {
    return false
  }
}

