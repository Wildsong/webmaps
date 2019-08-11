import { actions } from '../actions'

const initialState = {
    bookmarks: {
        1 : {location: [-123.836,46.182], zoom: 13, title: "Astoria"},
        2 : {location: [-123.969,45.893], zoom: 13, title: "Cannon Beach"},
        3 : {location: [-123.9188,46.026], zoom: 13, title: "Gearhart"},
        4 : {location: [-123.9520,46.2000], zoom: 14, title: "Hammond"},
        5 : {location: [-123.5032,45.9345], zoom: 14, title: "Jewell"},
        6 : {location: [-123.9407,45.7297], zoom: 13, title: "Neahkahnie Beach"},
        7 : {location: [-123.920,45.994], zoom: 12, title: "Seaside"},
        8 : {location: [-123.924,46.165], zoom: 13, title: "Warrenton"},
    }
};

export const bookmarks = (state=initialState, action) => {
    switch(action.type)  {
	case actions.ADD_BOOKMARK:
        return {
            bookmarks: state.bookmarks.concat(action.payload)
        };
    }
    return state;
}
