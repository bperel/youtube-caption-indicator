#!/usr/bin/env bash

sed -i "s/__API_KEY__/`cat api_key`/g" src/youtube-caption-indicator.js src/popup/PopupApp.vue && \
\
yarn build-zip
