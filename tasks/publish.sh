#!/usr/bin/env bash

# NOTE NOTE NOTE you CANNOT just share a folder under /c/inetpub/wwwroot
# and then copy files into it, Microsoft does not like this idea even though
# it seems elegant to me. They will break IIS when you share the folder
# by disabling inheritance from wwwroot.

SERVER="cc-gis"

echo "Rebundling with parcel..."
rm -f dist/*
parcel build index.html --public-url ./ -o default.htm --detailed-report

echo "Copying files to server..."

# I suppose I should clean out the folder first.
# Or I could deploy to a different server. This 
# one runs Windows and is therefore fragile
# and relatively free of convenient features

scp -r dist/* {$SERVER}:/c/inetpub/wwwroot/apps/webmaps-ol/
