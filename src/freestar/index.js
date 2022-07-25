export class Freestar {
    appBidTrack (p1, p2 = "-", p3 = "-") {
        var theUrl = 'https://serve.pubapp.network/adserver/ssp/btrk?p1=' + p1 + '&p2=' + p2 + '&p3=' +  p3;
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
        xmlHttp.onload = function() {
            console.log("Http Status Code: " + xmlHttp.status + " readyState: " + xmlHttp.readyState + " StatusText: " + xmlHttp.statusText);
        };
        xmlHttp.send( null );
    }

}
