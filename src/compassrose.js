// Wrap the compass up as a class so it's easy to include.

import olextCompass from 'ol-ext/control/Compass.js'

/*
  This is a way to get Parcel to include compass.png as an asset and
  to convert its name to something we can use (it will be bundled
  with a name like "compass.hk78789897hj.png". Parcel will properly
  bundle png's and rename them if you reference them in CSS too but I
  could not see how that applied in this case.
*/
import compassUrl from '/images/compass.png';
console.log('compassUrl = ', compassUrl);

export class CompassRose {
    constructor() {
    	this.mapControl = new olextCompass({
    	    className: "left",
    	    src: compassUrl
    	    //    style: strokestyle
    	});
    }

    toString() {
	    return ('this is a compass');
    }
}
