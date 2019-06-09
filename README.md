## Youtube caption indicator

Ever wondered if a YouTube video is subtitled in your language, without having to open it ?

Youtube caption indicator adds language-specific closed caption indicators below the description of each video among Youtube search results and "similar videos" panels.

![Demo](caption-indicator-demo.png)

## Build

Create a file named `api_key` at the root of the project and fill it with your YouTube API key.
Run `yarn install`, then build the project with `yarn build`. See [vue-web-extension](https://github.com/Kocal/vue-web-extension) for other build options

### Install on Chrome

Enable developer options in Chrome's extension page, click on "Load unpacked extension" and select the project's `dist` directory.

### Install on Firefox

Go to [about:addons](about:addons) and import the extension from the `dist` directory.

### Install on Greasemonkey/Tapermonkey

Just import the script from the `dist` directory.

## Pack

Run `sh pack.sh`
