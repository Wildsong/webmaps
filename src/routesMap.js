import { connectRoutes } from 'redux-first-router'
import queryString from 'query-string'

const base = '/maps'

const routesMap = {
    HOME:    base + '/',
    MAP:     base + '/map',
    ABOUT:   base + '/about',
    CONTACT: base + '/contact',
    FAQ:     base + '/faq',
    HELP:    base + '/help',
    NEWS:    base + '/news',
}
export default connectRoutes(routesMap, {
    querySerializer: queryString // This is what puts your queries into the address bar.
    //createHistory,  You can add "createHistory" here but it's not necessary
})
