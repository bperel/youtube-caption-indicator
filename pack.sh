#!/usr/bin/env bash

rm -f youtube-caption-indicator.zip && \
cp bower_components/jquery/dist/jquery.min.js jquery.min.js && \
cp youtube-caption-indicator.js youtube-caption-indicator_orig.js
sed -i "s/__API_KEY__/`cat api_key`/g" youtube-caption-indicator.js
zip youtube-caption-indicator.zip \
    youtube-caption-indicator.js \
    README.md \
    manifest.json \
    jquery.min.js \
    assets/icon.png && \
mv youtube-caption-indicator_orig.js youtube-caption-indicator.js && \
rm jquery.min.js