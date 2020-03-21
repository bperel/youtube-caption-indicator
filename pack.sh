#!/usr/bin/env bash

set -e
yarn build
sed -i "s/__API_KEY__/`cat api_key`/g" dist/youtube-caption-indicator.js dist/popup/popup.js

yarn build-zip
