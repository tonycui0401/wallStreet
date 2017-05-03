const exphbs = require('../index'),
      request = require('request');
//= =======================================
// User Profile View
//= =======================================
exports.view = function(req, resp, next) {

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
                resp.render('profile', {
                    title: info.username, 
                    email: info.emails[0].value,
                    family_name: info.name.family_name,
                    given_name: info.name.given_name,
                    org_name: info.organisation.name
                });
            }
        }

        request(options, callback);


    });

};

