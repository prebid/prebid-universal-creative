# Prebid Universal Creative

Prebid Universal Creative is a javascript api to render multiple formats. This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following formats:
 - Banner
 - Outstream Video
 - Mobile
 - AMP creatives
 - All safeFrame creatives
 
## Usage

You can find a detailed explanations on the [Prebid Universal Creative](http://prebid.org/overview/prebid-universal-creative.html) and [AdOps - Add Creative](http://prebid.org/adops/step-by-step.html#step-2-add-a-creative) pages.

> **important:** If you’re using the `Send All Bids` scenario (where every bidder has a separate order), the creative and targeting will be different from the example shown here. See [Send All Bids](http://prebid.org/adops/send-all-bids-adops.html) for details.

```html
<script src = "https://cdn.jsdelivr.net/npm/prebid-universal-creative@latest/dist/%%PATTERN:hb_format%%.js"></script>
<script>
  var ucTagData = {};
  ucTagData.adServerDomain = "";
  ucTagData.pubUrl = "%%PATTERN:url%%";
  ucTagData.targetingMap = %%PATTERN:TARGETINGMAP%%;
  ucTagData.requestAllAssets = true;

  try {
    ucTag.renderAd(document, ucTagData);
  } catch (e) {
    console.log(e);
  }
</script>
```

Creative created like described above will work for all formats:
- amp
- banner
- mobile
- native
- video (outstream video)

Which means that the same creative code can be reused on all formats.  
Universal creative library is loaded with `%%PATTERN:hb_format%%.js` path. Which means for each `hb_format` targeting key-value, separate `.js` library will be loaded.

> Note: Some build tools make explicit use of Node features which have been introduced in version *8.9.0*. Please make sure you're using the correct Node version (>8.9.0) before you proceed to create your own build using the commands listed below.

## Install

    $ git clone https://github.com/prebid/prebid-universal-creative.git
    $ cd prebid-universal-creative
    $ npm install

*Note:* You need to have `NodeJS` 8.9.x or greater installed.

*Note:* We have upgraded from Gulp v3.9.1 to Gulp v4.0.2. In accordance with the change, you need to have `gulp-cli` installed globally. This won't impact any other project using `gulp`.

If you have a version of `gulp` installed globally, you may need to uninstall it to continue. You can run `gulp -v` and check the version of the `CLI` field to see if it's installed. If the major version is `2`, you already have `gulp-cli` installed and can run `gulp` commands. If the `CLI` version is same as the `Local` version, you need to uninstall `gulp` globally.

To uninstall the old package globally, run the command: `npm uninstall -g gulp`. <br />
To install `gulp-cli` globally, run the command: `npm install -g gulp-cli`.

Run `gulp -v` just to make sure that the `CLI` major version is `2`. You're now good to run `gulp` commands.

## Build for development

    $ gulp serve

Starts a web server at `http://localhost:9999` serving from the project root and generates the following files:

+ `./build/creative.js` - Full source code for dev and debug
+ `./build/creative.js.map` - Source map for dev and debug

## Build for production

We publish `prebid-universal-creative` as npm package on npmjs.com

When we run `npm publish`, prepublish script of package.json is executed. Scripts given in prepublish Run BEFORE the package is packed and published. See https://docs.npmjs.com/misc/scripts

`gulp build` is executed before publish. It creates two files in dist directory

+ `./dist/amp.js` - Minified amp.js source code (responsible for rendering amp ads)
+ `./dist/banner.js` - Minified banner.js source code (responsible for rendering banner ads)
+ `./dist/mobile.js` - Minified mobile.js source code (responsible for rendering mobile ads)
+ `./dist/native.js` - Minified native.js source code (responsible for rendering native ads)
+ `./dist/video.js` - Minified video.js source code (responsible for rendering outstream video ads)

[jsDelivr](https://www.jsdelivr.com/) – Open Source CDN is used to serve creative.js file.

## Test

We like to test a lot before releasing newer versions. 

   ```
   gulp test // Run unit tests in your local environment
   ```

   Set the environment variables. You may want to add these to your `~/.bashrc` for convenience.

   ```
   export BROWSERSTACK_USERNAME="my browserstack username"
   export BROWSERSTACK_ACCESS_KEY="my browserstack access key"
   ```
   
   ```
   gulp test --browserstack
   ```

   For End to End testing, 
   - Set `test.localhost` in your hosts file. 
   
   ```
   gulp e2e-test
   ``` 

   Reason to add specific host to your host file is
   - To test against your local build, we had to give local path in dfp creative. Redirecting request is not possible in browserstack.
   - On localhost domain you do not receive bid from certain SSP's, hence you have to have some host defined in hosts file. As of now we are using `test.localhost` defined in local host file as well as `DFP creative`.
## Contributing

Found a bug? Great!
This project is in its infancy, and many things can be improved.

Report bugs, request features, and suggest improvements [on Github](https://github.com/prebid/prebid-universal-creative/issues).

Or better yet, [open a pull request](https://github.com/prebid/prebid-universal-creative/compare) with the changes you'd like to see.

