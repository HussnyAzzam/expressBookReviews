const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
// ...existing code...
    // changed code:
    // Authenticate using the session's access token. Accept token from:
    //  - Authorization: Bearer <token>
    //  - query param access_token
    //  - body param access_token
    // If no explicit token provided, fall back to session-stored accessToken.
    const authHeader = req.get('Authorization') || req.get('authorization');
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.query && req.query.access_token) {
      token = req.query.access_token;
    } else if (req.body && req.body.access_token) {
      token = req.body.access_token;
    }

    // If session has an accessToken, allow using that as the authoritative token.
    if (req.session && req.session.accessToken) {
      // if no token was provided in request, use session token
      if (!token) token = req.session.accessToken;

      // validate token matches the session token
      if (token === req.session.accessToken) {
        // attach session user info to request for downstream handlers
        req.user = req.session.user || null;
        return next();
      }
    }

    // not authenticated
    res.status(401).json({ error: 'Unauthorized' });
    // ...existing code...
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
