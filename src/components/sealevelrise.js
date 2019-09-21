import React, {useState, useEffect, useContext, useRef} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import {CollectionProvider} from '@map46/ol-react/collection-context' // eslint-disable-line no-unused-vars
import Collection from 'ol/Collection'

// NOAA Sea Level Rise
// https://coast.noaa.gov/slrdata/
// https://www.climate.gov/news-features/decision-makers-toolbox/viewing-sea-level-rise
//
const noaaSeaLevelServer = "https://coast.noaa.gov/arcgis/rest/services"
const noaa0ft  = noaaSeaLevelServer + "/dc_slr/conf_0ft/MapServer"
const noaa1ft  = noaaSeaLevelServer + "/dc_slr/conf_1ft/MapServer"
const noaa3ft  = noaaSeaLevelServer + "/dc_slr/conf_3ft/MapServer"
const noaa5ft  = noaaSeaLevelServer + "/dc_slr/conf_5ft/MapServer"
const noaa10ft = noaaSeaLevelServer + "/dc_slr/conf_10ft/MapServer"

/* ========================================================================== */

const SealevelRise = ({layers}) => {
    return (
        <>
            <CollectionProvider collection={layers}>
                <layer.Image title="0 foot" reordering={false} visible={true}>
                    <source.ImageArcGISRest url={noaa0ft}/>
                </layer.Image>
                <layer.Image title="1 foot" reordering={false} visible={false}>
                    <source.ImageArcGISRest url={noaa1ft}/>
                </layer.Image>
                <layer.Image title="3 foot" reordering={false} visible={false}>
                    <source.ImageArcGISRest url={noaa3ft}/>
                </layer.Image>
                <layer.Image title="5 foot" reordering={true} visible={false}>
                    <source.ImageArcGISRest url={noaa5ft}/>
                </layer.Image>
                <layer.Image title="10 foot" reordering={false} visible={false}>
                    <source.ImageArcGISRest url={noaa10ft}/>
                </layer.Image>
            </CollectionProvider>
        </>
    )
}
SealevelRise.propTypes = {
    layers: PropTypes.instanceOf(Collection).isRequired,
}
export default SealevelRise;
