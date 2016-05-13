var api = require('./lib/api'),
  fs = require('fs'),
  path = require('path');

const DEFAULT_PERSIST_FILE = path.normalize(process.cwd() + '/.sconfig');

var API_KEY = null,
  VERSION = null,
  ENV = null; // TODO: the env should be stripped out.

/*
* Calls the sconfig API for the given environment with the given api key/secret
* OPTIONS:
*   env (string) - the environment to fetch the config. Defaults to NODE_ENV
*   key (string) - the API Key to use, if not specified, we look in the SCONFIG_KEY env var.
*   secret (string) - the API Secret to use, if not specified, we look in the SCONFIG_SECRET env var
*   sync (bool=false) - if set to true, we will persist the config locally in the eventuality that sconfig is down.
* */
module.exports = function initSConfig(opt, onDone) {
  if(typeof opt !== 'object' || !opt) opt = {};
  var key = opt.key || process.env.SCONFIG_KEY || null,
    version = opt.version || process.env.SCONFIG_VERSION || null,
    persistFile = null;
  if(key && !API_KEY) API_KEY = key;
  if(version) VERSION = version;
  if(!key && API_KEY) key = API_KEY;
  if(opt.sync) {
    persistFile = (typeof opt.sync === 'string' ? path.normalize(opt.sync) : DEFAULT_PERSIST_FILE);
  }
  var done = (typeof onDone === 'function' ? onDone : function noop(e) {
    if(typeof e !== 'undefined') {
      console.error('SConfig:', e);
    }
  });

  /* Check for api key or secret. */
  if(!key) return handleError(new Error('Please specify the SConfig API Key and Secret'));
  key = key.trim();

  /* Persists data to disk. */
  function doPersist(data, fn) {
    if(!opt.sync) return fn();
    fs.writeFile(persistFile, data, { encoding: 'utf8' }, function(err) {
      if(err) {
        err.message = "Failed to persist sconfig response to: " + persistFile + ": " + err.message;
        return fn(err);
      }
      fn();
    });
  }

  /* Tries to read from the persist file if exists. */
  function handleError(err) {
    if(!persistFile) return done(err);
    fs.readFile(persistFile, { encoding: 'utf8' }, function(e, data) {
      if(e) {
        if(e.code === 'ENOENT') return done(err);
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
    if(opt.json === true) {
      try {
        data = JSON.parse(data);
      } catch(e) {
        console.warn('SConfig: received invalid JSON data.');
        return done(new Error('SConfig: invalid JSON object: ' + data));
      }
      return done(null, data);
    }
    /* By default, we check to see if we have and  */
    if(data.indexOf("=") === -1) return done(null, data);
    data = data.replace(/\r/g, '');
    var keys = data.split('\n'),
      cfg = {};
    for(var i=0; i < keys.length; i++) {
      keys[i] = keys[i].trim();
      if(keys[i] === '') continue;
      var tmp = keys[i],  // at this point, it is KEY=VAL.
        eqIdx = tmp.indexOf('=');
      if(tmp.charAt(0) === "#" || (tmp.charAt(0) === "/" && tmp.charAt(1) === "/")) continue; //we skip comments
      if(eqIdx === -1) {
        console.warn('SConfig: config field invalid: [%s]', tmp);
        continue;
      }
      var key = tmp.substr(0, eqIdx).trim(),
        val = tmp.substr(eqIdx+1).trim();
      process.env[key] = val;
      cfg[key] = val;
    }
    done(null, cfg);
  }

  api.fetch(key, version, function(err, data) {
    if(err) return handleError(err);
    doPersist(data, function(e) {
      if(e) return done(e);
      processResponse(data);
    });
  });
};