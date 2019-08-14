import React, {useState} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {setMapCenter} from '../actions'
import Select from 'react-select' // eslint-disable-line no-unused-vars
import {Button} from 'reactstrap' // eslint-disable-line no-unused-vars
import BootstrapTable from 'react-bootstrap-table-next' // eslint-disable-line no-unused-vars
import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import BaseMap from './basemap' // eslint-disable-line no-unused-vars
import Geocoder from './geocoder'
import Position from './position'

import {toStringXY} from 'ol/coordinate'
import {toLonLat} from 'ol/proj'

import {myGeoServer, workspace, MAXRESOLUTION, COUNTY_EXTENT} from '../constants'

import Style from 'ol/style/Style'
import {Circle, Fill, Icon, Stroke, Text} from 'ol/style'
import Collection from 'ol/Collection'
import {click, platformModifierKeyOnly} from 'ol/events/condition'

const gpxStyle = new Style({stroke: new Stroke({color: 'rgba(255, 0, 0, 1.0)', width:1.5})});

// DOGAMI
const dogamiServer = "https://gis.dogami.oregon.gov/arcgis/rest/services/Public"
const dogamiLandslideUrl = dogamiServer + "/Landslide_Susceptibility/ImageServer"
const dogamiSlidoUrl = dogamiServer + "/SLIDO3_4/MapServer"

// FEMA https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS
const ccPLSSUrl = "https://cc-gis.clatsop.co.clatsop.or.us/arcgis/services/plss/MapServer"

// FEMA https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS
const FEMA_NFHL_arcgisREST = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer"
const femaPLSSUrl = FEMA_NFHL_arcgisREST + '/5';

const plssStyle = new Style({
    stroke: new Stroke({color: [0, 0, 0, 1], width:1}),
    //fill: new Fill({color: [255, 0, 0, .250]}),
});

const oregonAGOL = "https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services"
const zoningFeatureServer = oregonAGOL + "/Oregon_Zoning_2017/FeatureServer/0";   // 2017
const zoningStyle = new Style({
    stroke: new Stroke({color: [0, 0, 0, 1], width:.75}),
    fill: new Fill({color: [76, 129, 205, .250]}),
});

const taxlotService = "https://cc-gis.clatsop.co.clatsop.or.us/arcgis/rest/services/Taxlots/FeatureServer"
const taxlotLabels   = taxlotService + "/0";
const taxlotFeatures = taxlotService + "/1";

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

/* WFS
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

/* ========================================================================== */

const Map46 = ({title, center, zoom, setMapCenter}) => {
    const [mousePosition, setMousePosition] = useState([0,0]);
    const [popupPosition, setPopupPosition] = useState(); // where it will show up on screen
    const [popupText, setPopupText] = useState('HERE');   // text to display in popup
    const [selectCount, setSelectCount] = useState(0);
    const [rows, setRows] = useState([]);

    const gpxFeatures = new Collection();

    const showMousePosition = (e) => {
        const lonlat = toLonLat(e.coordinate)
        setMousePosition(lonlat)
        return false;
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
            setMapCenter(new_center, new_zoom);
        } catch (err) {
            console.warn(err)
        }
        return false;
    }

    return (
        <>
            <Geocoder/><br />

            <Map>
                <BaseMap/>

                <layer.Image title="DOGAMI Landslide Susceptibility" opacity={.90} reordering={false} visible={false} extent={COUNTY_EXTENT}>
                    <source.ImageArcGISRest url={dogamiLandslideUrl}/>
                </layer.Image>

                <layer.Image title="DOGAMI Slides" opacity={.90} reordering={false} visible={false} extent={COUNTY_EXTENT}>
                <source.ImageArcGISRest url={dogamiSlidoUrl}/>
                </layer.Image>

                {/* WFS */}
                <layer.Vector title="Taxlots" style={taxlotStyle} reordering={false} maxResolution={MAXRESOLUTION}>
                    <source.JSON url={taxlotUrl} loader={taxlotFormat}>
                        <interaction.Select features={selectedFeatures} style={selectedStyle} condition={myCondition} selected={onSelectEvent}/>
                        <interaction.SelectDragBox features={selectedFeatures} style={selectedStyle} condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                    </source.JSON>
                </layer.Vector>

                <layer.Vector title="Oregon Zoning" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={COUNTY_EXTENT}>
                    <source.JSON url={zoningFeatureServer} loader="esrijson"/>
                </layer.Vector>

                <layer.Vector title="PLSS (FEMA)" style={plssStyle} reordering={false} maxResolution={MAXRESOLUTION}>
                    <source.JSON url={femaPLSSUrl} loader="esrijson"/>
                </layer.Vector>

                <layer.Image title="PLSS (Clatsop County)" style={plssStyle} reordering={false}>
                    <source.ImageArcGISRest url={ccPLSSUrl} loader="esrijson"/>
                </layer.Image>

                <layer.Vector title="GPX Drag and drop" style={gpxStyle}>
                    <source.Vector features={gpxFeatures}>
                    <interaction.DragAndDrop />
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
            </Map>

            <Position coord={mousePosition} zoom={zoom} />

            <BootstrapTable bootstrap4 striped condensed
                keyField={ taxlotKey }
                columns={ taxlotColumns }
                data={ rows }
            />
        </>
    );
}
Map46.propTypes = {
    title: PropTypes.string,
    center: PropTypes.arrayOf(PropTypes.number),
    zoom: PropTypes.number,
    setMapCenter: PropTypes.func
}
const mapStateToProps = (state) => ({
    bookmarks: state.bookmarks,
    center: state.map.center,
    zoom: state.map.zoom,
});
const mapDispatchToProps = {
    setMapCenter
};
export default connect(mapStateToProps, mapDispatchToProps)(Map46);
