// the simplest session implementation, ever:
// an array of pairs: [ user_id, session_key ] 
// N.B. session is local to this node instance
// and is stateful

const crypto = require('crypto');

var sessions = []

// creates a session for the user if it doesn't already exist
exports.sessionKey = (user_id, cb) => {
  // find it if we have a session for given user_id
  var session = sessions.filter( (elem) => elem[0] == user_id )
  if (session.length == 1) {
    cb(null, session[0][1])
    return
  }
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

