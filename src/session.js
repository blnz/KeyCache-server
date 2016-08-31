// the simplest session implementation, ever:
// an array of pairs: [ user_id, session_token ] 
// N.B. session is local to this node instance

const crypto = require('crypto');

var sessions = []

// creates a session for the user if it doesn't already exist

exports.sessionToken = (user_id, cb) => {
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
    const token =  buf.toString('hex')
    sessions.push([user_id, token])
    cb(null, token)
  });
}

exports.sessionUser = (token) => {
  const hits = sessions.filter( (elem) => elem[1] == token )
  if (hits.length == 1) {
    return hits[0][0]
  } else {
    return undefined
  }
}

exports.closeSession = (token) => {
  const userID = exports.sessionUser(token)
  if (userID) {
    sessions = sessions.filter( (entry) => entry[0] != userID )
    return true
  } else {
    return false
  }
}

