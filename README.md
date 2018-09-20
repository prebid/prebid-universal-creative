# Prebid Universal Creative

Prebid Universal Creative is a javascript api to render multiple formats. This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following formats:
 - Banner
 - Outstream Video
 - Mobile (Coming Soon)
 - AMP creatives
 - All safeFrame creatives

## Install

    $ git clone https://github.com/prebid/prebid-universal-creative.git
    $ cd prebid-universal-creative
    $ npm install

## Build for development

    $ gulp serve

Starts a web server at `http://localhost:9999` serving from the project root and generates the following files:

+ `./build/creative.js` - Full source code for dev and debug
+ `./build/creative.js.map` - Source map for dev and debug

## Build for production

We publish `prebid-universal-creative` as npm package on npmjs.com

When we run `npm publish`, prepublish script of package.json is executed. Scripts given in prepublish Run BEFORE the package is packed and published. See https://docs.npmjs.com/misc/scripts

`gulp build` is executed before publish. It creates two files in dist directory

+ `./dist/creative.js` - Minified creative.js source code
+ `./dist/creative.max.js` - Unminified source code to help in debugging.

The latest version of the creative.js file is hosted on the AppNexus CDN (https://acdn.adnxs.com).

## Contributing

Found a bug? Great!
This project is in its infancy, and many things can be improved.

Report bugs, request features, and suggest improvements [on Github](https://github.com/prebid/prebid-universal-creative/issues).

Or better yet, [open a pull request](https://github.com/prebid/prebid-universal-creative/compare) with the changes you'd like to see.

