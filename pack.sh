#!/usr/bin/env bash

build_dir=./build/

rm -rf youtube-caption-indicator.zip ${build_dir} && mkdir ${build_dir} && \
\
cp bower_components/jquery/dist/jquery.min.js youtube-caption-indicator.js manifest.json icon.png ${build_dir} && \
sed -i "s/__API_KEY__/`cat api_key`/g" ${build_dir}/youtube-caption-indicator.js && \
sed -i "s/\".*jquery.min.js\"/\"jquery.min.js\"/g" ${build_dir}/manifest.json && \
\
zip -j youtube-caption-indicator.zip ${build_dir}/*