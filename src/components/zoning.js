import React, {useState, useEffect, useContext, useRef} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import {CollectionProvider} from '@map46/ol-react/collection-context' // eslint-disable-line no-unused-vars
import Collection from 'ol/Collection'
import {XMIN,YMIN,XMAX,YMAX, EXTENT_WM} from '../constants'
import Style from 'ol/style/Style'
import {Fill, Stroke, Text} from 'ol/style'
import {createTextStyle} from './styles'
import {myGeoServer, myArcGISServer, workspace, MAXRESOLUTION} from '../constants'

const ccZoningUrl = myArcGISServer + "/Zoning/FeatureServer/0";
const ccZoningAstoriaUrl = myArcGISServer + "/Zoning/FeatureServer/1";
const ccZoningCannonBeachUrl = myArcGISServer + "/Zoning/FeatureServer/2";
const ccZoningWarrentonUrl = myArcGISServer + "/Zoning/FeatureServer/3";

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


/* ========================================================================== */

const Zoning = ({layers}) => {
    return (
        <>
            <CollectionProvider collection={layers}>
                <layer.Vector title="Zoning, Warrenton" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={true}>
                    <source.JSON url={ccZoningWarrentonUrl} loader="esrijson"/>
                </layer.Vector>

                <layer.Vector title="Zoning, Cannon Beach" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={true}>
                    <source.JSON url={ccZoningCannonBeachUrl} loader="esrijson"/>
                </layer.Vector>

                <layer.Vector title="Zoning, Astoria" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={true}>
                    <source.JSON url={ccZoningAstoriaUrl} loader="esrijson"/>
                </layer.Vector>

                <layer.Vector title="Zoning" style={zoningStyle} reordering={false} maxResolution={MAXRESOLUTION} extent={EXTENT_WM} visible={true}>
                    <source.JSON url={ccZoningUrl} loader="esrijson"/>
                </layer.Vector>
            </CollectionProvider>

        </>
    )
}
Zoning.propTypes = {
    layers: PropTypes.instanceOf(Collection).isRequired,
}
export default Zoning;
