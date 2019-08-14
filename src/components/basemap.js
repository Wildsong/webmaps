import React, {useState} from 'react'; // eslint-disable-line no-unused-vars
import {control, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars

// Base layers
const esriClarityUrl = 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/' +
                    'World_Imagery/MapServer/tile/{z}/{y}/{x}'

// DOGAMI "https://gis.dogami.oregon.gov/arcgis/rest/services/Public"
const bareEarthHSUrl = "https://gis.dogami.oregon.gov/arcgis/services/Public/BareEarthHS/ImageServer/WMSServer?Layers=0"

/* ========================================================================== */

const BaseMap = () => {
    return (
        <>
            <layer.Image title="Bare Earth Hillshade" reordering={false}>
                <source.ImageWMS url={bareEarthHSUrl}/>
            </layer.Image>

            <layer.Tile title="ESRI Clarity" baseLayer={true} reordering={false} visible={false}>
                <source.XYZ url={esriClarityUrl}/>
            </layer.Tile>

            {/* Alternatives for streets: conventional or MVT */}
            <layer.Tile title="OpenStreetMap" baseLayer={true} reordering={false} visible={true} opacity={.75}>
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
        </>
    );
}
export default BaseMap;
