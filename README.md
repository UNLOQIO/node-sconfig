# Installation
`npm i --save sconfig`

# What it is
 Node.js client for sconfig.io  

## Usage
```javascript
var sconfig = require('sconfig');

sconfig({
  key: '{YOUR_API_KEY}',
  version: '{YOUR_VERSION}', // defaults to latest
  sync: true
}, function(err, config) {
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
