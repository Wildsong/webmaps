import React, { useState } from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { setMapCenter } from '../actions'
import { Collapse, Button, Tooltip } from 'reactstrap'; // eslint-disable-line no-unused-vars
import { fromLonLat } from 'ol/proj'
import { Geolocation } from '../geolocation'

const DEFAULT_ZOOM = 17;
const geolocation = new Geolocation();

const MapNavbar = ({ center, setMapCenter }) => {
    const [collapse, setCollapse] = useState(false);
    const toggle = () => {
        setCollapse(!collapse);
    }

    const gotoGeolocation = (e) => {
        const coord = geolocation.coord;
        const zoom = DEFAULT_ZOOM;
        console.log('MapNavbar.gotoXY', coord);
        setMapCenter(coord, zoom);
    }

    return (
        <>
        <Button name="Geolocate" onClick={gotoGeolocation}/>
        </>
    );
}
MapNavbar.propTypes = {
    center: PropTypes.arrayOf(PropTypes.number),
    setMapCenter: PropTypes.func,
}
const mapStateToProps = (state) => ({
    center: state.map.center,
});
const mapDispatchToProps = {
    setMapCenter
};
export default connect(mapStateToProps, mapDispatchToProps)(MapNavbar);
