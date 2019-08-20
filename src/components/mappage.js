import React, {useState} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {setMapCenter} from '../actions'
import {Container, Row, Col} from 'reactstrap'; // eslint-disable-line no-unused-vars
import MapNavbar from './mapnavbar'; // eslint-disable-line no-unused-vars
import Map46 from './map46'; // eslint-disable-line no-unused-vars
import Geocoder from './geocoder'

import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import {MapProvider} from '@map46/ol-react/map-context'; // eslint-disable-line no-unused-vars
import {Map as olMap, View as olView} from 'ol'
import {fromLonLat} from 'ol/proj'

//import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.css'

import {DEFAULT_CENTER, MINZOOM, MAXZOOM} from '../constants'

const MapPage = ({center, zoom, setMapCenter}) => {
    const [theMap] = useState(new olMap({
        view: new olView({
            center: fromLonLat(center),
            zoom: zoom}),
            minZoom: MINZOOM, maxZoom: MAXZOOM,
        //controls: [],
    }));

    return (
        <>
        <MapProvider map={theMap}>

            <Geocoder/><br />

            <div className="mappage">
                <div className="mapcolumn">
                    <Map46/>
                </div>
                <div className="mapcolumn">
                    <control.LayerSwitcher switcherClass="wm-switcher ol-layerswitcher" extent={true} reordering={false} show_progress={true} collapsed={false} />
                </div>
            </div>

        </MapProvider>
        </>
    )
}
MapPage.propTypes = {
    center: PropTypes.arrayOf(PropTypes.number),
    zoom: PropTypes.number,
    setMapCenter: PropTypes.func
}
const mapStateToProps = (state) => ({
    center: state.map.center,
    zoom: state.map.zoom,
});
const mapDispatchToProps = {
    setMapCenter
};
export default connect(mapStateToProps, mapDispatchToProps)(MapPage);
