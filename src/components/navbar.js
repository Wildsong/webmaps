import React, { useState } from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { actions } from '../actions'
import { setMapQuery } from '../reducers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // eslint-disable-line no-unused-vars
// Font gallery: https://fontawesome.com/icons?d=gallery&s=solid
import { faGlobe, faCoffee, faCamera, faHome, faInfoCircle, faListOl, faSearch } from '@fortawesome/free-solid-svg-icons'; // eslint-disable-line no-unused-vars
import { NavLink } from 'redux-first-router-link'; // eslint-disable-line no-unused-vars
import { Collapse, Navbar, NavbarBrand, NavbarToggler, Nav, NavItem } from 'reactstrap'; // eslint-disable-line no-unused-vars

const MainNavbar = ({ center, zoom }) => {
    const [collapse, setCollapse] = useState(false);
    const toggle = () => { setCollapse(!collapse); }
    return (
        <Navbar color="light" light expand="md">
            <NavbarBrand><span id="sitelogo"></span><span id="sitename"></span></NavbarBrand>
            <NavbarToggler onClick={toggle} />
            <Collapse isOpen={collapse} navbar>
            <Nav className="ml-auto" navbar>
                <NavItem>
                    <NavLink to="/"><FontAwesomeIcon icon={ faHome } />Home</NavLink>
                </NavItem>
                <NavItem>
                <NavLink to={{ type: actions.MAP, query: setMapQuery(center, zoom) }}
                    activeClassName='active'
                    activeStyle={{ color: 'pink' }}
                    exact={true}
                    strict={true}
                ><FontAwesomeIcon icon={ faGlobe } /> Map</NavLink> &nbsp;
                </NavItem>
                <NavItem>
                    <NavLink to="/help"><FontAwesomeIcon icon={ faInfoCircle } />Help</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink to="/faq">FAQ</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink to="/news">News</NavLink>
                </NavItem>
                <NavItem>
                    <a id="map46logo" href="/about"></a>
                </NavItem>
            </Nav>
            </Collapse>
        </Navbar>
    );
}
MainNavbar.propTypes = {
    center: PropTypes.arrayOf(PropTypes.number),
    zoom: PropTypes.number
}
const mapStateToProps = (state) => ({
    center: state.map.center,
    zoom:   state.map.zoom,
});
export default connect(mapStateToProps)(MainNavbar);
