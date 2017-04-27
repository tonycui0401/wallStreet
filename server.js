'use strict';

const Promise = global.Promise || require('promise');

const express = require('express'),
      exphbs  = require('./index'), // "express-handlebars"
      helpers = require('./lib/helpers'),
      OAuth2Strategy = require('passport-oauth2'),
      LocalStrategy = require('passport-local').Strategy,
      OAuth2RefreshTokenStrategy = require('passport-oauth2-middleware').Strategy,
      passport = require('passport'),
      BearerStrategy = require('passport-http-bearer').Strategy,
      userController = require('./controllers/user'),
      authController = require('./controllers/auth');


const app = express();

// Create `ExpressHandlebars` instance with a default layout.
const hbs = exphbs.create({
    defaultLayout: 'main',
    helpers      : helpers,

    // Uses multiple partials dirs, templates in "shared/templates/" are shared
    // with the client-side of the app (see below).
    partialsDir: [
        'shared/templates/',
        'views/partials/'
    ]
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Middleware to expose the app's shared templates to the cliet-side of the app
// for pages which need them.
function exposeTemplates(req, res, next) {
    // Uses the `ExpressHandlebars` instance to get the get the **precompiled**
    // templates which will be shared with the client-side of the app.
    hbs.getTemplates('shared/templates/', {
        cache      : app.enabled('view cache'),
        precompiled: true
    }).then(function (templates) {
        // RegExp to remove the ".handlebars" extension from the template names.
        var extRegex = new RegExp(hbs.extname + '$');

        // Creates an array of templates which are exposed via
        // `res.locals.templates`.
        templates = Object.keys(templates).map(function (name) {
            return {
                name    : name.replace(extRegex, ''),
                template: templates[name]
            };
        });

        // Exposes the templates during view rendering.
        if (templates.length) {
            res.locals.templates = templates;
        }

        setImmediate(next);
    })
    .catch(next);
}

app.get('/', function (req, res) {
    res.render('login', {
        title: 'Login'
    });
});


var refreshStrategy = new OAuth2RefreshTokenStrategy({
    refreshWindow: 10, // Time in seconds to perform a token refresh before it expires
    userProperty: 'ticket', // Active user property name to store OAuth tokens
    authenticationURL: '/login', // URL to redirect unathorized users to
    callbackParameter: 'callback' //URL query parameter name to pass a return URL
  });

  passport.use('main', refreshStrategy);  //Main authorization strategy that authenticates
                                          //user with stored OAuth access token
                                          //and performs a token refresh if needed

  var oauthStartegy = new OAuth2Strategy({
    authorizationURL: 'https://staging-auth.wallstreetdocs.com/oauth/authorize',
    tokenURL: 'https://staging-auth.wallstreetdocs.com/oauth/token',
    clientID: 'coding_test',
    clientSecret: 'bwZm5XC6HTlr3fcdzRnD',
    callbackURL: 'http://localhost:3000',
    passReqToCallback: false //Must be omitted or set to false in order to work with OAuth2RefreshTokenStrategy
  },
    refreshStrategy.getOAuth2StrategyCallback() //Create a callback for OAuth2Strategy
  );

  passport.use('oauth', oauthStartegy); //Strategy to perform regular OAuth2 code grant workflow
  refreshStrategy.useOAuth2Strategy(oauthStartegy); //Register the OAuth strategy
                                                    //to perform OAuth2 refresh token workflow

  var localStrategy = new LocalStrategy({
    usernameField : 'username',
    passwordField : 'password'
  },
    refreshStrategy.getLocalStrategyCallback() //Create a callback for LocalStrategy
  );

  passport.use('local', localStrategy); //Strategy to perform a username/password login
  refreshStrategy.useLocalStrategy(localStrategy); //Register the LocalStrategy
                                                   //to perform an OAuth 'password' workflow



  //GET /login
  app.get('/login', function(req, res){
   var callback = req.query.callback || '/profile';

   if (req.isAuthenticated()) {
     return res.redirect(callback);
   }

   //res.render('login_page');
    res.render('login', {
        title: 'Home'
    });
  });

  //POST /login
  app.post('/login', function(req, res, next) {
   var callback = req.query.callback || '/profile';

   passport.authenticate('local', function(err, user, info) {
     if (err || !user) {
       res.render('login', {
        title: 'Home',
        error: 'unable to login'
     });
       return next();
     }

     req.logIn(user, function(err) {
       if (err) {
         return next(err);
       }

       return res.redirect(callback);
     });
   })(req, res, next);
  });

  //GET /oauth
  app.get('/oauth', passport.authenticate('oauth'));

  //GET /oauth/callback
  app.get('/oauth/callback', passport.authenticate('oauth'), function(req, res) {
    res.redirect('/profile');
  });


  app.get('/profile', authController.isAuthenticated, userController.viewProfile);



app.use(express.static('public/'));

app.listen(3000, function () {
    console.log('express-handlebars example server listening on: 3000');
});
