import React, {useState, useEffect, useContext, useRef} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {Map, View, Feature, Overlay, control, geom, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars
import {CollectionProvider} from '@map46/ol-react/collection-context' // eslint-disable-line no-unused-vars
import Collection from 'ol/Collection'
import {XMIN,YMIN,XMAX,YMAX, EXTENT_WM} from '../constants'

// DOGAMI
const dogamiServer = "https://gis.dogami.oregon.gov/arcgis/rest/services/Public"
const dogamiLandslideUrl = dogamiServer + "/Landslide_Susceptibility/ImageServer"
const dogamiSlidoUrl = dogamiServer + "/SLIDO3_4/MapServer"

/* ========================================================================== */

const DogamiHazards = ({layers}) => {
    return (
        <>
            <CollectionProvider collection={layers}>
                <layer.Image title="DOGAMI Landslide Susceptibility" opacity={.90} reordering={false} visible={true} extent={EXTENT_WM}>
                    <source.ImageArcGISRest url={dogamiLandslideUrl}/>
                </layer.Image>

                <layer.Image title="DOGAMI Slides" opacity={.90} reordering={false} visible={true} extent={EXTENT_WM}>
                    <source.ImageArcGISRest url={dogamiSlidoUrl}/>
                </layer.Image>
            </CollectionProvider>
        </>
    )
}
DogamiHazards.propTypes = {
    layers: PropTypes.instanceOf(Collection).isRequired,
}
export default DogamiHazards;
