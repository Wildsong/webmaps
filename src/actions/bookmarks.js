import {BOOKMARK} from './action-types'

export function addBookmark({ location, zoom, title }) {
    console.log("actions.addBookmark", location, zoom, title);
    return {
        type: BOOKMARK.ADD,
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
        type: BOOKMARK.DELETE,
        payload: {
            id,
        },
    };
}
