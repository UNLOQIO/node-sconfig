/**
 * Fetch configuration data using an API Key and the Application Secret Key.
 * By doing so, the sconfig servers will just apply firewall rules (if any) and return
 * the encrypted configuration data. The client will then decrypt the configuration
 * data using the App Secret Key
 * Note: Ff no API Key or App Secret is provided, it will look for it in process.env.SCONFIG_KEY and process.env.SCONFIG_SECRET
 * */
var sconfig = require('sconfig');

sconfig({
  key: '{YOUR_API_KEY}',    // the 32-char version of an API Key
  secret: '{YOUR_APP_SECRET}',  // the 32 char secret key found under the App Details tab
  //version: '{YOUR_VERSION}', // version name to fetch, defaults to latest version created
  // json: true               // expect the result data to be JSON. This is true by default.
  sync: true                  // persist the configuration data locally in the event of an sconfig server outage
}, function(err, config) {
  if (err) {
    console.log(err);
    return;
  }
  console.log("OK", config);
});