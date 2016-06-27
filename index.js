var api = require('./lib/api'),
  fs = require('fs'),
  crypto = require('crypto'),
  path = require('path');

const DEFAULT_PERSIST_FILE = path.normalize(process.cwd() + '/.sconfig'),
  DEFAULT_SIGN_ALG = 'sha256';

var API_KEY = null,
  VERSION = null,
  ENV = null; // TODO: the env should be stripped out.


/**
 * Calls the sconfig API for the given environment with the given api key/secret
 * OPTIONS:
 *   env (string) - the environment to fetch the config. Defaults to NODE_ENV
 *   key (string) - the API Key to use, if not specified, we look in the SCONFIG_KEY env var.
 *   secret (string) - the API Secret to use, if not specified, we look in the SCONFIG_SECRET env var
 *   sync (bool=false) - if set to true, we will persist the config locally in the eventuality that sconfig is down.
 * */
module.exports = function initSConfig(opt, onDone) {
  if (typeof opt !== 'object' || !opt) opt = {};
  var key = opt.key || process.env.SCONFIG_KEY || null,
    version = opt.version || process.env.SCONFIG_VERSION || null,
    persistFile = null;
  if (key && !API_KEY) API_KEY = key;
  if (version) VERSION = version;
  if (!key && API_KEY) key = API_KEY;
  if (opt.sync) {
    persistFile = (typeof opt.sync === 'string' ? path.normalize(opt.sync) : DEFAULT_PERSIST_FILE);
  }
  var done = (typeof onDone === 'function' ? onDone : function noop(e) {
    if (typeof e !== 'undefined') {
      console.error('SConfig:', e);
    }
  });

  /* Check for api key or secret. */
  if (!key) return handleError(new Error('Please specify the SConfig API Key and Secret'));
  key = key.trim();

  /* Persists data to disk. */
  function doPersist(data, fn) {
    if (!opt.sync) return fn();
    fs.writeFile(persistFile, data, {encoding: 'utf8'}, function(err) {
      if (err) {
        err.message = "Failed to persist sconfig response to: " + persistFile + ": " + err.message;
        return fn(err);
      }
      fn();
    });
  }

  /* Tries to read from the persist file if exists. */
  function handleError(err) {
    if (!persistFile) return done(err);
    fs.readFile(persistFile, {encoding: 'utf8'}, function(e, data) {
      if (e) {
        if (e.code === 'ENOENT') return done(err);
        console.warn('SConfig: failed to read from persisted config: %s', persistFile);
        console.log(e);
        return done(e);
      }
      console.warn("SConfig: server request failed, reading from persisted file.", err);
      processResponse(data);
    });
  }

  /* Processes the data */
  function processResponse(data) {
    if (opt.json === true) {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn('SConfig: received invalid JSON data.');
        return done(new Error('SConfig: invalid JSON object: ' + data));
      }
      return done(null, data);
    }
    /* By default, we check to see if we have and  */
    if (data.indexOf("=") === -1) return done(null, data);
    data = data.replace(/\r/g, '');
    var keys = data.split('\n'),
      cfg = {};
    for (var i = 0; i < keys.length; i++) {
      keys[i] = keys[i].trim();
      if (keys[i] === '') continue;
      var tmp = keys[i],  // at this point, it is KEY=VAL.
        eqIdx = tmp.indexOf('=');
      if (tmp.charAt(0) === "#" || (tmp.charAt(0) === "/" && tmp.charAt(1) === "/")) continue; //we skip comments
      if (eqIdx === -1) {
        console.warn('SConfig: config field invalid: [%s]', tmp);
        continue;
      }
      var key = tmp.substr(0, eqIdx).trim(),
        val = tmp.substr(eqIdx + 1).trim();
      process.env[key] = val;
      cfg[key] = val;
    }
    done(null, cfg);
  }

  api.getConfig(key, version, function(err, data) {
    if (err) return handleError(err);
    doPersist(data, function(e) {
      if (e) return done(e);
      processResponse(data);
    });
  });
};


/**
 * Manually set the API key of the project.
 * */
module.exports.apiKey = function(v) {
  API_KEY = v;
  return this;
};

/**
 * Signs the given payload using the given secret key.
 * Options:
 *  - ttl - the time-to-live of the signature in seconds. Defaults to 60
 *  The signing algorithm is:
 *  - if payload is string, number, boolean, call toString().
 *  - Stringify using JSON.stringify() the given payload
 *  - Use HmacSHA256 with the given secret key.
 *
 *  SIGNATURE STRUCTURE:
 *    headerData: {
 *      e: {expireAtTimestamp}
 *    }
 *
 *    signature = {base64(headerData)}.{headerSign}.{payloadSign}
 * */
module.exports.signPayload = function(payload, secret, ttl) {
  if (typeof payload === 'undefined' || payload == null) return false;
  if (typeof secret !== 'string') return false;
  secret = secret.toString();
  var payloadSign = signPayload(payload, secret);
  if (!payloadSign) return false;
  if (typeof ttl === 'undefined') ttl = 60;
  var expireAt = Date.now() + ttl * 1000;
  var header = signHeader({
    e: expireAt
  }, secret);
  if (!header) return false;
  return header.data + '.' + header.sign + '.' + payloadSign;
};

/**
 * Verifies the payload's signature with the given signature, using the common secret.
 * */
module.exports.verifyPayloadSignature = function(fullSignature, payload, secret) {
  if (typeof fullSignature !== 'string' || !fullSignature || typeof secret !== 'string' || !secret) return false;
  if (typeof payload === 'undefined' || payload == null) return false;
  var now = Date.now(),
    tmp = fullSignature.split('.');
  if (tmp.length !== 3) return false;
  var incHeaderData = tmp[0],
    incHeaderSign = tmp[1],
    incPayloadSign = tmp[2];
  // step one, verify the header & if the signature expired.
  try {
    var headerData = new Buffer(incHeaderData, 'base64').toString('ascii');
    headerData = JSON.parse(headerData);
    var headerSign = signHeader(headerData, secret);
    if (!headerSign || headerSign.sign !== incHeaderSign) return false;  // header signatures are not equal.
    if (now >= headerData.e) return false;
  } catch (e) {
    return false;
  }
  // next, verify the actual payload signature.
  var payloadSignature = signPayload(payload, secret);
  if (!payloadSignature || payloadSignature !== incPayloadSign) return false;
  return true;
};

/**
 * Returns the expiration date of a given signature
 * */
module.exports.getSignatureExpiration = function(fullSignature) {
  try {
    var tmp = fullSignature.split('.'),
      headerData = tmp[0];
    headerData = new Buffer(headerData, 'base64').toString('ascii');
    headerData = JSON.parse(headerData);
    return headerData.e || false;
  } catch (e) {
    return false;
  }
};

/**
 * Creates an sconfig.io signature key.
 * Note: the result will havE:
 * {
 *    token: {signatureToken},
 *    secret: {signatureSecret, visible only once.}
 * }
 * */
module.exports.createSignature = function(data, done) {
  if (typeof data === 'function') {
    done = data;
    data = {};
  }
  if(typeof done !== 'function') {
    console.warn('sconfig: createSignature requires a callback.');
    return false;
  }
  if (!API_KEY) {
    var e = new Error("Please initialize the sconfig module with the API Key.");
    e.code = 'API_KEY';
    return done && done(e);
  }
  if(!data) data = {};
  api.post(API_KEY, '/signature', data, function(e, res) {
    if(e) return done(e);
    return done(null, res.result);
  });
};

function signHeader(headerData, secret) {
  if (typeof headerData !== 'string') headerData = JSON.stringify(headerData);
  try {
    var sign = crypto.createHash(DEFAULT_SIGN_ALG, secret).update(headerData).digest('base64');
    headerData = new Buffer(headerData, 'ascii').toString('base64');
    return {
      data: headerData,
      sign: sign
    }
  } catch (e) {
    return false;
  }
}

function signPayload(payload, secret) {
  if (typeof secret !== 'string' || secret.length !== 32) return false;
  var payloadString;
  if (typeof payload === 'object' && payload) {
    try {
      payloadString = JSON.stringify(payload);
    } catch (e) {
      return false;
    }
  } else {
    payloadString = payload.toString();
  }
  try {
    return crypto.createHash(DEFAULT_SIGN_ALG, secret)
      .update(payloadString)
      .digest('base64');
  } catch (e) {
    return false;
  }
}