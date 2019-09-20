#!/usr/bin/env bash

# in my current set up the destination is a Windows share.
SERVER="//cc-gis"

echo "rebundling with parcel..."
rm dist/*
parcel build index.html --public-url ./ -o default.htm --detailed-report

echo "syncing to server..."
rsync -av --delete dist/ {$SERVER}/maps
