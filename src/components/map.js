import React, {useState, useEffect, useContext, useRef} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {setMapExtent} from '../actions'
import {Container, Row, Col, TabContent, TabPane} from 'reactstrap'; // eslint-disable-line no-unused-vars
import MapNavbar from './mapnavbar'; // eslint-disable-line no-unused-vars
//import Map46 from './map46'; // eslint-disable-line no-unused-vars
import Geocoder from './geocoder' // eslint-disable-line no-unused-vars
import PrintButton from './print/printModal'  // eslint-disable-line no-unused-vars

import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import {MapProvider} from '@map46/ol-react/map-context'; // eslint-disable-line no-unused-vars
import {CollectionProvider} from '@map46/ol-react/collection-context' // eslint-disable-line no-unused-vars

import BootstrapTable from 'react-bootstrap-table-next' // eslint-disable-line no-unused-vars
import ToolkitProvider, {CSVExport} from 'react-bootstrap-table2-toolkit' // eslint-disable-line no-unused-vars

import {Map as olMap, View as olView} from 'ol'
import {toLonLat, fromLonLat} from 'ol/proj'
import {defaults as defaultInteractions} from 'ol/interaction'
import {defaultOverviewLayers as ovLayers} from '@map46/ol-react/map-layers'

//import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.css'

import {WGS84, WM} from '@map46/ol-react/constants'
import {DEFAULT_CENTER, MINZOOM, MAXZOOM, BOOKMARKS} from '../constants'

import Select from 'react-select' // eslint-disable-line no-unused-vars
import {Button} from 'reactstrap' // eslint-disable-line no-unused-vars

import Popup from 'ol-ext/overlay/Popup'

import {myGeoServer, myArcGISServer, workspace, MAXRESOLUTION} from '../constants'
import {XMIN,YMIN,XMAX,YMAX, EXTENT_LL, EXTENT_WM} from '../constants'

import LayerGroup from 'ol/layer/Group'
import Collection from 'ol/Collection'
import {toStringXY} from 'ol/coordinate'
import Style from 'ol/style/Style'
import {Circle, Fill, Icon, Stroke} from 'ol/style'
import {platformModifierKeyOnly} from 'ol/events/condition'
import GeoJSON from 'ol/format/GeoJSON'

import {createTextStyle, cyanStyle} from './styles'

import Dissolve from '@turf/dissolve'
import Buffer from '@turf/buffer'
import {featureCollection} from '@turf/helpers'

import BaseMap from './basemap' // eslint-disable-line no-unused-vars
import DogamiHazards from './hazards' // eslint-disable-line no-unused-vars
import SealevelRise from './sealevelrise' // eslint-disable-line no-unused-vars
import Zoning from './zoning' // eslint-disable-line no-unused-vars
import Taxlots from './taxlots' // eslint-disable-line no-unused-vars
import {taxlotColumns, TAXLOT_LAYER_TITLE, TAXLOT_KEY} from './taxlots'

const geocacheIcon = require('../../assets/traditional.png'); // eslint-disable-line no-undef
const gpxStyle = new Style({
    image: new Icon({src: geocacheIcon}),
    stroke: new Stroke({color: "magenta", width: 4}),
    fill: new Fill({color: 'rgba(0,0,255, 0.8)'}),
});

// FEMA hazards
// https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS
//
const FEMA_NFHL_Url = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer"

/*
// Web Markers
const wfsSource = myGeoServer + "/ows?" + "service=WFS&version=2.0.0&request=GetFeature"
const webMarkersUrl = wfsSource + '&typeNames=' + workspace + '%3Aweb_markers'
const markerStyle = new Style({
    image: new Circle({
        radius: 40,
        fill: new Fill({color: 'rgba(200,10,10, 0.5)'}),
        stroke: new Stroke({color: 'red', width: 1})
    })
});
*/

// County extent rectangle
const xform = (coordinates) => {
    for (let i = 0; i < coordinates.length; i+=2) {
        [coordinates[i], coordinates[i+1]] = fromLonLat([coordinates[i], coordinates[i+1]]);
    }
    return coordinates
}

// Clatsop County services
// map services
const ccPLSSUrl = myArcGISServer + "/PLSS/MapServer"
const ccTaxmapAnnoUrl = myArcGISServer + "/Taxmap_annotation/MapServer"

// feature services
const ccMilepostsUrl = myArcGISServer + "/Highway_Mileposts/FeatureServer/0";

// FIXME this should be an SVG diamond shape
const milepostStyle = new Style({
    image: new Circle({
        radius: 3,
        fill: new Fill({color: 'yellow'}),
        stroke: new Stroke({color: 'yellow', width: 1})
    })
});

// FIXME MOVE THIS COMPONENT TO ITS OWN FILE!!!
// FIXME I think it would be cool to hide columns that are empty here.

const {ExportCSVButton} = CSVExport;

const TaxlotTable = ({rows, onBuffer}) => {
    if (rows.length < 1) {
        return ( <>Select some taxlots!</> );
    }
    return (
        <>
        {rows.length>1? (rows.length + ' taxlots selected') : ''}

        <ToolkitProvider
            keyField={TAXLOT_KEY}
            data={rows} columns={taxlotColumns}
            exportCSV
        >
        {
            props => (
                <div>
                    <Button onClick={onBuffer}>Buffer</Button>
                    <ExportCSVButton {...props.csvProps}>CSV Export</ExportCSVButton>
                    <BootstrapTable bootstrap4 striped condensed {...props.baseProps} />
                </div>
            )
        }
        </ToolkitProvider>
        </>
    );

    //keyField={taxlotKey} columns={taxlotColumns} data={rows}/>
}

/* ========================================================================== */

const MapPage = ({title, center, zoom, setMapExtent}) => {
    const [basemapLayers] = useState(new Collection());
    const [sealevelLayers] = useState(new Collection());
    const [hazardsLayers] = useState(new Collection());
    const [floodLayers] = useState(new Collection());
    const [zoningLayers] = useState(new Collection());
    const [mapLayers] = useState(new Collection([
        new LayerGroup({title: "Base", layers:basemapLayers}),
        new LayerGroup({title: "DOGAMI Hazards", layers:hazardsLayers, visible:false}),
        new LayerGroup({title: "FEMA Flood", layers:floodLayers, visible:false}),
        new LayerGroup({title: "NOAA Sea Level Rise", layers:sealevelLayers, visible:false}),
        new LayerGroup({title: "Zoning", layers:zoningLayers, visible:false}),
    ]));
    const [theMap] = useState(new olMap({
        view: new olView({
            center: fromLonLat(center),
            zoom: zoom,
            minZoom: MINZOOM, maxZoom: MAXZOOM,
        }),
        interactions: defaultInteractions({constrainResolution: true}),
        layers: mapLayers,
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

    const [showZoom, setShowZoom] = useState(zoom);
    const [rows, setRows] = useState([]);
    const [popup] = useState(new Popup());
    /*
    const [popupPosition, setPopupPosition] = useState([0,0]) // location on screen
    const [popupText, setPopupText] = useState("HERE") // text for popup
    */
    // Find the taxlot layer so we can query it for popups.

    const taxlotLayerRef = useRef(null);
    const bufferLayerRef = useRef(null);
    const [selectedFeatures] = useState(new Collection());
    const bufferFeatures = new Collection();

    useEffect(() => {
        theMap.addOverlay(popup);
        mapLayers.forEach(layer => {
            //map.addLayer(layer);
            if (layer.get("title") == TAXLOT_LAYER_TITLE)
                taxlotLayerRef.current = layer;
            if (layer.get("title") == 'Buffer')
                bufferLayerRef.current = layer;
        })
        console.log("taxlotLayerRef = ", taxlotLayerRef)
    }, []);

    const gpxFeatures = new Collection();

    const coordFormatter = (coord) => {
		return toStringXY(coord, 4);
	}

    const copyFeaturesToTable = (features) => {
        const rows = [];
        features.forEach( (feature) => {
            const attributes = {};
            // Copy the data from each feature into a list
            taxlotColumns.forEach ( (column) => {
                attributes[column.dataField] = feature.get(column.dataField);
            });
            rows.push(attributes)
        });
        setRows(rows);
    }

    const selectedFeaturesChanged = (e) => {
        // Callback from Taxlots component
        bufferFeatures.clear();
        copyFeaturesToTable(selectedFeatures)
    }

    const bufferSelectedFeatures = (e) => {
    // Buffer the currently selected Features, callback from TaxlotTable

        if (selectedFeatures.getLength() <= 0) return

        const format = new GeoJSON({
            geometry: 'geometry',
            dataProjection: WGS84,
            featureProjection: WM,
        });

        // Add all the selected features to a turf Collection
        // FIXME I can probably re-write this with a map function
        const featureArray = [];
        selectedFeatures.forEach( (feature) => {
            // convert the feature into a GeoJSON object (and transform into WGS84)
            const geojson = format.writeFeatureObject(feature);
            featureArray.push(geojson);
        })
        const turfSelectedFeatures = featureCollection(featureArray)
        const buffered = Buffer(turfSelectedFeatures, 100, {units: 'feet'});
        const dissolvedFeatures = Dissolve(buffered)
        // convert the turf shapes into OL Shapes
        const olShape = format.readFeatures(dissolvedFeatures);

        // add the buffered and dissolved features to the display feature class
        bufferLayerRef.current.getSource().addFeatures(olShape);

        // find all the taxlots that are touching the buffered polygons
        // select them
    }

    // If you don't catch this event and then you click on the map,
    // the click handler will cause the map to pan back to its starting point
    const onMapMove = (e) => {
        const v = e.map.getView()
        const new_center_wm = v.getCenter()
        const new_center = toLonLat(new_center_wm)
        const new_zoom = v.getZoom();
        try {
            console.log("onMapMove", e, new_center)
            setMapExtent(new_center, new_zoom);
            setShowZoom(new_zoom);
        } catch (err) {
            console.warn(err)
        }
        return false;
    }

    const onGeocode = (e) => {
        const view = theMap.getView();
        view.setCenter(e.coordinate);
        view.setZoom(18);
    }

    return (
        <>
        <MapProvider map={theMap}>

            <section className="map-section" style={winHgt>minHgt?{height:winHgt-200}:{}}>

                <Map onMoveEnd={onMapMove}>
                    <CollectionProvider collection={basemapLayers}>
                        <BaseMap layerCollection={basemapLayers}/>
                    </CollectionProvider>

                    <DogamiHazards layers={hazardsLayers}/>

                    <CollectionProvider collection={floodLayers}>
                        <layer.Image title="National Flood Hazard Layer (NFHL)" opacity={.90} reordering={false} visible={true} extent={EXTENT_WM}>
                            <source.ImageArcGISRest url={FEMA_NFHL_Url}/>
                        </layer.Image>
                    </CollectionProvider>

                    <SealevelRise layers={sealevelLayers}/>

                    <Zoning layers={zoningLayers}/>

                    <CollectionProvider collection={mapLayers}>
                        <Taxlots layers={mapLayers}
                            selectedFeatures={selectedFeatures}
                            selectionChanged={selectedFeaturesChanged}
                            taxlotLayerRef={taxlotLayerRef} />

                        <layer.Vector title="Highway mileposts" style={milepostStyle} reordering={false} extent={EXTENT_WM} maxResolution={MAXRESOLUTION}>
                            <source.JSON url={ccMilepostsUrl} loader="esrijson"/>
                        </layer.Vector>

                        <layer.Tile title="Taxmap annotation" opacity={.80}>
                            <source.XYZ url={ccTaxmapAnnoUrl + "/tile/{z}/{y}/{x}"}/>
                        </layer.Tile>

                        <layer.Image title="PLSS (Clatsop County)" reordering={false}>
                            <source.ImageArcGISRest url={ccPLSSUrl} loader="esrijson"/>
                        </layer.Image>

                        <layer.Vector title="Buffer" opacity={1} style={cyanStyle}  displayInLayerSwitcher={false}>
                            <source.Vector features={bufferFeatures} />
                        </layer.Vector>
{/*
                            <layer.Vector name="Geolocation">
                            </layer.Vector>
                            <Overlay id="popups"
                            element={ popup }
                            position={ popupPosition }
                            positioning="center-center"
                            />
*/}
                        <layer.Vector title="GPX Drag and drop" style={gpxStyle} displayInLayerSwitcher={false}>
                            <source.Vector features={gpxFeatures}>
                            <interaction.DragAndDrop fit={true}/>
                            </source.Vector>
                        </layer.Vector>

{/*
                        <layer.Vector title="Web markers" style={markerStyle} >
                            <source.JSON url={webMarkersUrl} loader="geojson"/>
                        </layer.Vector>

                        <layer.Vector title="Extent" opacity={1} extent={EXTENT_WM}>
                            <source.Vector>
                                <Feature id="Rect1" style={yellowStyle}>
                                    <geom.LineString transform={xform}>
                                        { [[XMIN,YMIN],[XMIN,YMAX],[XMAX,YMAX],[XMAX,YMIN],[XMIN,YMIN]] }
                                    </geom.LineString>
                                </Feature>
                            </source.Vector>
                        </layer.Vector>
*/}

                    </CollectionProvider>

                    <control.MousePosition  projection={WGS84} coordinateFormat={coordFormatter}/>
                    <control.ScaleLine units="us"/>
                    <control.GeoBookmark marks={BOOKMARKS}/>
                    <control.SearchNominatim onGeocode={onGeocode} viewbox={EXTENT_LL} bounded={true}/>
                </Map>

                <div className="wm-overview">
                    <PrintButton/>
                    <control.OverviewMap layers={ovLayers} target={null}/>
                    <control.LayerSwitcher switcherClass="wm-switcher ol-layerswitcher" extent={true} reordering={false} show_progress={true} collapsed={false} />
                </div>
            </section>

            <section className="table-section">

                {/*
                    <Geocoder/><br />
                    <Position coord={mousePosition} zoom={zoom} />
                    <BootstrapTable bootstrap4 striped condensed
                        keyField={ TAXLOT_KEY }
                        columns={ taxlotColumns }
                        data={ rows }
                    />
                */}

                <TaxlotTable rows={rows} onBuffer={bufferSelectedFeatures}/>

            </section>

        </MapProvider>
        </>
    )
}
MapPage.propTypes = {
    title: PropTypes.string,
    center: PropTypes.arrayOf(PropTypes.number),
    zoom: PropTypes.number,
    setMapExtent: PropTypes.func
}
const mapStateToProps = (state) => ({
    bookmarks: state.bookmarks,
    center: state.map.center,
    zoom: state.map.zoom,
});
const mapDispatchToProps = {
    setMapExtent
};
export default connect(mapStateToProps, mapDispatchToProps)(MapPage);
