// These are constants for use in the Clatsop county area.
import {fromLonLat, transformExtent} from 'ol/proj';

export const WGS84 = "EPSG:4326";
export const WM = "EPSG:3857";

export const myGeoServer = "https://geoserver.wildsong.biz/geoserver";
export const myArcGISServer = "https://delta.co.clatsop.or.us/server/rest/services";

export const workspace = "clatsop";
export const astoria_ll = [-123.834,46.187];

// Limits for Clatsop County
export const MINZOOM =  9   // entire county will be visible at this level
export const MAXZOOM = 20
export const MAXRESOLUTION = 10
export const XMIN = -124.3
export const YMIN =  45.75
export const XMAX = -123.0
export const YMAX =  46.3
export const DEFAULT_CENTER = [ XMIN + (XMAX-XMIN)/2, YMIN + (YMAX-YMIN)/2 ]
export const DEFAULT_ZOOM = 10
export const EXTENT_LL = [XMIN,YMIN, XMAX,YMAX]
export const EXTENT_WM = transformExtent(EXTENT_LL, WGS84, WM);

export const BOOKMARKS = {
    "Astoria" :          { pos: fromLonLat(astoria_ll), zoom: 13, permanent:true},
    "Cannon Beach" :     { pos: fromLonLat([-123.969,45.893]),   zoom: 13, permanent:true},
    "Gearhart" :         { pos: fromLonLat([-123.9188,46.026]),  zoom: 13, permanent:true},
    "Hammond" :          { pos: fromLonLat([-123.9520,46.2000]), zoom: 14, permanent:true},
    "Jewell" :           { pos: fromLonLat([-123.5032,45.9345]), zoom: 14, permanent:true},
    "Neahkahnie Beach" : { pos: fromLonLat([-123.9407,45.7297]), zoom: 13, permanent:true},
    "Seaside" :          { pos: fromLonLat([-123.920,45.994]),   zoom: 12, permanent:true},
    "Warrenton" :        { pos: fromLonLat([-123.924,46.165]),   zoom: 13, permanent:true},
    "Westport" :         {pos: [-13734105.721610297, 5801408.4432601975], zoom: 15, permanent: true},
}
// I added Westport by adding it in the GUI and then copy/paste from debugger

export const usngPrecision = [
// dec   zoom
    0, // 0
    0, // 1
    0, // 2
    1, // 3
    1, // 4
    2, // 5
    2, // 6
    3, // 7
    3, // 8
    3, // 9
    3, // 10
    4, // 11
    4, // 12
    5, // 13
    5, // 14
    5, // 15
    5, // 16
    6, // 17
    6, // 18
    6, // 19
    6, // 20
    6, // 21
];

export const llPrecision = [
// dec   zoom
    0, // 0
    0, // 1
    0, // 2
    0, // 3
    1, // 4
    1, // 5
    1, // 6
    1, // 7
    2, // 8
    2, // 9
    2, // 10
    2, // 11
    2, // 12
    3, // 13
    3, // 14
    3, // 15
    4, // 16
    4, // 17
    5, // 18
    5, // 19
    5, // 20
    6, // 21
];
