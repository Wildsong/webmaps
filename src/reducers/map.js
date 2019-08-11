import { actions } from '../actions'
import Geohash from '@geonet/geohash'
import { DEFAULT_CENTER,MINZOOM } from '../constants'

const initialState = {
    center: DEFAULT_CENTER,
    zoom: MINZOOM
}

// Queries that I can understand include
//   g=Geohash
//   z=ZoomLevel
// Someday I might offer more options:
//   lat=LAT&lng=LONG
//   layers=SOMEKINDOFLAYERHASH

function getMapQuery(query) {
    // Unpack my query object into an object that I can understand.
    // In real life, I'd convert the geohash from query to center coord here.
    const ll = Geohash.decode(query.g)
    return {
        center: [ll.lng, ll.lat],
        zoom:   Number(query.z),
    }
}
export function getGeohash(ll) {
    return Geohash.encode(ll[0], ll[1], 8) // 7 digits=about 150m
}
export function setMapQuery(lonlat, zoom) {
    // Pack the reasonably named state settings into a compact querystring format
    const query = {}
    console.log("setMapQuery", lonlat);
    if (lonlat[0] && lonlat[1])
        query["g"] = getGeohash(lonlat);
    if (zoom !== undefined && zoom)
        query["z"] = (Math.round(zoom)).toString();
    return query
}

export const map = (state=initialState, action={}) => {
    let newState;
    switch(action.type) {
        case actions.MAP:
            try {
                console.log("map reducer: Loading state from query: ", action.meta.query);
                newState = getMapQuery(action.meta.query)
            } catch(err) {
                console.log("map reducer: Could not decode query.", state, err);
                return state;
            }
            break;

        case actions.SETMAPCENTER:
            newState = action.payload
            break;

        default:
            console.log("map reducer:", action.type, " (state not changed)", state);
            return state;
    }

    console.log("map reducer:", action.type, state, " =>", newState);
    return newState;
}
