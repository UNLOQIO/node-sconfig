var request = require('request'),
  crypto = require('crypto');
const API_URL = 'https://api.sconfig.io',
  API_TIMEOUT = 5000;
/*
 * API file that uses request to fetch data
 * */
module.exports.getConfig = function FetchData(key, secret, version, done) {
  var url = API_URL + '/config';
  if (typeof version === 'string' || typeof version === 'number') {
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
  request.get(url, opt, parseResponse(done, secret));
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

function parseResponse(done, secret) {
  return function(err, resp, body) {
    if (err) {
      return done(err);
    }
    if (resp.statusCode >= 399 || resp.statusCode < 200) {
      var e = new Error('SConfig servers are currently unavailable.');
      e.code = 'SERVER_ERROR';
      try {
        body = JSON.parse(body);
        if (typeof body.error === 'object') {
          var serr = body.error;
          if (serr.code) e.code = serr.code;
          if (serr.message)e.message = serr.message;
        }
      } catch (ef) {
      }
      return done(e);
    }
    if(typeof secret !== 'string' || !secret) return done(null, body);
    var content = decryptContent(body, secret);
    if(content === false) {
      var e = new Error('Configuration data could not be decrypted.');
      e.code = 'DECRYPT';
      return done(e);
    }
    done(null, content);
  }
}

function decryptContent(data, secret) {
  if (typeof data !== 'string' || !data || typeof secret !== 'string' || !secret) {
    return false;
  }
  try {
    var decipher, iv;
    if (data.charAt(32) === '$') {
      iv = data.substr(0, 32);
      data = data.substr(33);
      try {
        iv = new Buffer(iv, 'hex');
      } catch (e) {
      }
    }
    if (iv) {
      decipher = crypto.createDecipheriv('aes-256-cbc', secret, iv);
    } else {
      decipher = crypto.createDecipher('aes-256-cbc', secret);
    }
    var decoded = decipher.update(data, 'hex', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
  } catch (e) {
    return false;
  }
}