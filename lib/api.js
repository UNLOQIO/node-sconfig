var request = require('request');
const API_URL = 'https://api.sconfig.io',
  API_TIMEOUT = 5000;
/*
* API file that uses request to fetch data
* */
module.exports.getConfig = function FetchData(key, version, done) {
  var url = API_URL + '/config';
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
  request.get(url, opt, parseResponse(done));
};

module.exports.post = function(key, url, data, done) {
  var url = API_URL + url;
  var opt = {
    method: 'POST',
    url: url,
    timeout: API_TIMEOUT,
    followRedirect: false,
    followRedirects: false,
    json: data || {},
    headers: {
      'Authorization': 'Bearer ' + key
    }
  };
  request(opt, parseResponse(done));
};

function parseResponse(done) {
  return function(err, resp, body) {
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
  }
}