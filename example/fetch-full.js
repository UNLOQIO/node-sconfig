/**
 * Fetch configuration data using a full configuration access.
 * By doing so, you must provide the "Full configuration access key" (the long key). This contains an encrypted version
 * of the application secret that the server will use to decrypt the configuration data.
 *
 * Note: If no API key is provided, it will look for it in process.env.SCONFIG_KEY
 * */
var sconfig = require('sconfig');

sconfig({
  key: '{YOUR_FULL_API_KEY}',
  //version: '{YOUR_VERSION}', // version to fetch, defaults to latest version created
  // json: true,                  // by default, expect JSON data and parse it.
  sync: true                  // persist the configuration data locally in the event of an sconfig server outage
}, function(err, config) {
  if (err) {
    console.log(err);
    return;
  }
  // configuration data available, cached and parsed
  console.log("OK", config);
});