// weather.js
//
// Hit the NWS API to find out the local weather conditions
//

const baseuri  = "https://api.weather.gov/";
const pointuri = baseuri + "points/%s,%s/";

// TODO: BETTER ERROR HANDLING
function c_to_f(c) {
    // Returns temperature converted from C to F and in readable string.
    let f = Math.round(c * 9.0 / 5.0 + 32) + " degrees";
    return f;
}

// TODO: BETTER ERROR HANDLING
function ms_to_mph(ms) {
    // Convert wind speed in meters/second into
    // a human readable string in mph.
    let ws = "";
    if (ms) {
	let mph = number(ms) * 2.236936;
	let ws = "Wind speed: calm";
	if (mph >= 1) {
	    ws = "Wind speed: " + Math.round(mph) + " mph";
	}
    }
    return ws;
}

export default class weather {

    constructor(latlon) {
	this.latlon = latlon;
	this.updated = this.detailedForecast = null;
    }

    toString() {
	return (this.detailedForecast);
    }

    getForecast() {
    }

    getStations() {
    }
}
