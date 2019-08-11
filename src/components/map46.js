import React, {useState} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {setMapCenter} from '../actions'
import Select from 'react-select' // eslint-disable-line no-unused-vars
import {Button} from 'reactstrap' // eslint-disable-line no-unused-vars
import BootstrapTable from 'react-bootstrap-table-next' // eslint-disable-line no-unused-vars
import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import Geocoder from './geocoder'
import Position from './position'

import {toStringXY} from 'ol/coordinate'
import {toLonLat} from 'ol/proj'

import {myGeoServer, workspace} from '../constants'

import {Style, Circle, Fill, Icon, Stroke, Text} from 'ol/style'
import Collection from 'ol/Collection'
import {click, platformModifierKeyOnly} from 'ol/events/condition'

// Base layers
const esriClarityUrl = 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/' +
                    'World_Imagery/MapServer/tile/{z}/{y}/{x}'

/*
TODO = if a photo will not be visible in current extent, disable it in the list
*/
const astoriagis = "https://gis.astoria.or.us/cgi-bin/mapserv.exe?SERVICE=WMS&VERSION=1.1.1";
const oregonExplorer = "https://imagery.oregonexplorer.info/arcgis" + '/rest' + '/services';
const aerials = [
    { label: "no photo", value: {source: "WMS", url: ""}  },
    { label: "Astoria 1966", value: {source: "WMS", url: astoriagis + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fastoria_aerial_bw_1966.map&LAYERS=aerials1966" }},
    { label: "Astoria 1976", value: {source: "WMS", url: astoriagis + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fastoria_aerial_bw_1976.map&LAYERS=aerials1976" }},
    { label: "Astoria 1987", value: {source: "WMS", url: astoriagis + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fastoria_aerial_bw_1987.map&LAYERS=aerials1987" }},
    { label: "Astoria 1994", value: {source: "WMS", url: astoriagis + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fastoria_aerial_bw_1994.map&LAYERS=aerials1994" }},
    { label: "Astoria 2004", value: {source: "WMS", url: astoriagis + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fastoria_aerial_hires_2004.map&LAYERS=aerials2004" }},
    { label: "Astoria 2010", value: {source: "WMS", url: astoriagis + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fastoria_aerial_hires_2010.map&LAYERS=aerials2010" }},
    { label: "Astoria 2015", value: {source: "WMS", url: astoriagis + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fair_2015.map&LAYERS=air_2015"}},

    { label: "NAIP 2016", value: {source: 'ArcGISRest', url: oregonExplorer + "/NAIP_2016/NAIP_2016_WM/ImageServer'; // + '/WMSServer?Layers=0" }},
    { label: "NAIP 2014", value: {source: "WMS", url: oregonExplorer + "/NAIP_2014/NAIP_2014_WM/ImageServer/WMSServer?Layers=0" }},
    { label: "NAIP 2012", value: {source: "WMS", url: oregonExplorer + "/NAIP_2012/NAIP_2012_WM/ImageServer/WMSServer?Layers=0" }},
    { label: "NAIP 2011", value: {source: "WMS", url: oregonExplorer + "/NAIP_2011/NAIP_2011_WM/ImageServer/WMSServer?Layers=0" }},
    // there are more NAIP photos...

    { label: "DOGAMI BareEarthHS",  value: { source: 'WMS',  url: "https://gis.dogami.oregon.gov/arcgis/services/Public/BareEarthHS/ImageServer/WMSServer?Layers=0"  }},
    { label: "DOGAMI HighestHitHS", value: { source: 'WMS',  url: "https://gis.dogami.oregon.gov/arcgis/services/Public/HighestHitHS/ImageServer/WMSServer?Layers=0" }}
];

const oregonExplorerHydro = "https://navigator.state.or.us/ArcGIS/rest/services/Framework/Hydro_GeneralMap/MapServer";
const lakes       = oregonExplorerHydro + "/0"
const streams     = oregonExplorerHydro + "/1"
const waterbodies = oregonExplorerHydro + "/2"
const rivers      = oregonExplorerHydro + "/3"

// DOGAMI "https://gis.dogami.oregon.gov/arcgis/rest/services/Public"
const dogamiServer = "https://gis.dogami.oregon.gov/arcgis/rest/services/Public/"
const dogamiLandslideUrl = dogamiServer + "Landslide_Susceptibility/ImageServer"
const dogamiSlidoUrl = dogamiServer + "/SLIDO3_4/MapServer"

// FEMA https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS
const FEMA_NFHL_arcgisREST = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer"

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
    const [aerialUrl, setAerialUrl] = useState(aerials[0].value.url) // 1966
    const [aerialSource, setAerialSource] = useState(aerials[0].value.source); // 1966
    const [aerialVisible, setAerialVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState([0,0]);
    const [popupPosition, setPopupPosition] = useState(); // where it will show up on screen
    const [popupText, setPopupText] = useState('HERE');   // text to display in popup
    const [selectCount, setSelectCount] = useState(0);
    const [rows, setRows] = useState([]);

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

    const selectAerialPhoto = (e) => {
        if (e.value.url.length>0) {
            console.log('selectAerialPhoto', e);
            setAerialUrl(e.value.url);
            setAerialSource(e.value.source);
            setAerialVisible(true);
        } else {
            setAerialVisible(false);
        }
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
        setMapCenter(new_center, new_zoom);
        return false;
    }

    return (
        <>
            <Geocoder/><br />
            <Select options={ aerials } onChange={ selectAerialPhoto } />

            <Map onPointerMove={showMousePosition} onMoveEnd={onMapMove}>
                <layer.Tile title="ESRI Clarity" baseLayer={true} visible={false}>
                    <source.XYZ url={esriClarityUrl}/>
                </layer.Tile>

                {/* Alternatives for streets: conventional or MVT */}
                <layer.Tile title="OpenStreetMap" baseLayer={true} visible={true}>
                    <source.OSM/>
                </layer.Tile>
                {/* MVT
                <layer.VectorTile title="Mapbox Streets" baseLayer={true} visible={true} style={mapboxStyle} declutter={true}>
                    <source.VectorTile url={mapboxStreetsUrl}/>
                </layer.VectorTile>

                <layer.VectorTile title="Taxlots" declutter={true} crossOrigin="anonymous" style={taxlotStyle}>
                    <source.VectorTile url={taxlotUrl}>
                        <interaction.Select features={selectedFeatures} style={selectedStyle} condition={click} selected={onSelectEvent}/>
                        <interaction.SelectDragBox condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                    </source.VectorTile>
                </layer.VectorTile>
                */}

                {/* WFS */}
                <layer.Vector title="Taxlots" style={taxlotStyle} maxResolution={10}>
                    <source.JSON url={taxlotUrl} loader={taxlotFormat}>
                        <interaction.Select features={selectedFeatures} style={selectedStyle} condition={myCondition} selected={onSelectEvent}/>
                        <interaction.SelectDragBox features={selectedFeatures} style={selectedStyle} condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                    </source.JSON>
                </layer.Vector>

                <layer.Image title="DOGAMI Slides" opacity={.90} visible={true}>
                    <source.ImageArcGISRest url={dogamiSlidoUrl}/>
                </layer.Image>

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
