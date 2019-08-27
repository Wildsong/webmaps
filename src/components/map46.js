import React, {useState} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {setMapExtent} from '../actions'
import Select from 'react-select' // eslint-disable-line no-unused-vars
import {Button} from 'reactstrap' // eslint-disable-line no-unused-vars
import BootstrapTable from 'react-bootstrap-table-next' // eslint-disable-line no-unused-vars
import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import BaseMap from './basemap' // eslint-disable-line no-unused-vars
import Position from './position'

import {toStringXY} from 'ol/coordinate'
import {toLonLat, fromLonLat} from 'ol/proj'

import {myGeoServer, myArcGISServer, workspace, MAXRESOLUTION} from '../constants'
import {XMIN,YMIN,XMAX,YMAX, EXTENT_WM, WGS84} from '../constants'

import Style from 'ol/style/Style'
import {Circle, Fill, Icon, Stroke, Text} from 'ol/style'
import Collection from 'ol/Collection'
import {click, platformModifierKeyOnly} from 'ol/events/condition'

const geocacheIcon = require('../../assets/traditional.png'); // eslint-disable-line no-undef
const gpxStyle = new Style({
    image: new Icon({src: geocacheIcon}),
    stroke: new Stroke({color: "magenta", width: 4}),
    fill: new Fill({color: 'rgba(0,0,255, 0.8)'}),
});

/*
const createTextStyle = (feature, resolution, dom) => {
    var align = dom.align.value;
    var baseline = dom.baseline.value;
    var size = dom.size.value;
    var offsetX = parseInt(dom.offsetX.value, 10);
    var offsetY = parseInt(dom.offsetY.value, 10);
    var weight = dom.weight.value;
    var placement = dom.placement ? dom.placement.value : undefined;
    var maxAngle = dom.maxangle ? parseFloat(dom.maxangle.value) : undefined;
    var overflow = dom.overflow ? (dom.overflow.value == 'true') : undefined;
    var rotation = parseFloat(dom.rotation.value);
    if (dom.font.value == '\'Open Sans\'' && !openSansAdded) {
        var openSans = document.createElement('link');
        openSans.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
        openSans.rel = 'stylesheet';
        document.getElementsByTagName('head')[0].appendChild(openSans);
        openSansAdded = true;
    }
    var font = weight + ' ' + size + ' ' + dom.font.value;
    var fillColor = dom.color.value;
    var outlineColor = dom.outline.value;
    var outlineWidth = parseInt(dom.outlineWidth.value, 10);

    return new Text({
        textAlign: align == '' ? undefined : align,
        textBaseline: baseline,
        font: font,
        text: getText(feature, resolution, dom),
        fill: new Fill({color: fillColor}),
        stroke: new Stroke({color: outlineColor, width: outlineWidth}),
        offsetX: offsetX,
        offsetY: offsetY,
        placement: placement,
        maxAngle: maxAngle,
        overflow: overflow,
        rotation: rotation
    });
};
*/

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

const plssStyle = new Style({
    stroke: new Stroke({color: [0, 0, 0, 1], width:1}),
    //fill: new Fill({color: [255, 0, 0, .250]}),
});

const oregonAGOL = "https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services"
//const zoningFeatureServer = oregonAGOL + "/Oregon_Zoning_2017/FeatureServer/0";   // 2017
const zoningStyle = new Style({
    stroke: new Stroke({color: [0, 0, 0, 1], width:.75}),
    fill: new Fill({color: [76, 129, 205, .250]}),
});

// Clatsop County services
// map services
const ccPLSSUrl = myArcGISServer + "/PLSS/MapServer"
const ccTaxmapAnnoUrl = myArcGISServer + "/Taxmap_annotation/MapServer"

// feature services
const ccMilepostsUrl = myArcGISServer + "/highway_mileposts/FeatureServer/0";
const ccZoningLabelsUrl = myArcGISServer + "/Zoning/FeatureServer/0";
const ccZoningUrl = myArcGISServer + "/Zoning/FeatureServer/1";
const ccTaxlotLabelsUrl = myArcGISServer + '/Taxlots/FeatureServer/0'
const ccTaxlotUrl = myArcGISServer + '/Taxlots/FeatureServer/1'
const ccTaxlotFormat = 'esrijson'

// Where the taxmap PDFs live
const taxmapsBaseUrl = "http://maps.co.clatsop.or.us/applications/taxreports/taxmap"

const taxlotKey      = 'taxlotkey';
const taxlotColumns = [
// These fields are in the "accounts" database built by KH
    {dataField: taxlotKey,  text: 'Taxlot Key'},
    {dataField: 'account_id', text: 'Account'},
    {dataField: 'taxlot',     text: 'Taxlot'},
    {dataField: 'owner_line', text: 'Owner'},
    {dataField: 'situs_addr', text: 'Situs Address'},
    /*
    {dataField: 'MapTaxlot',    text: 'MapTaxlot',
        formatter: (value, record) => {
             //console.log('formatter MapTaxLot=', value, ' obj=',record);
             const propertyInfo = 'https://apps.co.clatsop.or.us/property/property_details/?t=' + value
             return (
                 <a target="pinfo" href={ propertyInfo }>{ value }</a>
             );
    }},
    */

/* I think these fields correspond to the Official data
    {dataField: 'Town',      text: 'Township'},
    {dataField: 'Range',     text: 'Range'},
    {dataField: 'SecNumber', text: 'Section'},
    {dataField: 'Qtr',       text: 'Qtr'},
    {dataField: 'QtrQtr',    text: 'QtrQtr'},
    {dataField: 'Taxlot',    text: 'Taxlot'},
    {dataField: 'MapNumber', text: 'Map Number'},
*/
]
const taxlotPopupField = 'MapTaxlot';

/* GeoServer WFS
 To generate this WFS service URL, go into GeoServer Layer Preview,
 and in All Formats, select "WFS GeoJSON(JSONP)" then paste here and
 clip off the outputFormat and maxFeatures attributes (maxFeatures=50&outputFormat=text%2Fjavascript
*/
const taxlotUrl = myGeoServer + '/ows?service=WFS&version=1.0.0&request=GetFeature'
    + '&typeName=' + workspace + '%3Ataxlots'
const taxlotFormat = 'geojson'

/* VECTOR TILES
const taxlotLayer = 'clatsop_wm%3Ataxlots'
const taxlotUrl = myGeoServer + '/gwc/service/tms/1.0.0/'
        + taxlotLayer
        + '@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf';
*/
const taxlotStyle = new Style({
    fill: new Fill({color:"rgba(128,0,0,0.1)"}),
    stroke: new Stroke({color:"rgba(0,0,0,1.0)", width:1}),
})
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
        radius: 300,
        fill: new Fill({color: 'yellow'}),
        stroke: new Stroke({color: 'yellow', width: 1})
    })
});



/* ========================================================================== */

const Map46 = ({title, center, zoom, setMapExtent}) => {
    const [showZoom, setShowZoom] = useState(zoom);
    const [popupPosition, setPopupPosition] = useState(); // where it will show up on screen
    const [popupText, setPopupText] = useState('HERE');   // text to display in popup
    const [selectCount, setSelectCount] = useState(0);
    const [rows, setRows] = useState([]);

    const gpxFeatures = new Collection();

    const coordFormatter = (coord) => {
		return toStringXY(coord, 4);
	}

    // Returns true if the event should trigger a taxlot selection
    const myCondition = (e) => {
        switch(e.type) {
            case 'click':
                console.log('CLICK!');
                return true;
            case 'pointerdown':
            case 'pointerup':
            case 'singleclick':
            case 'wheel':
            case 'pointerdrag':
                console.log('condition:', e.type);
                return false;

            case 'pointermove':
/*
                // roll over - just show taxlot popup
                const lonlat = toLonLat(e.coordinate)
                const features = taxlotLayer.getSource().getFeaturesAtCoordinate(e.coordinate)
                if (features.length > 0) {
                    const text = features[0].get(taxlotPopupField)
                    if (text != null && text.length > 0) {
                        popup.show(e.coordinate, text);
                        return false;
                    }
                }
                popup.hide();
*/
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
        console.log("onSelectEvent", e)
        const s = selectedFeatures.getLength();
        setSelectCount(s);
/*
        if (s) {
            popup.show(e.mapBrowserEvent.coordinate, selectedFeatures.item(0).get("taxlot").trim());
        } else {
            popup.hide()
        }
*/
        copyFeaturesToTable(selectedFeatures)
        e.stopPropagation(); // this stops draw interaction
    }

    const popup = React.createElement('div',
        { className:"ol-popup" },
        popupText
    );

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
            <BaseMap/>

            <layer.Image title="DOGAMI Landslide Susceptibility" opacity={.90} reordering={false} visible={false} extent={EXTENT_WM}>
                <source.ImageArcGISRest url={dogamiLandslideUrl}/>
            </layer.Image>

            <layer.Image title="DOGAMI Slides" opacity={.90} reordering={false} visible={false} extent={EXTENT_WM}>
            <source.ImageArcGISRest url={dogamiSlidoUrl}/>
            </layer.Image>

            <layer.Vector title="WFS Taxlots" style={taxlotStyle} reordering={false} maxResolution={MAXRESOLUTION}>
                <source.JSON url={taxlotUrl} loader={taxlotFormat}>
{/*
                        <interaction.Select features={selectedFeatures} style={selectedStyle} condition={myCondition} selected={onSelectEvent}/>
                    <interaction.SelectDragBox features={selectedFeatures} style={selectedStyle} condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                    */}
                </source.JSON>
            </layer.Vector>

            <layer.Vector title="Taxlots" style={taxlotStyle} reordering={false}>
                <source.JSON url={ccTaxlotUrl} loader={ccTaxlotFormat}>
                    <interaction.Select features={selectedFeatures} style={selectedStyle} condition={myCondition} selected={onSelectEvent}/>
                    <interaction.SelectDragBox features={selectedFeatures} style={selectedStyle} condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                </source.JSON>
            </layer.Vector>

            <layer.Vector title="Zoning" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={false}>
                <source.JSON url={ccZoningUrl} loader="esrijson"/>
            </layer.Vector>

            <layer.Vector title="Zoning labels" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={false}>
                <source.JSON url={ccZoningLabelsUrl} loader="esrijson"/>
            </layer.Vector>

            <layer.Vector title="Zoning" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={false}>
                <source.JSON url={ccZoningUrl} loader="esrijson"/>
            </layer.Vector>

            <layer.Vector title="Highway mileposts" style={milepostStyle} reordering={false} extent={EXTENT_WM}>
                <source.JSON url={ccMilepostsUrl} loader="esrijson"/>
            </layer.Vector>

            <layer.Image title="PLSS (Clatsop County)" reordering={false}>
                <source.ImageArcGISRest url={ccPLSSUrl} loader="esrijson"/>
            </layer.Image>

            <layer.Tile title="Taxmap annotation (XYZ)" opacity={.80}>
                <source.XYZ url={ccTaxmapAnnoUrl + "/tile/{z}/{y}/{x}"}/>
            </layer.Tile>

            <layer.Image title="Taxmap annotation" reordering={false}>
                <source.ImageArcGISRest url={ccTaxmapAnnoUrl} loader="esrijson"/>
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
            <layer.Vector name="Taxlot Labels"
                source="esrijson"
                url={ taxlotFeatures }
                style={ taxlotTextStyle }
            />
            <Overlay id="popups"
                element={ popup }
                position={ popupPosition }
                positioning="center-center"
            />
            */}

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
