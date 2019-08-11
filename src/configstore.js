import logger from 'redux-logger'
import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import routes from './routesMap'
import { mapMiddleware, errorReporter } from './middleware'
import { bookmarks, map, page } from './reducers'

// This object defines where the storage takes place,
// in this case, it's in local storage in your browser.
const persistConfig = {
    key: "root",
    storage,
}

export default function configStore(preloadedState) {
    const { reducer, middleware, enhancer } = routes;
    const rootReducer =
    // persistReducer(persistConfig,
        combineReducers({
            bookmarks,
            map,
            page,
            location: reducer
        })
//    )
    const middlewares = applyMiddleware(middleware, mapMiddleware, errorReporter, logger)
    const composeEnhancers =
        typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?
            window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({}) : compose
    const enhancers = composeEnhancers(enhancer, middlewares);
    const store = createStore(rootReducer, preloadedState, enhancers);
    let persistor = persistStore(store)
    return { store, persistor }
}
