process.env.NODE_ENV = 'test';
let jwt = require('jsonwebtoken')
, chai = require('chai')
, chaiHttp = require('chai-http')
, server = require('../server')
, should = chai.should();

chai.use(chaiHttp);


// some test data ...
const wrappedMasterKey = { "iv": "ffdd010101bc",
                           "wrapped": "zy85b358dbd740b2c6781zyzyzyz",
                           "salt": "0103b3..X.Y"};

var loginToken = "";
var refreshToken = "";
var userID = "";
var username = "xyzzy";
var secret = "xyzzyfoo";

const card1 = {
    "encrypted": {
        "cipherText64" : "g2hPKWna1k7lGe0+VsKQIJUxqrJNKp5dujMrUdRsGlWEBugwOjF14GvTyBKyOGZFfLVzl02iIxQIWXrKTbZU9SL4b/6bVbUCb4osjcdyX6xCWx2Et1R6sSSsVqR0DUin",
        "iv64" : "7ldjiQ9rCiPf6XS/5LY2zA=="
    },
    "id" : "85b358db-d987-4d90-b952-f68fe02c6781",
    "version" : "2014-01-01T00:00:00.123Z"
};

const enc2 =  {
    "cipherText64" : "0002",
    "iv64" : "0002"
};

const enc3 =  {
    "cipherText64" : "0003",
    "iv64" : "0003"
}

var c1version = "";

const card2 = {
    "encrypted": {
        "cipherText64" : "1234KWna1k7lGe0+VsKQIJUxqrJNKp5dujMrUdRsGlWEBugwOjF14GvTyBKyOGZFfLVzl02iIxQIWXrKTbZU9SL4b/6bVbUCb4osjcdyX6xCWx2Et1R6sSSsVqR0DUin",
        "iv64" : "7ldjiQ9rCiPf6XS/5LY2zA=="
    },
    "id" : "123458db-d987-4d90-b952-f68fe02c4321",
    "version" : "2015-02-01T13:14:15.123Z"
};

describe ('GET /', () => {
    it('it should get /', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });
});

describe ('POST /api/register', () => {
    it('it should post create a valid new user by posting to /api/register', (done) => {
        chai.request(server)
            .post('/api/register')
            .send({"wrapped_master": wrappedMasterKey,
                   "username": username,
                   "secret": secret})
            .end((err, res) => {

                res.should.have.status(200);
                res.body.should.have.own.property('user_id');
                userID = res.body.user_id;

                done();
            });
    });
    
});

describe ('POST /api/register', () => {
    it('it should refuse to add an existing user via /api/register', (done) => {
        chai.request(server)
            .post('/api/register')
            .send({"wrapped_master": wrappedMasterKey,
                   "username": username,
                   "secret": secret})
            .end((err, res) => {
                res.should.have.status(400);
                done();
            });
    });
});


describe ('POST /api/authenticate', () => {
    it('it should FAIL post to /api/authenticate', (done) => {
        chai.request(server)
            .post('/api/authenticate')
            .send({"username": 'foo',
                   "secret": 'bar'})
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
    });
    
});


describe ('POST /api/authenticate', () => {
    it('it should successfully authenticate via post to /api/authenticate', (done) => {
        chai.request(server)
            .post('/api/authenticate')
            .send({"username": username,
                   "secret": secret})
            .end((err, res) => {
                res.should.have.status(200);
                loginToken = res.body.token;
                refreshToken = res.body.refreshToken;
                done();
            });
    });
    
});


describe ('PUT /api/u/:user/c/:card', () => {
    it('it should put to /api/u/:user/c/:card to create', (done) => {
        chai.request(server)
            .put(`/api/u/${userID}/c/${card1.id}`)
            .set("Authorization", `JWT ${loginToken}`)
            .send(card1)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.an('Object');
                res.body.should.have.own.property('version');
                card1.version = res.body.version;
                done();
            });
    });
    
});


describe ('PUT /api/u/:user/c/:card', () => {
    it('it should allow us to update /api/u/:user/c/:card', (done) => {
        card1.encrypted = enc2;
        chai.request(server)
            .put(`/api/u/${userID}/c/${card1.id}`)
            .set("Authorization", `JWT ${loginToken}`)
            .send(card1)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.an('Object');
                res.body.should.have.own.property('version');
                c1version = res.body.version;
                done();
            });
    });
    
});


describe ('PUT /api/u/:user/c/:card', () => {
    it('it should NOT allow us to update /api/u/:user/c/:card with outdated version', (done) => {
        card1.encrypted = enc3;
        chai.request(server)
            .put(`/api/u/${userID}/c/${card1.id}`)
            .set("Authorization", `JWT ${loginToken}`)
            .send(card1)
            .end((err, res) => {
                res.should.have.status(400);
                done();
            });
    });
    
});

describe ('PUT /api/u/:user/c/:card', () => {
    it('it should NOT allow us to update /api/u/:user/c/:card with outdated version', (done) => {
        card1.encrypted = enc3;
        chai.request(server)
            .put(`/api/u/${userID}/c/${card1.id}`)
            .set("Authorization", `JWT ${loginToken}`)
            .send(card1)
            .end((err, res) => {
                res.should.have.status(400);
                done();
            });
    });
    
});

describe ('PUT /api/u/:user/c/:card', () => {
    it('it should allow us to update /api/u/:user/c/:card with updated version', (done) => {
        card1.version = c1version;
        chai.request(server)
            .put(`/api/u/${userID}/c/${card1.id}`)
            .set("Authorization", `JWT ${loginToken}`)
            .send(card1)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });
    
});



describe ('GET /api/u/:user/c', () => {
    it('it should get a list of all cards from /api/u/:user/c with no query params', (done) => {
        chai.request(server)
            .get(`/api/u/${userID}/c`)
            .set("Authorization", `JWT ${loginToken}`)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.own.property('meta');
                res.body.should.have.own.property('cards');
                res.body.cards.should.be.an('array');
                res.body.cards.should.have.length(1);
                res.body.cards[0].should.have.own.property('version');
                res.body.cards[0].should.have.own.property('encrypted');
                res.body.cards[0].encrypted.should.eql(card1.encrypted);
                done();
            });
    });
    
});


describe ('GET /api/u/:user/c', () => {
    it('it should get a list of cards since epoch from /api/u/:user/c', (done) => {
        chai.request(server)
            .get(`/api/u/${userID}/c`)
            .set("Authorization", `JWT ${loginToken}`)
            .query({since: '1970-01-01T00:00:00.000Z'})
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.own.property('meta');
                res.body.should.have.own.property('cards');
                res.body.cards.should.be.an('array');
                res.body.cards.should.have.length(1);
                res.body.cards[0].should.have.own.property('version');
                res.body.cards[0].should.have.own.property('encrypted');
                res.body.cards[0].encrypted.should.eql(card1.encrypted);
                done();
            });
    });
    
});

describe (`GET /api/u/:user/c/${card1.id}`, () => {
    it(`it should get the card /api/u/:user/c/${card1.id}`, (done) => {
        chai.request(server)
            .get(`/api/u/${userID}/c/${card1.id}`)
            .set("Authorization", `JWT ${loginToken}`)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });
    
});


describe (`GET /api/u/:user/c/bad_id`, () => {
    it(`it should fail to get the card /api/u/:user/c/bad_id with a 404`, (done) => {
        chai.request(server)
            .get(`/api/u/${userID}/c/bad_id`)
            .set("Authorization", `JWT ${loginToken}`)
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });
    
});


describe ('POST /api/refreshToken', () => {
    it('it should get a new loginToken', (done) => {
        chai.request(server)
            .post('/api/refreshToken')
            .send({refreshToken: refreshToken,
                   userID: userID})
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.own.property('token');
                res.body.should.have.own.property('refreshToken');
                loginToken = res.body.token;
                done();
            });
    });
});



describe ('POST /api/logout', () => {
    it('it should logout', (done) => {
        chai.request(server)
            .post('/api/logout')
            .set("Authorization", `JWT ${loginToken}`)
            .query({refreshToken: refreshToken})
            .end((err, res) => {
                res.should.have.status(200);
                loginToken = '';
                done();
            });
    });
});

describe ('POST /api/refreshToken', () => {
    it('it should fail to get a new loginToken', (done) => {
        chai.request(server)
            .post('/api/refreshToken')
            .send({refreshToken: refreshToken,
                   userID: userID})
            .end((err, res) => {
                res.should.have.status(401);
                done();
            });
    });
});




describe ('POST /api/authenticate', () => {
    it('it should successfully authenticate via post to /api/authenticate', (done) => {

        chai.request(server)
            .post('/api/authenticate')
            .send({"username": username,
                   "secret": secret})
            .end((err, res) => {

                res.should.have.status(200);
                loginToken = res.body.token;
                refreshToken = res.body.refreshToken;
                done();
            });
    });
    
});


describe (`GET /api/u/:user/key`, () => {
    it(`it should get the wrapped master key for user`, (done) => {

        chai.request(server)
            .get(`/api/u/${userID}/key`)
            .set("Authorization", `JWT ${loginToken}`)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.own.property('wrapped_master');
                res.body.should.have.own.property('last_update');
                done();
            });
    });
    
});

