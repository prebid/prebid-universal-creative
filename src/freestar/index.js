import {sendRequest} from "../utils";

export class Freestar {

    constructor(targetingData) {
        this.env = this.getEnv(targetingData);
        this.uuid = this.getUuid(targetingData);
        this.hbPb = this.getHbPb(targetingData);
        this.cacheHost = this.getCacheHost(targetingData);
        this.cachePath = this.getCachePath(targetingData);
        this.size = this.getSize(targetingData);
        this.adId = this.getAdId(targetingData);
    }

    appBidTrack (p1, p2 = "-", p3 = "-") {
        const fsAppTrackURL = 'https://serve.pubapp.network/adserver/ssp/btrk?p1=' + p1 + '&p2=' + p2 + '&p3=' +  p3;
        const callback = function(responseText) {
            console.log(responseText);
        };
        sendRequest(fsAppTrackURL, callback);
    }

    getHbPb ({ hbPb= '', fsPb = '', t13Pb = ''}) {
        return (hbPb.length) ? hbPb : (fsPb.length) ? fsPb : t13Pb;
    }

    getUuid({ uuid = '', fsUuid = '', t13Uuid = ''}) {
        return (uuid.length) ? uuid : (fsUuid.length) ? fsUuid : t13Uuid;
    }

    getEnv ({ env= '', fsEnv = '', t13Env = ''}) {
        return (env.length) ? env : (fsEnv.length) ? fsEnv : t13Env;
    }

    getCacheHost ({ cacheHost = '', fsCacheHost = '', t13CacheHost = ''}) {
        return (cacheHost.length) ? cacheHost : (fsCacheHost.length) ? fsCacheHost : t13CacheHost;
    }

    getCachePath ({ cachePath = '', fsCachePath = '', t13CachePath = ''}) {
        return (cachePath.length) ? cachePath : (fsCachePath.length) ? fsCachePath : t13CachePath;
    }

    getSize ({ size = '', fsSize = '', t13Size = ''}) {
        return (size.length) ? size : (fsSize.length) ? fsSize : t13Size;
    }

    getAdId ({ adId = '', fsAdId = '', t13AdId = ''}) {
        return (adId.length) ? adId : (fsAdId.length) ? fsAdId : t13AdId;
    }
}
