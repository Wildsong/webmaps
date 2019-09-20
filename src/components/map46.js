import React, {useState, useEffect, useContext, useRef} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {MapContext} from '@map46/ol-react/map-context'
import {CollectionProvider} from '@map46/ol-react/collection-context' // eslint-disable-line no-unused-vars
import {connect} from 'react-redux'
import {setMapExtent} from '../actions'
import Select from 'react-select' // eslint-disable-line no-unused-vars

import {Button} from 'reactstrap' // eslint-disable-line no-unused-vars

import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import Popup from 'ol-ext/overlay/Popup'
import BaseMap from './basemap' // eslint-disable-line no-unused-vars
import Position from './position'

import {myGeoServer, myArcGISServer, workspace, MAXRESOLUTION} from '../constants'
import {XMIN,YMIN,XMAX,YMAX, EXTENT_WM, WGS84} from '../constants'

import LayerGroup from 'ol/layer/Group'
import Collection from 'ol/Collection'
import {toStringXY} from 'ol/coordinate'
import {toLonLat, fromLonLat} from 'ol/proj'
import Style from 'ol/style/Style'
import {Circle, Fill, Icon, Stroke, Text} from 'ol/style'
import {click, platformModifierKeyOnly} from 'ol/events/condition'

const geocacheIcon = require('../../assets/traditional.png'); // eslint-disable-line no-undef
const gpxStyle = new Style({
    image: new Icon({src: geocacheIcon}),
    stroke: new Stroke({color: "magenta", width: 4}),
    fill: new Fill({color: 'rgba(0,0,255, 0.8)'}),
});

const createTextStyle = (feature, resolution, params, getText) => {
    var align = params.align;
    var baseline = params.baseline;
    var offsetX = parseInt(params.offsetX, 10);
    var offsetY = parseInt(params.offsetY, 10);
    var placement = params.placement ? params.placement : undefined;
    var maxAngle = params.maxangle ? parseFloat(params.maxangle) : undefined;
    var overflow = params.overflow ? (params.overflow == 'true') : undefined;
    var rotation = parseFloat(params.rotation);
/*
    if (params.font == '\'Open Sans\'' && !openSansAdded) {
        var openSans = document.createElement('link');
        openSans.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
        openSans.rel = 'stylesheet';
        document.getElementsByTagName('head')[0].appendChild(openSans);
        openSansAdded = true;
    }
*/
    var fillColor = params.color;
    var outlineColor = params.outline;
    var outlineWidth = parseInt(params.outlineWidth, 10);
    return new Text({
        textAlign: align == '' ? undefined : align,
        textBaseline: baseline,
        font: params.weight + ' ' + params.size + ' ' + params.font,
        text: getText(feature, resolution, params),
        fill: new Fill({color: fillColor}),
        stroke: new Stroke({color: outlineColor, width: outlineWidth}),
        offsetX: offsetX,
        offsetY: offsetY,
        placement: placement,
        maxAngle: maxAngle,
        overflow: overflow,
        rotation: rotation,
        scale: 1 // TODO this should change with zoom
    });
};

// DOGAMI
const dogamiServer = "https://gis.dogami.oregon.gov/arcgis/rest/services/Public"
const dogamiLandslideUrl = dogamiServer + "/Landslide_Susceptibility/ImageServer"
const dogamiSlidoUrl = dogamiServer + "/SLIDO3_4/MapServer"

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

// County extent rectangle
const xform = (coordinates) => {
    for (let i = 0; i < coordinates.length; i+=2) {
        [coordinates[i], coordinates[i+1]] = fromLonLat([coordinates[i], coordinates[i+1]]);
    }
    return coordinates
}

// FEMA https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS
const FEMA_NFHL_arcgisREST = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer"

/*
const plssStyle = new Style({
    stroke: new Stroke({color: [0, 0, 0, 1], width:1}),
    //fill: new Fill({color: [255, 0, 0, .250]}),
});
*/

// Clatsop County services
// map services
const ccPLSSUrl = myArcGISServer + "/PLSS/MapServer"
const ccTaxmapAnnoUrl = myArcGISServer + "/Taxmap_annotation/MapServer"

// feature services
const ccMilepostsUrl = myArcGISServer + "/Highway_Mileposts/FeatureServer/0";

const ccZoningUrl = myArcGISServer + "/Zoning/FeatureServer/0";
const ccZoningAstoriaUrl = myArcGISServer + "/Zoning/FeatureServer/1";
const ccZoningCannonBeachUrl = myArcGISServer + "/Zoning/FeatureServer/2";
const ccZoningWarrentonUrl = myArcGISServer + "/Zoning/FeatureServer/3";

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

    const zoningLabelField = "Zone";

    const zoningLabelParams = {
        text: "normal",
        weight: "", // italic small-caps bold
        size: "18px",  // see CSS3 -- can use 'em' or 'px' as unit
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
        color: "white",
        outline: "black", // TODO turn on only with aerial?
        outlineWidth: 3
    }

    const getZoningLabel = (feature, resolution, params) => {
        let text = feature.get(zoningLabelField);
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

    // TODO: use Ole here to stylize this layer using the ESRI styles.
    const zoningStyle = (feature, resolution) => {
        return new Style({
            stroke: new Stroke({color: [0, 0, 0, 1], width:.75}),
            fill: new Fill({color: [76, 129, 205, .250]}),
            text: createTextStyle(feature, resolution, zoningLabelParams, getZoningLabel)
        });
    };

    // yellow outline, clear center lets you see what you have selected!
    const selectedStyle = new Style({ // yellow
        stroke: new Stroke({color: 'rgba(255, 255, 0, 1.0)', width:2}),
        fill:   new Fill({color: 'rgba(255, 255, 0, .001)'}),
    });

    const yellowStyle = new Style({
        stroke: new Stroke({color: 'yellow', width: 1})
    });

    // FIXME this should be an SVG diamond shape
    const milepostStyle = new Style({
        image: new Circle({
            radius: 3,
            fill: new Fill({color: 'yellow'}),
            stroke: new Stroke({color: 'yellow', width: 1})
        })
    });
//const taxlotStyle = new Style({
//    fill: new Fill({color:"rgba(128,0,0,0.1)"}),
//    stroke: new Stroke({color:"rgba(0,0,0,1.0)", width:1}),
//})
const taxlotTextStyle = (feature, resolution) => {
    return new Style({
        fill: new Fill({color:"rgba(128,0,0,0.1)"}),
        stroke: new Stroke({color:"rgba(0,0,0,1.0)", width:1}),
        text: createTextStyle(feature, resolution, taxlotLabelParams, getTaxlotLabel)
    });
}


const TAXLOT_LAYER_TITLE = "Taxlots"
const taxlotPopupField = 'TAXLOTKEY';

/* ========================================================================== */

const Map46 = ({title, center, zoom, setMapExtent}) => {
    const map = useContext(MapContext);
    const [showZoom, setShowZoom] = useState(zoom);
    const [selectCount, setSelectCount] = useState(0);
    const [rows, setRows] = useState([]);
    const [popup] = useState(new Popup());
    /*
    const [popupPosition, setPopupPosition] = useState([0,0]) // location on screen
    const [popupText, setPopupText] = useState("HERE") // text for popup
    */
    // Find the taxlot layer so we can query it for popups.

    const [basemapLayers] = useState(new Collection());
    const [hazardsLayers] = useState(new Collection());
    const [zoningLayers] = useState(new Collection());
    const [mapLayers] = useState(new Collection([
        new LayerGroup({title: "Base", layers:basemapLayers}),
        new LayerGroup({title: "Hazards", layers:hazardsLayers}),
        new LayerGroup({title: "Zoning", layers:zoningLayers}),
    ]));

    const taxlotLayerRef = useRef(null);
    useEffect(() => {
        map.addOverlay(popup);
        mapLayers.forEach(layer => {
            map.addLayer(layer);
            if (layer.get("title") == TAXLOT_LAYER_TITLE)
                taxlotLayerRef.current = layer;
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
        if (features.getLength()) {
            features.forEach( (feature) => {
                const attributes = {};
                // Copy the data from each feature into a list
                taxlotColumns.forEach ( (column) => {
                    attributes[column.dataField] = feature.get(column.dataField);
                });
                rows.push(attributes)
            });
        }
        setRows(rows);
    }

    const selectedFeatures = new Collection();
    const onSelectEvent = (e) => {
        const s = selectedFeatures.getLength();
        setSelectCount(s);
        if (s) {
            const item = selectedFeatures.item(0);
            popup.show(e.mapBrowserEvent.coordinate, item.get(taxlotKey).trim());
        } else {
            popup.hide()
        }
        copyFeaturesToTable(selectedFeatures)
        e.stopPropagation();
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
        <Map onMoveEnd={onMapMove}>
            <CollectionProvider collection={basemapLayers}>
                <BaseMap layerCollection={basemapLayers}/>
            </CollectionProvider>

            <CollectionProvider collection={hazardsLayers}>
                <layer.Image title="DOGAMI Landslide Susceptibility" opacity={.90} reordering={false} visible={false} extent={EXTENT_WM}>
                    <source.ImageArcGISRest url={dogamiLandslideUrl}/>
                </layer.Image>

                <layer.Image title="DOGAMI Slides" opacity={.90} reordering={false} visible={false} extent={EXTENT_WM}>
                <source.ImageArcGISRest url={dogamiSlidoUrl}/>
                </layer.Image>
            </CollectionProvider>

            <CollectionProvider collection={zoningLayers}>
                <layer.Vector title="Zoning, Warrenton" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={false}>
                    <source.JSON url={ccZoningWarrentonUrl} loader="esrijson"/>
                </layer.Vector>

                <layer.Vector title="Zoning, Cannon Beach" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={false}>
                    <source.JSON url={ccZoningCannonBeachUrl} loader="esrijson"/>
                </layer.Vector>

                <layer.Vector title="Zoning, Astoria" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={false}>
                    <source.JSON url={ccZoningAstoriaUrl} loader="esrijson"/>
                </layer.Vector>

                <layer.Vector title="Zoning" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={false}>
                    <source.JSON url={ccZoningUrl} loader="esrijson"/>
                </layer.Vector>
            </CollectionProvider>

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

                <layer.Tile title="Taxmap annotation" opacity={.80}>
                    <source.XYZ url={ccTaxmapAnnoUrl + "/tile/{z}/{y}/{x}"}/>
                </layer.Tile>
                */}

                <layer.Image title="PLSS (Clatsop County)" reordering={false}>
                <source.ImageArcGISRest url={ccPLSSUrl} loader="esrijson"/>
                </layer.Image>

                <layer.Vector title="GPX Drag and drop" style={gpxStyle}>
                    <source.Vector features={gpxFeatures}>
                    <interaction.DragAndDrop fit={true}/>
                    </source.Vector>
                </layer.Vector>

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

                {/*
                <layer.Vector name="Geolocation">
                </layer.Vector>
                <Overlay id="popups"
                    element={ popup }
                    position={ popupPosition }
                    positioning="center-center"
                />
                */}
            </CollectionProvider>

            <control.MousePosition  projection={WGS84} coordinateFormat={coordFormatter}/>
            <control.ScaleLine units="us"/>
        </Map>

        </>
    );
}
Map46.propTypes = {
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
export default connect(mapStateToProps, mapDispatchToProps)(Map46);
