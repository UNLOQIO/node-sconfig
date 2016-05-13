var request = require('request');
const API_URL = 'https://api.sconfig.io/config',
  API_TIMEOUT = 5000;
/*
* API file that uses request to fetch data
* */
module.exports.fetch = function FetchData(key, version, done) {
  var url = API_URL;
  if(typeof version === 'string' || typeof version === 'number') {
    url += '?v=' + version;
  }
  var opt = {
    timeout: API_TIMEOUT,
    followRedirect: false,
    followRedirects: false,
    headers: {
      'Authorization': 'Bearer ' + key
    }
  };
  request.get(url, opt, function(err, resp, body) {
    if(err) {
      return done(err);
    }
    if(resp.statusCode >= 399 || resp.statusCode < 200) {
      var e = new Error('Invalid SConfig HTTP Status code.');
      try {
        body = JSON.parse(body);
        if(body.type === 'error') {
          e = new Error(body.message || 'Failed to contact server.');
          e.code = body.code;
        }
      } catch(ef) {}
      return done(e);
    }
    done(null, body);
  });
};