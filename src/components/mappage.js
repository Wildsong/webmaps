import React, {useState, useEffect} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {setMapCenter} from '../actions'
import {Container, Row, Col} from 'reactstrap'; // eslint-disable-line no-unused-vars
import MapNavbar from './mapnavbar'; // eslint-disable-line no-unused-vars
import Map46 from './map46'; // eslint-disable-line no-unused-vars
import Geocoder from './geocoder' // eslint-disable-line no-unused-vars

import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import {MapProvider} from '@map46/ol-react/map-context'; // eslint-disable-line no-unused-vars

import {Map as olMap, View as olView} from 'ol'
import {fromLonLat} from 'ol/proj'
import {defaults as defaultInteractions} from 'ol/interaction'
import {defaultOverviewLayers as ovLayers} from '@map46/ol-react/map-layers'

//import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.css'

import {DEFAULT_CENTER, MINZOOM, MAXZOOM} from '../constants'

const MapPage = ({center, zoom, setMapCenter}) => {
    const [theMap] = useState(new olMap({
        view: new olView({
            center: fromLonLat(center),
            zoom: zoom,
            minZoom: MINZOOM, maxZoom: MAXZOOM,
        }),
        interactions: defaultInteractions({constrainResolution: true}),
    }));
    const minHgt = 400;
    const [winHgt, setwinHgt] = useState(window.innerHeight);
    useEffect(() => {
        const listener = () => { setwinHgt(window.innerHeight); }
        window.addEventListener("resize", listener);
        return () => {
            window.removeEventListener("resize", listener);
        };
    }, []);

    return (
        <>
        <MapProvider map={theMap}>

            <section className="map-section" style={winHgt>minHgt?{height:winHgt-200}:{}}>
                <Map46/>
                <div className="wm-overview">
                    <control.OverviewMap layers={ovLayers} target={null}/>
                    <control.LayerSwitcher switcherClass="wm-switcher ol-layerswitcher" extent={true} reordering={false} show_progress={true} collapsed={false} />
                </div>
            </section>

            <section className="table-section">
                <Geocoder/><br />
                {/*
                    <Position coord={mousePosition} zoom={zoom} />
                    <BootstrapTable bootstrap4 striped condensed
                        keyField={ taxlotKey }
                        columns={ taxlotColumns }
                        data={ rows }
                    />
                */}
            </section>

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
