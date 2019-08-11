import React from 'react'; // eslint-disable-line no-unused-vars
import {Card, CardTitle, CardText, CardImg, CardSubtitle} from 'reactstrap'

const Home = () => (
    <div>
      <Card className="card">
        <CardTitle>
        Home!
        </CardTitle>
        <CardText>
        Something comforting should show up here, but nothing so far.
        Try the <a href="/map">map link</a>.
        </CardText>
      </Card>
    </div>
)

export default Home;
