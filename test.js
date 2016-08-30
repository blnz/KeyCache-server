var fetch = require('node-fetch')

const newUser = {"wrapped_master": { "iv": "ffdd010101bc",
                                     "wrapped": "zy85b358dbd740b2c6781zyzyzyz",
                                     "salt": "0103b3..."},
                 "username":"xyz",
                 "secret":"xyzzy"}

const userLogin = {"username":"xyz","secret":"xyzzy"}

const changedSecret = {"wrapped_master": { "iv": "b1a201ffdd010101bc",
                                           "wrapped": "Gh13zy85b358dbd740b2c6781zyz0010",
                                           "salt": "eab20103b3...0123"},
                       "secret":"notxyzzzy"}

const changedLogin = {"username":"xyz","secret": "notxyzzzy"}


const card1 = {
  "encrypted": {
    "cipherText64" : "g2hPKWna1k7lGe0+VsKQIJUxqrJNKp5dujMrUdRsGlWEBugwOjF14GvTyBKyOGZFfLVzl02iIxQIWXrKTbZU9SL4b/6bVbUCb4osjcdyX6xCWx2Et1R6sSSsVqR0DUin",
    "iv64" : "7ldjiQ9rCiPf6XS/5LY2zA=="
  },
  "id" : "85b358db-d987-4d90-b952-f68fe02c6781",
  "version" : "2014-01-01T00:00:00.123Z"
}


var authtoken = undefined
var userID = undefined

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
      console.log("register: got response",  response.status)
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    }).then( (data) => {
      console.log("registered:", data);
      userID = data.user_id
      resolve( data )
    })
  })
}
  
var changeSecret = (data) => {
  return new Promise( (resolve, reject ) => {
    const session = data
    console.log("running changeSecret function with data", data)
    fetch("http://127.0.0.1:8000/api/changeSecret?session=" + data.session, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(changedSecret)
    }).then( (response) => {
      console.log("changeSecret got response",  response.status)
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    }).then( (data) => {
      console.log("changed secret:", data);
      resolve( session )
    })
  })
}
  
var addCard = (card) => {
  console.log("preparing addCard promise creator")
  return (data) => {
    console.log("renning addCard promise creator")
    return new Promise( (resolve, reject ) => {
      console.log("running addCard function with data", card)
      const url = `http://127.0.0.1:8000/api/u/${userID}/c/${card.id}?session=${authtoken}`
      console.log("to url:", url)
      fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(card)
      }).then( (response) => {
        console.log("add card got response",  response.status)
        if (response.status >= 400) {
          throw new Error("Bad response from server");
        }
        return response.json();
      }).then( (data) => {
        console.log("add card response json:", data);
        resolve( data )
      })
    })
  }
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
      authtoken = data.session
      resolve(data)
    })
  })
}
                    

const logout = (data) => {
  return new Promise( (resolve, reject ) => {
    console.log("logout started when we got", data)
    console.log("saved authtoken is", authtoken)
    fetch("http://127.0.0.1:8000/api/logout?session=" + authtoken, {
      method: 'POST',
      headers: {
        // 'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    }).then( (response) => {
      console.log("logout got response", response.status)
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    }).then( (data) => {
      console.log("logout response json:", data);
      resolve(data)
    })
  })
}
                    

console.log("starting test")
register()
  .then(login)
  .then(logout)
  .then(login)
  .then(changeSecret)
//  .then( (result) => { addCard(card1)} )
//  .then( (result) => { addCard(card1).then( console.log("bye")) } )
  .then( addCard(card1) )
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
