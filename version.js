import React from 'react'; // eslint-disable-line no-unused-vars
import pjson from './package.json'

const Version = () => {
    console.log(pjson);
    return (
        <>
        <a href={pjson.homepage}>{pjson.name} {pjson.version}</a>
        </>
    );
}
export default Version;
