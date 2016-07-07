# Installation
`npm i --save sconfig`

# What it is
 Node.js client for sconfig.io encrypted configuration storage


## How to get started
1. Login with UNLOQ (https://sconfig.io/download) at https://sconfig.io
2. Create an application with an environment and a minimal description. A default API key will be generated for you
3. Navigate to the Versions tab and create a new configuration version, giving it a name and selecting a content type
4. Enter some configuration data and save it
5. Go back to Details and view the API Key
6. Use either the full configuration access key or the zero-knowledge access key plus the application secret and place them in your application.

## Usage
```javascript
var sconfig = require('sconfig');

sconfig({
  key: '{YOUR_API_KEY}',
  version: '{YOUR_VERSION}', // version to fetch, defaults to the latest version
  sync: true                 // stores a copy of the latest configuration data locally in {process.cwd() + '/.sconfig}. 
                             // If sync is enabled, should the API servers be offline, it will load the cached configuration data.
                            // Add ".sconfig" this to .gitignore and .npmignore
}, function(err, config) {
 if(err) {
   console.error('Could not fetch configuration data', err);
   return;
 }
  console.log("OK", config);
  // start your app.
});
```
## Example applications
 - example/config.js
  
## License 
  [MIT](LICENSE)
(The MIT License)

Copyright (c) 2015-2016 UNLOQ Systems LTD

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
