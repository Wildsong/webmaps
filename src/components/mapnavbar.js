import React, { useState } from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { setMapCenter } from '../actions'
import { Collapse, Button, Tooltip } from 'reactstrap'
import { fromLonLat } from 'ol/proj'
import Map46 from './map46'
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
        <Button onClick={toggle}>Map controls</Button>
        <Collapse isOpen={collapse}>
            <button data-toggle="collapse" data-target="rightsidebar">right</button>
            <button type="button" data-toggle="dropdown">
                Layers
            </button>
            <ul>
                <li><button id="cloudToggle">Clouds</button></li>
                <li><button id="streetsToggle">Streets</button></li>
                <li><button id="highesthitToggle">Highest Hit Hillshade</button></li>
            </ul>
            <Button tag="button" onClick={ gotoGeolocation }>Geolocate</Button>
        </Collapse>
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
