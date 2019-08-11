# Webmaps, a subproject of Map46

This is a demonstration taxlots / zoning front dest app.

All the other folders in the map46 repository are just R&D for this one.

# Requirements and/or goals

Single page application with react and bootstrap.

Projection- web mercator ok? Is there really any other option?

* Slippy map with controls
  * zoom controls: +- and slider
  * Scalebar
* On map frame, show
  * Zoom level
  * Scale
  * Mouse position (lat lon / usng)
  * Layer control
* Legend
* Export to PDF with templates for layout and some customizations
* Permalinks, including copy to clipboard
* Bookmarks
  * Presets
  * User defined (localStorage in browser? (does sync work?))
* Search
  * Free text and advanced: account #, taxlot #, owner, mailing address, situs
  * Geocoded (possibly failover if free text search fails?)
  * Search results include links to taxmaps and (other).
* Map layers:
  * Taxlots - FeatureServer * local live database
  * Zoning - FeatureServer * local live database
  * SLIDO? * DOGAMI service
  * Contours - need to build a new one * local static data
  * Hillshade - DOGAMI service
  * Basemap - probably several? OpenStreetMap service, ESRI basemap service?
  * Basemap - Air photo (Probably several)
* Documentation:
  * Help
  * FAQ
* Redlining?
* Measure?
* Link to StreetView?
* Remember settings in browser (eg last view, active layers, recent searches)

It would be nice if the app were responsive so that it can be viewed on a phone/tablet but
this app will target internal users / front desk so it's not a requirement.

## Branding

These items can be easily swapped in, via a style sheet.
They are not checked in to this repository.

* API keys and any other proprietary / private information
* Logo
* Title
* Disclaimer/entry tunnel
* Link to parent web site
* Announcement(s)
* FAQ
* Help

# Installation and deployment

## Install packages

We're using Parcel here so you should only need to do this.

  npm install

## Run it for development

On Windows, run it from a cmd window not a bash window.

    npm start

Running this loads parcel (see package.json 'scripts' section.)
and the set up there launches a brower but this is the URL if your
computer does not have a browser. :-O

    http://localhost:1234/

## Build it

Doing this will bundle up a set of files that can be deployed in the dist/ folder.

    npm run-script build

## Deploy it

For example, to https://map46.com/

    scp -r dist/* bellman.wildsong.biz:/var/www/map46/html

I usually do an "rm -f" to clean out the html folder first.
