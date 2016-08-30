const crypto = require('crypto');

const config = {
  iters: 1000000,
  saltlen: 32,
  keylen: 32,
  algo: 'sha256'
}

const genHash = (secret, salt, cb) => {
  crypto.pbkdf2(secret, salt, config.iters, config.keylen, config.algo, (err, key) => {
    if (err) {
      cb(err);
      return;
    }
    cb (null, {salt: salt, hash: key.toString('hex')});
  });
}

// create some new random salt, use it to hash the secret
// result is an object with hash and salt as hex strings
//
exports.newPassHash = (secret, cb) => {
  crypto.randomBytes(config.saltlen, (err, buf) => {
    if (err) {
      cb(err);
      return;
    }
    genHash(secret, buf.toString('hex'), cb)
  });
}

exports.testPassHash = (secret, salt, testHash, cb) => {
  genHash(secret, salt, (err, data) => {
    if (err) {
      cb(err);
      return;
    }
    if (data.hash === testHash) {
      cb(null, true);
    } else {
      cb("mismatch");
    }
  })
}
  
const test = (secret1, secret2) => {
  exports.newPassHash(secret1, (err, data) => {
    if(err) {
      console.log(err)
      return;
    }
    const hash = data.hash
    genHash(secret2, data.salt, (err, data) => {
      if (err) {
        console.log(err)
        return;
      }
      console.log(secret1, " - ", secret2, hash === data.hash ? " matched" : " missed")
    })
  })
}

if (require.main == module) {
  // unit tests
  test("foobar", "foobar")
  test("foobar", "not-foobar")
  test("better-foobar", "better-foobar")

}
