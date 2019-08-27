import React, {useState, useEffect} from 'react'  // eslint-disable-line no-unused-vars
import {Card, CardTitle, CardText, Button} from 'reactstrap'  // eslint-disable-line no-unused-vars
import Modali, {useModali} from 'modali'  // eslint-disable-line no-unused-vars
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome' // eslint-disable-line no-unused-vars
import {faPrint} from '@fortawesome/free-solid-svg-icons' // eslint-disable-line no-unused-vars

import View from 'ol/View';
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import moment from 'moment'

import Mark from 'markup-js'

import shortid from 'shortid'
for (let i=0; i<10; i++) {
    console.log("shortid test", shortid.generate());
}

//import PrintImage from './printImage';

import PrintPreviewImage from './printPreviewImage';
import GeoPdfPlugin from './geopdf';
import layouts from './printLayouts';

//import { getActiveMapSources } from '../../actions/mapSource';
//import { printed } from '../../actions/print';

// TODO-- add description text block support

const timestamp = () => {
    return moment().format('YYYYMMDDhhmmss')
}


const PrintButton = () => {
    const [printModal, togglePrintModal] = useModali({
        animated: true,
        closeButton: false,
        buttons: [
            <Modali.Button label="Print" onClick={(e)=>printMap(e)}/>,
            <Modali.Button label="Cancel" isStyleCancel onClick={() => togglePrintModal()}/>
        ]
    });
    const [title, setTitle] = useState("Clatsop County");
    const [layout, setLayout] = useState(layouts[0]);
    const [resolution, setResolution] = useState("1");
//    const [description, setDescription] = useState("");

    const titleChanged = (e) => {
        setTitle(e.target.value);
    }

//    const descriptionChanged = (e) => {
//        setDescription(e.target.value);
//    }

    const addText = (doc, element) => {
        // dictionary for the map text mark up
        const date = new Date();
        const subst_dict = {
            title,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };

        // def needs to define: x, y, text
        const defaults = {
            size: 13,
            color: [0, 0, 0],
            font: 'helvetica', // BROKEN 'Arial',
            fontStyle: 'normal'
        };

        // create a new font definition object based on
        //  the combination of the defaults and the definition
        //  passed in by the user.
        const full_def = Object.assign({}, defaults, element);

        doc.setFontSize(full_def.size);
        doc.setTextColor(full_def.color[0], full_def.color[1], full_def.color[2]);
        doc.setFont(full_def.font, full_def.fontStyle);

        doc.text(full_def.x, full_def.y, Mark.up(full_def.text, subst_dict));
    }

    const addMapImage = (doc, element) => {
/* not using JPG format
        const jpegCompressionLUT = {
            'std': 'FAST',
            'btr': 'SLOW',
            'bst': 'NONE'
        }
*/
        console.log("element = ", element);

        html2canvas(document.querySelector(".ol-viewport")).then((canvas) => {
            //document.body.appendChild(canvas) // this attaches the image at the bottom of the window
            const data = canvas.toDataURL('image/png');

            doc.addImage(data, 'PNG', element.x, element.y, element.width, element.height);
        // This is a hack to make sure the image download completes before the doc gets written.
        // I'd rather put it elsewhere
            doc.save('ccwebmaps_' + timestamp() + '.pdf');
        });
    }

    const addImage = (doc, element) => {
    }

    const addDrawing = (doc, element) => {
    }

    /**
     * Convert units to PDF units
     */
    const toPoints = (n, unit) => {
        let k = 1;

        // this code is borrowed from jsPDF
        //  as it does not expose a public API
        //  for converting units to points.
        switch (unit) {
            case 'pt':
                k = 1;
                break;
            case 'mm':
                k = 72 / 25.4;
                break;
            case 'cm':
                k = 72 / 2.54;
                break;
            case 'in':
                k = 72;
                break;
            case 'px':
                k = 96 / 72;
                break;
            case 'pc':
                k = 12;
                break;
            case 'em':
                k = 12;
                break;
            case 'ex':
                k = 6;
                break;
            default:
                throw new Error('Invalid unit: ' + unit);
        }
        return n * k;
    }

    /* The Map Image size changes based on the layout used
     * and the resolution selected by the user.
     *
     * @param layout The layout definition.
     * @param resolution The "map size" multiplier.
     *
     * @return An object with "width" and "height" properties.
     */
    const getMapSize = (layout, resolution) => {
        // find the map element
        let map_element = null;
        for (const element of layout.elements) {
            if (element.type === 'map') {
                map_element = element;
                break;
            }
        }

        // calculate the width and height and kick it back.
        return {
            width: this.toPoints(map_element.width, layout.units) * resolution,
            height: this.toPoints(map_element.height, layout.units) * resolution
        };
    }

    /* Update the map size when layout or resolution has changed.
     */
    const updateMapLayout = () => {
        // check for the first map element and then use that as the render size.
        const layout = layouts[parseInt(layout.value, 10)];
        // convert the resolution to a multiplier.
        const resolution = parseFloat(resolution.value);
        getMapSize(layout, resolution);
    }

    const makePDF = (layout) => {
        // Install the geopdf plugin, if we don't find it. It gets used in addMapImage.
        if (!jsPDF.API.setGeoArea) GeoPdfPlugin(jsPDF.API);

        // Create a new PDF document.
        const doc = new jsPDF({
            orientation: layout.orientation,
            unit: layout.unit,
            format: layout.format,
            compress: true
        });

/*
        doc.addFont('Arial', 'Arial', 'normal');
        doc.addFont('Arial-Bold', 'Arial', 'bold');
*/
        console.log('fontlist', doc.getFontList())

        // iterate through the elements of the layout
        //  and place them in the document.
        for (const element of layout.elements) {
            switch(element.type) {
                case 'text':
                    addText(doc, element);
                    break;
                case 'map':
                    //addMapImage(doc, element);
                    break;
                case 'image':
                    addImage(doc, element);
                    break;
                case 'rect':
                case 'ellipse':
                    addDrawing(doc, element);
                    break;
                default:
                    // pass, do nothing.
            }
        }

        // We need to wait for addMapImage to complete first!
        doc.save('ccwebmaps_' + timestamp() + '.pdf');
    }

    const printMap = (e) => {
        console.log("Printing", layout);
        makePDF(layout);
        togglePrintModal();
        e.preventDefault();
    }

    const SelectLayout = () => {
        // convert the layouts to options based on their index
        //  and the label given in "label"
        const options = [];
        for(let i = 0, ii = layouts.length; i < ii; i++) {
            options.push(<option key={ i } value={ i }>{ layouts[i].label }</option>);
        }
        // kick back the select.
        return (
            <select onChange={(e) => setLayout(e.target.value)}>
                {options}
            </select>
        );
    }

    const SelectResolution = () => (
        <select onChange={(e) => setResolution(e.target.value)}>
            <option value='1'>Normal</option>
            <option value='1.5'>Higher</option>
            <option value='2'>Highest</option>
        </select>
    );

    return (
        <>
            <Button onClick={togglePrintModal}><FontAwesomeIcon icon={faPrint}/>Print</Button>
            <Modali.Modal {...printModal}>
                <div className="print-modal">
                <div className="print-preview">
                <PrintPreviewImage/>
                </div>
                <div className="print-form">
                <form>
                    Title: <input type="text" value={title} onChange={titleChanged}/><br />
                    Layout: <SelectLayout/><br />
                    Resolution: <SelectResolution/><br />
{/*
                        Additional descriptive text:
                    <textarea value={description} onChange={descriptionChanged}/>
*/}
                </form>
                </div>
                </div>
            </Modali.Modal>
        </>
    );
}
export default PrintButton;
