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
        const theUrl = 'https://serve.pubapp.network/adserver/ssp/btrk?p1=' + p1 + '&p2=' + p2 + '&p3=' +  p3;
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
        xmlHttp.onload = function() {
            console.log("Http Status Code: " + xmlHttp.status + " readyState: " + xmlHttp.readyState + " StatusText: " + xmlHttp.statusText);
        };
        xmlHttp.send( null );
    }

    getUuid({ uuid = '', fsUuid = ''}) {
        return (uuid.length) ? uuid : fsUuid;
    }

    getEnv ({ env= '', fsEnv = ''}) {
        return (env.length) ? env : fsEnv;
    }

    getHbPb ({ hbPb= '', fsPb = ''}) {
        return (hbPb.length) ? hbPb : fsPb;
    }

    getCacheHost ({ cacheHost = '', fsCacheHost = ''}) {
        return (cacheHost.length) ? cacheHost : fsCacheHost;
    }

    getCachePath ({ cachePath = '', fsCachePath = ''}) {
        return (cachePath.length) ? cachePath : fsCachePath;
    }

    getSize ({ size = '', fsSize = ''}) {
        return (size.length) ? size : fsSize;
    }

    getAdId ({ adId = '', fsAdId = ''}) {
        return (adId.length) ? adId : fsAdId;
    }
}
