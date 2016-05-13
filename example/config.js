/*
* Request a configuration file and cache it.
* */
var sconfig = require('../index.js'); //require('sconfig');

sconfig({
  version: '{YOUR_VERSION}', // defaults to latest
  key: '{YOUR_API_KEY}',
  sync: true
}, function(err, config) {
  console.log("OK", config);
});
