<script src = "https://cdn.jsdelivr.net/npm/prebid-universal-creative/dist/creative.js"></script>
<script>
var adId = "%%PATTERN:hb_adid%%";
var host = "%%PATTERN:hb_cache_host%%";
var cachePath = "%%PATTERN:hb_cache_path%%";
var uuid = "%%PATTERN:hb_cache_id%%";
var mediaType = "%%PATTERN:hb_format%%";
var pubUrl = "%%PATTERN:url%%";

try {    
    pbjs.renderAd(document, adId, {host: host, cachePath: cachePath, uuid: uuid, mediaType: mediaType, pubUrl: pubUrl});
} catch(e) {
    console.log(e);
}
</script>