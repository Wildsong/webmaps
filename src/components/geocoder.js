import React, { useState } from 'react'; // eslint-disable-line no-unused-vars
import Select from 'react-select'
import { connect } from 'react-redux'
import { setMapCenter } from '../actions'
import { Button } from 'reactstrap'
import BootstrapTable from 'react-bootstrap-table-next'
import axios from 'axios'
import { fromLonLat } from 'ol/proj'

// We're querying any of these Nomimatim geocoders via Axios to find addresses in Clatsop county.
const nominatim = "https://nominatim.openstreetmap.org/search?format=json"

const locationiqKey = process.env.LOCATIONIQ_KEY;
if (typeof locationiqKey === 'undefined') console.error("LOCATIONIQ_KEY is undefined.");
const locationiq = "https://us1.locationiq.com/v1/search.php?format=json&key=" + locationiqKey

// https://opencagedata.com/api
// NOTE NOTE Opencage results are not in the standard nominatim format
const opencageKey = process.env.OPENCAGE_KEY;
if (typeof opencageKey === 'undefined') console.error("OPENCAGE_KEY is undefined.");
const opencage = "https://api.opencagedata.com/geocode/v1/json?key=" + opencageKey
    + '&proximity=[46,-123]'
    + '&pretty=1'

// There is a state provided service but it uses Esri geocoder so it's clumsy
// https://www.oregon.gov/geo/Pages/geoservices.aspx
//const oregonExplorer  = "https://navigator.state.or.us/arcgis/rest/services/Locators/gc_Composite/GeocodeServer"

const geocodeServer = nominatim
        + '&viewbox=' + encodeURIComponent('-123.35,45.7,-124.17,46.3') + '&bounded=1'
        + '&countrycodes=us'
        + '&addressdetails=1';

const answersKey = 'place_id'
const answersColumns = [
        {dataField:'place_id', text: 'ID'},
        {dataField:'display_name', text: 'Name'},
        {dataField:'type', text: 'Type'},
        {dataField:'lat', text: 'Latitude'},
        {dataField:'lon', text: 'Longitude'}
    ];

const requestGeocode = (query, addToTable) => {
    const url = geocodeServer
    + '&q=' + encodeURIComponent(query);

    axios.get(url)
    .then( (response) => {
        addToTable(response.data)
    })
    .catch( (error) => {
        console.log("Search failed", error);
    });
}

const Geocoder = ({ setMapCenter }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [answers, setAnswers ] = useState([]);

    const addToTable = (features) => {
        const rows = [];
        let lat = 0;
        let lon = 0;

        if (features.length > 0) {
            features.forEach( (feature) => {
                const attributes = {};
                // Copy the data from each feature into a list
                //const allprops = feature.getProperties();
                answersColumns.forEach ( (column) => {
                    try {
                        const text = feature[column.dataField];
                        //const url = taxmapsBaseUrl + '/tp_' + text + '.pdf';
                        attributes[column.dataField] = text;
                        if (column.dataField == 'lat') lat = text;
                        if (column.dataField == 'lon') lon = text;
                        //(typeof column.formatter !== 'undefined')?
                        //    column.formatter(url,text) : text;
                    } catch {
                        console.log("No column:", column)
                    };
                });
                rows.push(attributes)

            });
        }

        if (rows.length == 1 && lat != 0 && lat != 0) {
            // We have only one result, and it has a position
            const coord = [Number(lon), Number(lat)]
            setMapCenter(coord, 17)
        }
        setAnswers(rows);
    }

    // Refer to https://react-select.com/async for tips.
    const handleQuery = (e) => {
        setQuery(e);
        requestGeocode(e, addToTable);
        setSuggestions([
            { label: e, value: e }
        ]);
    }

    const handleChange = (e) => {
        console.log('handleChange', e, e.value);
        requestGeocode(e.value, addToTable);
    }

    return (
        <>
            input: { query }
                <Select
                    autoFocus
                    placeholder="search for something"
                    onInputChange={ handleQuery }
                    onChange={ handleChange }
                    options={ suggestions }
                />
                <BootstrapTable bootstrap4 condensed
                    keyField={ answersKey }
                    columns={ answersColumns }
                    data={ answers }
                />
        </>
    );
}
const mapStateToProps = (state) => (Object.assign({},
    state.mapExtent,
));
const mapDispatchToProps = {
    setMapCenter
};
export default connect(mapStateToProps, mapDispatchToProps)(Geocoder);
