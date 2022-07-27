export class Freestar {

    constructor() {
        this.fsPb = 'fsPb';
        this.hsPb = 'hsPb';
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
    normalizeDataObject (dataObject) {
        if (dataObject[this.fsPb] && dataObject[this.fsPb].length && !dataObject[this.hbPb].length) {
            dataObject.hbPb = dataObject[this.fsPb];
            if (dataObject.targetMapping) {
                dataObject.targetMapping['hb_pb'] = [dataObject[this.fsPb]];
                dataObject.targetMapping['fs_pb'] = [dataObject[this.fsPb]];
            }
        }
        return dataObject;
    }

}
