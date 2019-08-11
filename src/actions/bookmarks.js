import { actions } from './action-types'

export function addBookmark({ location, zoom, title }) {
    console.log("actions.addBookmark", location, zoom, title);
    return {
        type: actions.ADD_BOOKMARK,
        payload: {
            location,
            zoom,
            title,
        },
    };
}
export function deleteBookmark( id ) {
    console.log("actions.deleteBookmark", id);
    return {
        type: actions.DELETE_BOOKMARK,
        payload: {
            id,
        },
    };
}
