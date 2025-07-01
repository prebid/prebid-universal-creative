# Prebid Universal Creative

Prebid Universal Creative is a javascript api to render multiple formats. This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following formats:
 - Banner
 - Outstream Video
 - Mobile
 - AMP creatives
 - All safeFrame creatives
 
## Usage

You can find a detailed explanations on the [Prebid Universal Creative](https://docs.prebid.org/overview/prebid-universal-creative.html) and [AdOps - Add Creative](https://docs.prebid.org/adops/setting-up-prebid-with-the-appnexus-ad-server.html#step-3-add-creatives) pages.

### File Selection for Different Platforms

**Generic template:**
```html
<script src = "https://cdn.jsdelivr.net/npm/prebid-universal-creative@latest/dist/PUCFILE"></script>
```

**Replace "PUCFILE" with:**
- **Prebid.js**: `%%PATTERN:hb_format%%.js` - This dynamically loads the appropriate creative file based on the ad format
- **Prebid Mobile**: `mobile.js` or `creative.js` - the latter is recommended so that the creative could be reused for both desktop and mobile.

> **Important Note about File Compatibility:**
> - Both `creative.js` and `mobile.js` work for mobile implementations
> - `creative.js` is more general and **will work for both desktop and mobile**
> - `banner.js`, `native.js`, `video.js` - contain **only desktop creative rendering code** and do not support mobile

**Example for Prebid Mobile:**
```html
<script src = "https://cdn.jsdelivr.net/npm/prebid-universal-creative@latest/dist/creative.js"></script>
<script>
  var ucTagData = {};
  ucTagData.adServerDomain = "";
  ucTagData.pubUrl = "%%PATTERN:url%%";
  ucTagData.targetingMap = %%PATTERN:TARGETINGMAP%%;
  ucTagData.hbPb = "%%PATTERN:hb_pb%%";
  ucTagData.hbFormat = "%%PATTERN:hb_format%%";
  ucTagData.adId = "%%PATTERN:hb_adid%%";
  ucTagData.requestAllAssets = true;

  try {
    ucTag.renderAd(document, ucTagData);
  } catch (e) {
    console.log(e);
  }
</script>
```

**Example for Prebid.js (Desktop/Web):**
```html
<script src = "https://cdn.jsdelivr.net/npm/prebid-universal-creative@latest/dist/%%PATTERN:hb_format%%.js"></script>
<script>
  var ucTagData = {};
  ucTagData.adServerDomain = "";
  ucTagData.pubUrl = "%%PATTERN:url%%";
  ucTagData.targetingMap = %%PATTERN:TARGETINGMAP%%;
  ucTagData.hbPb = "%%PATTERN:hb_pb%%";
  ucTagData.hbFormat = "%%PATTERN:hb_format%%";
  ucTagData.adId = "%%PATTERN:hb_adid%%";
  // if you're using GAM and want to track outbound clicks on native ads you can add this line
  ucTagData.clickUrlUnesc = "%%CLICK_URL_UNESC%%";
  ucTagData.requestAllAssets = true;

  try {
    ucTag.renderAd(document, ucTagData);
  } catch (e) {
    console.log(e);
  }
</script>
```

Creative created like described above will work for the following formats:
- amp
- banner
- native
- video (outstream video)

Universal creative library is loaded with `%%PATTERN:hb_format%%.js` path. For each `hb_format` targeting key-value, separate `.js` library will be loaded.  Which means that the same creative code can be reused for any format, however unfortunately not on mobile, because `mobile` is not one of the values that `hb_format` keyword could take.

> **important:** If you’re using the `Send All Bids` scenario (where every bidder has a separate order), the creative and targeting will be different from the example shown here. See [Send All Bids](https://docs.prebid.org/adops/send-all-vs-top-price.html#send-all-bids) for details and an example below.

### Send All Bids Configuration

For the "Send All Bids" scenario, use this template:

```html
<script src = "https://cdn.jsdelivr.net/npm/prebid-universal-creative@latest/dist/PUCFILE"></script>
<script>
  var ucTagData = {};
  ucTagData.adServerDomain = "";
  ucTagData.pubUrl = "%%PATTERN:url%%";
  ucTagData.adId = "%%PATTERN:hb_adid_BIDDERCODE%%";
  ucTagData.cacheHost = "%%PATTERN:hb_cache_host_BIDDERCODE%%";
  ucTagData.cachePath = "%%PATTERN:hb_cache_path_BIDDERCODE%%";
  ucTagData.uuid = "%%PATTERN:hb_cache_id_BIDDERCODE%%";
  ucTagData.mediaType = "%%PATTERN:hb_format_BIDDERCODE%%";
  ucTagData.env = "%%PATTERN:hb_env%%";
  ucTagData.size = "%%PATTERN:hb_size_BIDDERCODE%%";
  ucTagData.hbPb = "%%PATTERN:hb_pb_BIDDERCODE%%";
  // mobileResize needed for mobile GAM only
  ucTagData.mobileResize = "hb_size:%%PATTERN:hb_size_BIDDERCODE%%";
  // these next two are only needed for native creatives but are ok for banner
  ucTagData.requestAllAssets = true;
  ucTagData.clickUrlUnesc = "%%CLICK_URL_UNESC%%";

  try {
    ucTag.renderAd(document, ucTagData);
  } catch (e) {
    console.log(e);
  }
</script>
```

Replace "PUCFILE" as described above. Note the use of `BIDDERCODE` suffix in the targeting patterns, this implies that each bidder has separate line items with bidder-specific keyword targeting.

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
