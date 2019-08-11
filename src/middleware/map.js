import { actions } from '../actions'
import { router, setMapQuery } from '../reducers'

export const mapMiddleware = store => {
    return next => action => {
        try {
            const state = store.getState()
            //console.log("mapMiddleware action=",action, " state=",state);
            switch (action.type) {
                case actions.SETMAPCENTER:
                    // Calling "page" reducer will cause the URL address to update (and push to history).
                    store.dispatch({type:"MAP",
                        payload: {
                            query: setMapQuery(action.payload.center, action.payload.zoom)
                        }
                    }, state)
                    break;
                default:
                    //console.log('mapMiddleware action', action.type, action);
                    break;
            }
            return next(action)
        } catch(err) {
            console.error('mapMiddleware error', err)
            throw err
        }
    }
}
