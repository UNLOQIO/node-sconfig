/*
* Request a configuration file and cache it.
* */
var sconfig = require('../index.js'); //require('sconfig');

sconfig({
  env: '{YOUR_ENVIRONMENT}',
  key: '{YOUR_API_KEY}',
  secret: '{YOUR_API_SECRET}',
  sync: true
}, function(err, config) {
  console.log("OK", config, process.env);
});