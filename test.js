// require('es6-promise').polyfill();
// require('isomorphic-fetch')

var fetch = require('node-fetch')

const newUser = {"wrapped_master": { "iv": "ffdd010101bc", "wrapped": "zy85b358dbd740b2c6781zyzyzyz"}, "username":"xyz","secret":"xyz"}

const userLogin = {"username":"xyz","secret":"xyz"}

var authtoken = undefined

var foo = 2

var register = () => {
  return new Promise( (resolve, reject ) => {
    console.log("running register promise function")
    fetch("http://127.0.0.1:8000/api/register", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser)
    }).then( (response) => {
      console.log("got response",  response.status)
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    }).then( (data) => {
      console.log("registered:", data);
      resolve( data )
    })
  })
}
  
var login = (data) => {
  return new Promise( (resolve, reject ) => {
    console.log("login started when we got", data)
    fetch("http://127.0.0.1:8000/api/authenticate", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userLogin)
    }).then( (response) => {
      console.log("authenticate got response",  response.status)
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    }).then( (data) => {
      console.log("authenticated:", data);
      resolve(data)
    })
  })
}
                    

const logout = (data) => {
  return new Promise( (resolve, reject ) => {
    console.log("logout started when we got", data)
    fetch("http://127.0.0.1:8000/api/logout?session=" + data.session, {
      method: 'POST',
      headers: {
        // 'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({session: data.session })
    }).then( (response) => {
      console.log("logout got response", response.status)
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    }).then( (data) => {
      console.log("authenticated:", data);
      resolve(data)
    })
  })
}
                    

console.log("starting test")
register()
  .then(login)
  .then(logout)
  .catch( (err) => console.log(err))

    

// var p1 = new Promise( (resolve, reject) => {
//   console.log("running p1 promise function")
//   fetch("http://127.0.0.1:8000/api/register", {
//     method: 'POST',
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(newUser)
//   }).then( (response) => {
//     console.log("got response")
//     if (response.status >= 400) {
//       throw new Error("Bad response from server");
//     }
//     return response.json();
//   }).then( (data) => {
//     console.log("registered:", data);
//     resolve( "bar" )
//   }).catch((err) => {
//     reject( err)
//   }).then(q2)
// })
    // }).then ( (data) => {
    //   console.log("next query started when we got", data)
    //   fetch("http://127.0.0.1:8000/api/authenticate", {
    //     method: 'POST',
    //     headers: {
    //       'Accept': 'application/json',
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(userLogin)
    //   }).then( (response) => {
    //     console.log("authenticate got response")
    //     if (response.status >= 400) {
    //       throw new Error("Bad response from server");
    //     }
    //     return response.json();

    // }).then( (data) => {
    //   console.log("authenticated:", data);
    // }).catch( (err)  => {
    //   console.log(err)
    // })

    //   })


      // }).then ( (data) => {
    //   console.log("next query started when we got", data)
    //   fetch("http://127.0.0.1:8000/api/authenticate", {
    //     method: 'POST',
    //     headers: {
    //       'Accept': 'application/json',
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(userLogin)
    //   }).then( (response) => {
    //     console.log("authenticate got response")
    //     if (response.status >= 400) {
    //       throw new Error("Bad response from server");
    //     }
    //     return response.json();
    //   }).then( (data) => {
    //     console.log("authenticated:", data);
    //   })
    // }).then( data )  => {
    //   console.log("i'm here with :" , data)
    // }).catch( (err) => {
    //   console.log("finally, an error", err)
    // })
      

// p1.then( () => { console.log("ran p1") } );


// var p2 = fetch("http://127.0.0.1:8000/api/authenticate", {
//   method: 'POST',
//   headers: {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify(newUser)
// }).then( (response) => {
//   // console.log(response)
//   if (response.status >= 400) {
//     throw new Error("Bad response from server");
//   }
//   return response.json();
// }).then( (data) => {
//   console.log("registered:", data);
//   return "bar"
// }).then( (bar) => {
//   console.log("bar:", bar)
// }).catch((err) => {
//   console.log("p2 whoops", err)
// });

// p1.then( () => {
//   console.log("after p1 more")
//   p2.then( () => {
//     console.log("done p2 ")
//   }).catch( (err) => {
//     console.log("p1p2 whoops", err)
//   })
//     });
