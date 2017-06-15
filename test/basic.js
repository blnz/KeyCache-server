process.env.NODE_ENV = 'test';

let chai = require('chai')
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should()

chai.use(chaiHttp)


var loginToken = "";

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
  it('it should post /api/register', (done) => {
    chai.request(server)
      .post('/api/register')
      .send({"wrapped_master": { "iv": "ffdd010101bc",
                                 "wrapped": "zy85b358dbd740b2c6781zyzyzyz",
                                 "salt": "0103b3..."},
             "username":"xyzzy",
             "secret":"xyzzy"})
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
  
});

describe ('POST /api/register', () => {
  it('it should refuse to add an existing user via /api/register', (done) => {
    chai.request(server)
      .post('/api/register')
      .send({"wrapped_master": { "iv": "ffdd010101bc",
                                 "wrapped": "zy85b358dbd740b2c6781zyzyzyz",
                                 "salt": "0103b3..."},
             "username":"xyzzy",
             "secret":"xyzzy"})
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });
  
});


describe ('POST /api/authenticate', () => {
  it('it should post to /api/authenticate', (done) => {
    chai.request(server)
      .post('/api/authenticate')
      .send({"username":"xyzzy",
             "secret":"xyzzy"})
      .end((err, res) => {
        // console.log("res", res)
        res.should.have.status(200);
        loginToken = JSON.parse(res.text).token
        console.log("loginToken:", loginToken)
        done();
      });
  });
  
});

