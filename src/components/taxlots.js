import React, {useState, useEffect, useContext, useRef} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import {CollectionContext} from '@map46/ol-react/collection-context' // eslint-disable-line no-unused-vars

import {Map as olMap, View as olView} from 'ol'
import {toLonLat, fromLonLat} from 'ol/proj'
import {defaults as defaultInteractions} from 'ol/interaction'
import {defaultOverviewLayers as ovLayers} from '@map46/ol-react/map-layers'

import {WGS84, WM} from '@map46/ol-react/constants'
import {DEFAULT_CENTER, MINZOOM, MAXZOOM, BOOKMARKS} from '../constants'

import Select from 'react-select' // eslint-disable-line no-unused-vars
import {Button} from 'reactstrap' // eslint-disable-line no-unused-vars

import Popup from 'ol-ext/overlay/Popup'
import BaseMap from './basemap' // eslint-disable-line no-unused-vars
//import Position from './position'

import {myGeoServer, myArcGISServer, workspace, MAXRESOLUTION} from '../constants'
import {XMIN,YMIN,XMAX,YMAX, EXTENT_WM} from '../constants'

import Collection from 'ol/Collection'
import Style from 'ol/style/Style'
import {Circle, Fill, Icon, Stroke, Text} from 'ol/style'
import {platformModifierKeyOnly} from 'ol/events/condition'
import GeoJSON from 'ol/format/GeoJSON'

import Dissolve from '@turf/dissolve'
import Buffer from '@turf/buffer'
import {featureCollection} from '@turf/helpers'

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

// Clatsop County services
// map services

//const ccTaxlotLabelsUrl = myArcGISServer + '/Taxlots/FeatureServer/0'
const ccTaxlotUrl = myArcGISServer + '/Taxlots/FeatureServer/1'
const ccTaxlotFormat = 'esrijson'

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

const TAXLOT_LAYER_TITLE = "Taxlots"
const taxlotPopupField = 'TAXLOTKEY';

/* ========================================================================== */

const Taxlots = ({selectedFeatures}) => {
    const [popup] = useState(new Popup());

    // Find the taxlot layer so we can query it for popups.

    const taxlotLayerRef = useRef(null);
    const bufferLayerRef = useRef(null);
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

    const onSelectEvent = (e) => {
        const s = selectedFeatures.getLength();
        if (s) {
            const item = selectedFeatures.item(0);
            popup.show(e.mapBrowserEvent.coordinate, item.get(taxlotKey).trim());
        } else {
            popup.hide()
        }
        if (selectedFeatures.getLength() > 0) {
            bufferFeatures.clear();
            copyFeaturesToTable(selectedFeatures)
        }
        e.stopPropagation();
    }

    return (
        <>
            <layer.Vector title={TAXLOT_LAYER_TITLE} style={taxlotTextStyle} reordering={false} maxResolution={MAXRESOLUTION}>
                <source.JSON url={ccTaxlotUrl} loader={ccTaxlotFormat}>
                    <interaction.Select features={selectedFeatures} style={selectedStyle} condition={myCondition} selected={onSelectEvent}/>
                    <interaction.SelectDragBox features={selectedFeatures} style={selectedStyle} condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                </source.JSON>
            </layer.Vector>
        </>
    )
}
Taxlots.propTypes = {
    selectedFeatures: PropTypes.instanceOf(Collection),
}
const mapStateToProps = (state) => ({
});
const mapDispatchToProps = {
};
export default connect(mapStateToProps, mapDispatchToProps)(Taxlots);
