import React from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {Converter} from 'usng.js'
import {llPrecision, usngPrecision} from '../constants'

// This component only displays a position passed in as props.
// It does not care about any position stored in redux state.

const Position = ({ coord, zoom }) => {
    const digits = llPrecision[zoom]
    let x = coord[0];
    let y = coord[1];
    if (typeof x === 'string')
        x = parseFloat(x)
    if (typeof y === 'string')
        y = parseFloat(y)
    x = x.toFixed(digits)
    y = y.toFixed(digits)
    const usngConverter = new Converter
    const usng = usngConverter.LLtoUSNG(y,x,usngPrecision[zoom]);
    return (
        <>
            { x } { y } { zoom } ({ usng })
        </>
    );
}
Position.propTypes = {
    coord: PropTypes.array.isRequired,
    zoom: PropTypes.number.isRequired,
}
export default Position;
