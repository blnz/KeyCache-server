const pbkdf2 = require('./pbkdf2')
, session = require('./session')
, config = require('../config');

// postgres
var pgp = require('pg-promise')({
    // Initialization Options 
})

var cn = config.dbConnection;

var db = pgp(cn);

exports.createCard = (cardID, userID, cardData) => {
    
    const query = "insert into ssdb.card (card_id, user_id, data_blob) " +
              " values ($1, $2, $3) returning card_id, last_update";
    
    return new Promise ( (resolve, reject) => {
        db.one(query, [cardID, userID, cardData ] )
            .then( (data) => {
                resolve( {id: data.card_id, version: data.last_update} );
            })
            .catch( (error) => {
                reject(error);
            });
    });
}


exports.addOrUpdateCard = (userID, cardID, lastUpdate, cardData) => {
    
    return new Promise( (resolve, reject) => {
        
        exports.getCard(cardID, userID)
            .then( (data) => {
                if (lastUpdate == data.last_update.toISOString()) {
                    exports.updateCard(cardID, userID, cardData)
                        .then( (data) => {
                            resolve(data);
                        })
                        .catch( (error) => {
                            reject(err);
                        });
                } else {
                    reject(new Error("update version mismatch"));
                }
            })
            .catch( (err) => {
                
                exports.createCard(cardID, userID, cardData)
                    .then( (data) => {
                        resolve(data);
                    })
                    .catch( (error) => {
                        reject(err);
                    });
            });
    });
}


exports.updateCard = (cardID, userID, cardData) => {
    
    const query = "update ssdb.card set data_blob = $1, last_update = now() where card_id = $2 and user_id = $3 returning card_id, last_update";
    
    return new Promise( (resolve, reject) => {
        
        db.one(query, [cardData, cardID, userID ] )
            .then( (data) => {
                resolve( {id: data.card_id, version: data.last_update} );
            })
            .catch( (error) => {
                reject (error);
            });
    });
}

exports.deleteCard = (cardID, userID) => {
    
    const query ="update ssdb.card set active = FALSE, data_blob = '{}', last_update = now() where card_id = $1 and user_id = $2";

    return new Promise( (resolve, reject) => {
        db.one(query, [cardID, userID] )
            .then( (data) => {
                resolve(null);
            })
            .catch( (error) => {
                reject(error);
            });
    });
}

exports.getCard = (cardID, userID) => {

    const query = "select card_id, user_id, last_update, data_blob, active from ssdb.card where card_id = $1 and user_id = $2";

    return new Promise( (resolve, reject) => {
        db.one(query, [cardID, userID] )
            .then( (data) => {
                resolve(data);
            })
            .catch( (error) => {
                reject(new Error(`cannot get ${cardID}`));
            });
    });
}

exports.listCards = (userID, since = "2017-06-01T18:51:00.765Z", skip = 0, count = 999) => {
    since = since || "2017-06-01T18:51:00.765Z";
    const query = "select card_id, user_id, last_update, data_blob, active from ssdb.card where user_id = $1 and last_update > $2 order by last_update asc LIMIT $3 OFFSET $4";

    return new Promise( (resolve, reject) => {
        db.any(query, [userID, since, count, skip])
            .then( (data) => {
                resolve(data);
            })
            .catch( (error) => {
                reject(error);
            });
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

exports.registerUser = (username, secret, wrapped_master)  => {

    const query ="insert into ssdb.user (user_id, username, pword_hash_hash, pword_salt, wrapped_master, last_update) values ( $1, $2, $3, $4, $5, now()) returning *";
    
    return new Promise( (resolve, reject) => {
    
        checkUsername(username, (err, data) => {
            if (err) {
                
                const userID = require('node-uuid').v4();  // generate a new guid for this user
                
                pbkdf2.newPassHash(secret, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        
                        db.one(query, [userID, username, data.hash, data.salt, wrapped_master] )
                            .then( (data) => {
                                const returnable = { user_id: data.user_id,
                                                     username: data.username,
                                                     last_updated: data.last_update};
                                
                                resolve(returnable);
                            })
                            .catch( (error) => {
                                console.log("ERROR:", error.message || error); 
                                reject(error);
                            });
                    }
                });
                
            } else {
                reject(new Error("username exists"));
            }
        });
    });
}

exports.userData = (userID) => {
    
    var query ="select wrapped_master, username, last_update from ssdb.user where user_id = $1";
    
    return new Promise( (resolve, reject) => {
        db.one(query, [ userID ] )
            .then( (data) => {
                resolve(data);
            })
            .catch( (error) => {
                console.log(error);
                reject(error);
            });
    });
    
};

exports.changeUserSecret = (userID, userName, oldsecret, newsecret, wrapped_master)  => {

    var query ="update ssdb.user set pword_hash_hash = $1, pword_salt = $2, wrapped_master = $3, last_update = now() where user_id = $4 returning *";

    return new Promise( (resolve, reject) => {
        pbkdf2.newPassHash(newsecret, (err, data) => {
            if (err) {
                reject(err);
            } else {
            
                db.one(query, [data.hash, data.salt, wrapped_master, userID] )
                    .then( (data) => {
                        resolve(data);
                    })
                    .catch( (error) => {
                        reject("ERROR:", error.message || error);
                    });
            }
        });
    });
}


// checks the pbkdf2 hash of the provided secret for user & returns user data if valid
exports.loginUser = (userName, secret)  => {

    var query ="select user_id, pword_hash_hash, pword_salt from ssdb.user where username = $1";

    return new Promise( (resolve, reject) => {
        db.one(query, userName)
            .then( (data) => {
                pbkdf2.testPassHash(secret, data.pword_salt, data.pword_hash_hash, (err, didPass) => {
                    if (err) {
                        reject(err);
                    } else {
                        session.sessionKey(data.user_id, (err, token) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ jwt: {userID: data.user_id,
                                                userName: userName}, 
                                          refreshToken: token});
                            }
                        });
                    }
                });
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

exports.refreshUser = (user_id, refreshToken)  => {

    var query ="select username from ssdb.user where user_id = $1";

    return new Promise( (resolve, reject) => {
        db.one(query, user_id)
            .then( (data) => {
                var su = session.sessionUser(refreshToken);
                if (su && su == user_id) {
                        resolve({ jwt: {userID: user_id,
                                        userName: data.userName}, 
                                  refreshToken: refreshToken});
                } else {
                    reject(new Error("not valid refreshToken"));
                }
            })
            .catch(function (error) {
                reject(error);
            });
    });
}
