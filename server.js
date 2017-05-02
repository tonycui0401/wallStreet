'use strict';

const Promise = global.Promise || require('promise');

const express = require('express'),
    exphbs = require('./index'), // "express-handlebars"
    helpers = require('./lib/helpers'),
    OAuth2Strategy = require('passport-oauth2'),
    OAuth2RefreshTokenStrategy = require('passport-oauth2-middleware').Strategy,
    passport = require('passport'),
    userController = require('./controllers/user'),
    authController = require('./controllers/auth'),
    request = require('request');




const app = express();

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Create `ExpressHandlebars` instance with a default layout.
const hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: helpers,

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
            cache: app.enabled('view cache'),
            precompiled: true
        }).then(function(templates) {
            // RegExp to remove the ".handlebars" extension from the template names.
            var extRegex = new RegExp(hbs.extname + '$');

            // Creates an array of templates which are exposed via
            // `res.locals.templates`.
            templates = Object.keys(templates).map(function(name) {
                return {
                    name: name.replace(extRegex, ''),
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


var refreshStrategy = new OAuth2RefreshTokenStrategy({
    refreshWindow: 10, // Time in seconds to perform a token refresh before it expires
    userProperty: 'ticket', // Active user property name to store OAuth tokens
    authenticationURL: '/login', // URL to redirect unathorized users to
    callbackParameter: 'callback' //URL query parameter name to pass a return URL
});

var oauthStartegy = new OAuth2Strategy({
        authorizationURL: 'https://staging-auth.wallstreetdocs.com/oauth/authorize',
        tokenURL: 'https://staging-auth.wallstreetdocs.com/oauth/token',
        clientID: 'coding_test',
        clientSecret: 'bwZm5XC6HTlr3fcdzRnD',
        callbackURL: "http://localhost:3000",
        passReqToCallback: false //Must be omitted or set to false in order to work with OAuth2RefreshTokenStrategy
    },
    refreshStrategy.getOAuth2StrategyCallback() //Create a callback for OAuth2Strategy
);




passport.use('oauth', oauthStartegy);
refreshStrategy.useOAuth2Strategy(oauthStartegy); //Register the OAuth strategy

app.get('/', passport.authenticate('oauth'), function(req, res) {
    res.redirect('/profile');
});

app.get('/oauth', passport.authenticate('oauth'));

app.get('/profile', function(req, resp, next) {

    request({
        url: 'https://staging-auth.wallstreetdocs.com/oauth/token',
        method: 'POST',
        auth: {
            user: 'coding_test',
            pass: 'bwZm5XC6HTlr3fcdzRnD'
        },
        form: {
            'code': '4FUmvIQscwFhHoUD',
            'grant_type': 'client_credentials',
            'redirect_uri': 'http://localhost:3000'
        }
    }, function(err, res) {
        var json = JSON.parse(res.body);

        var request = require('request');

        var options = {
            url: 'https://staging-auth.wallstreetdocs.com/oauth/userinfo',
            headers: {
                'authorization': 'Bearer ' + json.access_token
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                //console.log(info.username);
                // console.log(info.forks_count + " Forks");
                // res.render('login', {
                //      title: info.username
                //  });
                resp.render('profile', {
                    title: info.username
                });
            }
        }

        request(options, callback);


    });

});




app.use(express.static('public/'));

app.listen(3000, function() {
    console.log('express-handlebars example server listening on: 3000');
});