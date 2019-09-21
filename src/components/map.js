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
import {XMIN,YMIN,XMAX,YMAX, EXTENT_WM} from '../constants'

import LayerGroup from 'ol/layer/Group'
import Collection from 'ol/Collection'
import {toStringXY} from 'ol/coordinate'
import Style from 'ol/style/Style'
import {Circle, Fill, Icon, Stroke, Text} from 'ol/style'
import {platformModifierKeyOnly} from 'ol/events/condition'
import GeoJSON from 'ol/format/GeoJSON'

import {createTextStyle} from './styles'

import Dissolve from '@turf/dissolve'
import Buffer from '@turf/buffer'
import {featureCollection} from '@turf/helpers'

import BaseMap from './basemap' // eslint-disable-line no-unused-vars
import DogamiHazards from './hazards' // eslint-disable-line no-unused-vars
import SealevelRise from './sealevelrise' // eslint-disable-line no-unused-vars
import Zoning from './zoning' // eslint-disable-line no-unused-vars

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

//const ccTaxlotLabelsUrl = myArcGISServer + '/Taxlots/FeatureServer/0'
const ccTaxlotUrl = myArcGISServer + '/Taxlots/FeatureServer/1'
const ccTaxlotFormat = 'esrijson'

// Where the taxmap PDFs live
const ccTaxmapsPDFUrl = "http://maps.co.clatsop.or.us/applications/taxreports/taxmap/"
const ccPropertyInfoUrl = "https://apps.co.clatsop.or.us/property/property_details/?a="

/* GeoServer WFS
To generate this WFS service URL, go into GeoServer Layer Preview,
and in All Formats, select "WFS GeoJSON(JSONP)" then paste here and
clip off the outputFormat and maxFeatures attributes (maxFeatures=50&outputFormat=text%2Fjavascript
    const taxlotUrl = myGeoServer + '/ows?service=WFS&version=1.0.0&request=GetFeature'
    + '&typeName=' + workspace + '%3Ataxlots'
    const taxlotFormat = 'geojson'
*/

const taxlotLabelParams = {
    text: "normal",
    weight: "bold", // italic small-caps bold
    size: "12px",  // see CSS3 -- can use 'em' or 'px' as unit
    font: "verdana", // sans-serif cursive serif
    maxreso: 4800,
    placement: "point", // point or line
    align: "center", // left, right, center, end, start
    baseline: "middle", // bottom top middle alphabetic hanging ideographic
    rotation: 0,
    maxangle: 0,
    overflow: true,
    offsetX: 0,
    offsetY: 0,
    color: "black",
    outline: "white", // TODO turn on only with aerial?
    outlineWidth: 1
}

const getTaxlotLabel = (feature, resolution, params) => {
    let text = feature.get(taxlotLabelField);
    const type = params.text;
    const maxResolution = params.maxreso;

    if (resolution > maxResolution) {
        text = '';
    } else if (type == 'hide') {
        text = '';
        /*
    } else if (type == 'shorten') {
        text = text.trunc(12);
    }
    else if (type == 'wrap' && (!params.placement || params.placement != 'line')) {
        text = stringDivider(text, 16, '\n');
        */
    }
    return text;
};

// yellow outline, clear center lets you see what you have selected!
const selectedStyle = new Style({ // yellow
    stroke: new Stroke({color: 'rgba(255, 255, 0, 1.0)', width:2}),
    fill:   new Fill({color: 'rgba(255, 255, 0, .001)'}),
});
const yellowStyle = new Style({
    stroke: new Stroke({color: 'yellow', width: 1})
});
const cyanStyle = new Style({
    stroke: new Stroke({color: 'cyan', width: 4}),
    fill: new Fill({color: 'rgba(0, 180, 180, .250)'}),
});
const taxlotTextStyle = (feature, resolution) => {
    return new Style({
        fill: new Fill({color:"rgba(128,0,0,0.1)"}),
        stroke: new Stroke({color:"rgba(0,0,0,1.0)", width:1}),
        text: createTextStyle(feature, resolution, taxlotLabelParams, getTaxlotLabel)
    });
}

// FIXME this should be an SVG diamond shape
const milepostStyle = new Style({
    image: new Circle({
        radius: 3,
        fill: new Fill({color: 'yellow'}),
        stroke: new Stroke({color: 'yellow', width: 1})
    })
});

const taxlotKey       = 'TAXLOTKEY';
const taxlotLabelField = 'Taxlot';
const taxlotColumns = [
    {dataField: 'ACCOUNT_ID', text: 'Account', sort: true,
        formatter: (value, record) => {
            return (
                <a target="pinfo" href={ccPropertyInfoUrl + value}>{value}</a>
            );
    }},
    {dataField: 'TAXLOTKEY',  text: 'Taxlot Key', sort: true},
    {dataField: 'TAXMAPNUM',  text: 'Tax Map', sort: true,
        formatter: (value, record) => {
            return (
                <a target="taxmap" href={ccTaxmapsPDFUrl + 'tp' + value + '.pdf'}>{value}</a>
            );
    }},
    {dataField: 'Taxlot',     text: 'Taxlot', sort: true},
    {dataField: 'TAXCODE',    text: 'Tax Code', sort: true},
    {dataField: 'OWNER_LINE', text: 'Owner', sort: true},
    {dataField: 'OWNER_LL_1', text: 'Owner 1', sort: true},
    {dataField: 'OWNER_LL_2', text: 'Owner 2', sort: true},
    {dataField: 'SITUS_ADDR', text: 'Situs Address', sort: true},
    {dataField: 'SITUS_CITY', text: 'Situs City', sort: true},
    {dataField: 'STREET_ADD', text: 'Mail Address', sort: true},
    {dataField: 'PO_BOX',     text: 'PO Box', sort: true},
    {dataField: 'CITY',       text: 'City', sort: true},
    {dataField: 'STATE',      text: 'State', sort: true},
    {dataField: 'ZIP_CODE',   text: 'Zip', sort: true},
]

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
            keyField={taxlotKey}
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

const TAXLOT_LAYER_TITLE = "Taxlots"
const taxlotPopupField = 'TAXLOTKEY';

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

    // Returns true if the event should trigger a taxlot selection
    const myCondition = (e) => {
        switch(e.type) {
            case 'click':
                return true;

            case 'pointerdown':
            case 'pointerup':
            case 'singleclick':
            case 'wheel':
            case 'pointerdrag':
//                console.log('condition:', e.type);
                return false;

            case 'pointermove':
                // roll over - just show taxlot popup
                // FIXME I don't know why it's not seeing any features
                // works with Geoserver, I think. ArcGIS related??
                // Naa... already converted to data by this time.
                {
                    const lonlat = toLonLat(e.coordinate)
                    const features = taxlotLayerRef.current.getSource().getFeaturesAtCoordinate(lonlat)
                    if (features.length > 0) {
                        const text = features[0].get(taxlotPopupField)
                        if (text != null && text.length > 0) {
                            popup.show(e.coordinate, text);
                            return false;
                        }
                    }
                }
                popup.hide();
                return false; // don't do a selection!

    //            case 'platformModifierKeyOnly':
    //                return false;
        }
        console.log("?? condition", e.type);
        return false; // pass event along I guess
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

    const onSelectEvent = (e) => {
        const s = selectedFeatures.getLength();
        if (s) {
            const item = selectedFeatures.item(0);
            popup.show(e.mapBrowserEvent.coordinate, item.get(taxlotKey).trim());
        } else {
            popup.hide()
        }
        if (selectedFeatures.getLength() > 0) {
            selectedFeaturesChanged(e)
        }
        e.stopPropagation();
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
                        <layer.Vector title={TAXLOT_LAYER_TITLE} style={taxlotTextStyle} reordering={false} maxResolution={MAXRESOLUTION}>
                            <source.JSON url={ccTaxlotUrl} loader={ccTaxlotFormat}>
                                <interaction.Select features={selectedFeatures} style={selectedStyle} condition={myCondition} selected={onSelectEvent}/>
                                <interaction.SelectDragBox features={selectedFeatures} style={selectedStyle} condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                            </source.JSON>
                        </layer.Vector>

                        <layer.Vector title="Highway mileposts" style={milepostStyle} reordering={false} extent={EXTENT_WM} maxResolution={MAXRESOLUTION}>
                            <source.JSON url={ccMilepostsUrl} loader="esrijson"/>
                        </layer.Vector>

{/*
                        <layer.VectorTile title="Taxlots" declutter={true} crossOrigin="anonymous" style={taxlotStyle}>
                            <source.VectorTile url={taxlotUrl}>
                                <interaction.Select features={selectedFeatures} style={selectedStyle} condition={click} selected={onSelectEvent}/>
                                <interaction.SelectDragBox condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                            </source.VectorTile>
                        </layer.VectorTile>
                        */}

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
                        keyField={ taxlotKey }
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
