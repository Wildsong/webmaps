import React from 'react'; // eslint-disable-line no-unused-vars
import {Card, CardTitle, CardText, CardImg, CardSubtitle} from 'reactstrap'; // eslint-disable-line no-unused-vars

const img = require('/assets/lewis_and_clark.jpg');
const alt = 'Lewis and Clark';

const NotFound = () => (
    <div>
      <Card className="card">
        <CardTitle>
          404 error, are you lost?
        </CardTitle>
        <CardText>
          There is no destination attached to the URL you requested.
        </CardText>
        <CardImg className="card_image" width="100%" src={img} alt={alt}></CardImg>
      </Card>
    </div>
)

export default NotFound;
