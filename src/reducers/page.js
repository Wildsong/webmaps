import { NOT_FOUND } from 'redux-first-router'

const components = {
    HOME:  'Map',  // this effectively is a redirect for now, not really what I want though

    MAP:   'Map',
    HELP:  'Help',
    FAQ:   'Faq',
    NEWS:  'News',
    ABOUT: 'About',
    [NOT_FOUND]: 'NotFound'
}

export const page = (state = 'Home', action = {}) => {
    const newState = components[action.type] || state
    //console.log("page reducer: ", action.type, " state=", state, " newState=", newState);
    return newState
}
