import Style from 'ol/style/Style'
import {Circle, Fill, Icon, Stroke, Text} from 'ol/style'

export const createTextStyle = (feature, resolution, params, getText) => {
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
