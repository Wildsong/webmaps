import React from 'react'; // eslint-disable-line no-unused-vars
import {Card, CardTitle, CardText, CardImg, CardSubtitle} from 'reactstrap'; // eslint-disable-line no-unused-vars
import Version from '../../version'

const About = () => (
  <div>
  <Card>
  <CardTitle>
    About Webmaps
  </CardTitle>
  <CardText>
      <Version/>
  </CardText>
  </Card>
  </div>
);

export default About;
