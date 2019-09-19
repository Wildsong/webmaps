import React, {useState} from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {control, interaction, layer, source} from '@map46/ol-react';  // eslint-disable-line no-unused-vars

import {myArcGISServer} from '../constants'
import {EXTENT_WM} from '../constants'

// Clatsop County BaseMap
const ccBasemapUrl = myArcGISServer + "/Clatsop_County_basemap/MapServer/tile/{z}/{y}/{x}"

// ESRI Clarity aerial
const esriClarityUrl = 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/' +
                    'World_Imagery/MapServer/tile/{z}/{y}/{x}'

// DOGAMI "https://gis.dogami.oregon.gov/arcgis/rest/services/Public"
const bareEarthHSUrl = "https://gis.dogami.oregon.gov/arcgis/services/Public/BareEarthHS/ImageServer/WMSServer?Layers=0"

// OSIP = Oregon State Imagery Program
const osipServer = "https://imagery.oregonexplorer.info/arcgis/rest/services"
const osipImageryUrl = osipServer + '/OSIP_2018/OSIP_2018_WM/ImageServer/tile/{z}/{y}/{x}'
const naipImageryUrl = osipServer + '/NAIP_2016/NAIP_2016_WM/ImageServer/tile/{z}/{y}/{x}'

/* ========================================================================== */
// extent={EXTENT_WM}

const BaseMap = () => {

    return (
        <>
            <layer.Image title="Bare Earth Hillshade" reordering={false} displayInLayerSwitcher={false}>
                <source.ImageWMS url={bareEarthHSUrl}/>
            </layer.Image>
{/*
            <layer.Tile title="ESRI Clarity" baseLayer={true} reordering={false} visible={false}>
                <source.XYZ url={esriClarityUrl}/>
            </layer.Tile>

            <layer.Tile title="NAIP 2016" baseLayer={true} reordering={false} visible={false}>
                <source.XYZ url={naipImageryUrl}/>
            </layer.Tile>
*/}
            <layer.Tile title="Aerial, Oregon 2018" baseLayer={true} reordering={false} visible={false}>
                <source.XYZ url={osipImageryUrl}/>
            </layer.Tile>

            {/* Alternatives for streets: conventional or MVT */}
            <layer.Tile title="OpenStreetMap" baseLayer={true} reordering={false} visible={false} opacity={.75}>
                <source.OSM/>
            </layer.Tile>
            {/* MVT
            <layer.VectorTile title="Mapbox Streets" baseLayer={true} visible={true} style={mapboxStyle} declutter={true}>
                <source.VectorTile url={mapboxStreetsUrl}/>
            </layer.VectorTile>
            */}

            <layer.Tile title="Clatsop County"  baseLayer={true} opacity={.80}>
                <source.XYZ url={ccBasemapUrl}/>
            </layer.Tile>
        </>
    );
}
export default BaseMap;
