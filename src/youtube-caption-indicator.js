import { getCacheValue, setCacheValue, cacheTtl } from './lib/cache';
import jQuery from 'jquery';
window.$ = window.jQuery = jQuery;

const apiKey = '__API_KEY__';

const videoBlockSelector = 'ytd-grid-video-renderer,ytd-compact-video-renderer,ytd-video-renderer,ytm-video-with-context-renderer';

let userSettings;

let queue = [];
let currentUrl = null;
let currentTimestamp;

(() => {
  'use strict';

  function addEmptyBadgeSectionAfter(afterWhat) {
    afterWhat.after(
      $('<div>')
        .addClass('yt-lockup-badges youtube-caption-indicator')
        .append(
          $('<ul>')
            .addClass('yt-badge-list')
            .css({ padding: '10px 0' })
        )
    );
  }

  function getCCInfo(videoId, callback) {
    console.debug(`Getting CC info for ${videoId}`);
    getCacheValue(`youtube-caption-indicator-${videoId}`, ccInfo => {
      if (ccInfo && ccInfo.items) {
        if (currentTimestamp - ccInfo.timestamp < cacheTtl) {
          console.debug(`${videoId}: Retrieved CC info from cache`);
          callback(ccInfo.items, true);
          return;
        } else {
          console.debug(`${videoId}: Cache expired, retrieving CC info again`);
        }
      }
      console.debug(`${videoId}: Retrieving CC info from API`);
      $.getJSON(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`)
        .done(data => {
          callback(data.items, false);
        })
        .fail((jqxhr, textStatus, error) => {
          const err = `${textStatus}, ${error}`;
          console.error(`${videoId}: Request Failed: ${err}`);
        });
    });
  }

  function getCCInfoElement(language) {
    const text = language ? `CC ${language}` : '(no CC)';
    return $('<li>')
      .addClass('badge badge-style-type-collection style-scope ytd-badge-supported-renderer')
      .css({
        display: 'inline-block',
        padding: '2px 10px 8px 0',
        fontSize: '1.3rem',
        fontWeight: 500,
        textTransform: 'uppercase',
      })
      .append(
        $('<span>')
          .addClass('style-scope ytd-badge-supported-renderer')
          .text(text)
      );
  }

  function addCCInfoToVideoBlockElement(videoUrl, blockElement, callback) {
    const videoId = videoUrl.replace(/^.+\?v=(.+)$/, '$1');
    getCCInfo(videoId, (ccInfo, fromCache) => {
      let ccNewElements = $.map(ccInfo, ccItem => {
        if (!ccItem.snippet) {
          console.debug(`${videoId}: Malformed CC item: no snippet key, ignoring`);
        }
        const language = ccItem.snippet.language;
        console.log('Settings' + JSON.stringify(userSettings));

        if (!(userSettings.hasCustomLanguages && userSettings.customLanguages.indexOf(language) === -1)) {
          const isAuto = ccItem.snippet.trackKind === 'ASR';
          return getCCInfoElement(isAuto ? `${language} (auto)` : language);
        }
      });

      if (ccNewElements.length === 0) {
        ccNewElements = [getCCInfoElement(null)];
      }

      blockElement.html(ccNewElements);

      setCacheValue(
        `youtube-caption-indicator-${videoId}`,
        {
          timestamp: currentTimestamp,
          items: ccInfo,
        },
        fromCache,
        wasAlreadyInCache => {
          if (!wasAlreadyInCache) {
            console.debug(`${videoId}: Stored in cache for ${cacheTtl} seconds`);
          }
          callback();
        }
      );
    });
  }

  function hasProcessedBadges(metaContainer) {
    return metaContainer.siblings('.yt-lockup-badges.youtube-caption-indicator').length;
  }

  function addUrlToQueue() {
    currentTimestamp = Math.floor(Date.now() / 1000);
    const videoBlockElement = $(this);
    const metaContainer = videoBlockElement.find('#meta,#metadata,.large-media-item-info').eq(0);
    if (hasProcessedBadges(metaContainer)) {
      console.debug('Video has already been processed, ignoring');
    } else {
      const videoUrl = videoBlockElement
        .find('a[href^="/watch"]')
        .eq(0)
        .attr('href');
      if (videoUrl) {
        addEmptyBadgeSectionAfter(metaContainer);
        queue.push({
          url: videoUrl,
          container: videoBlockElement.find('ul.yt-badge-list'),
        });
      } else {
        console.debug("Can't find the video's URL, ignoring");
      }
    }
  }

  function processQueue() {
    console.debug('Processing queue');
    if (currentUrl === null && queue.length) {
      console.debug(`Queue size is ${queue.length}`);
      currentUrl = queue.shift();
      addCCInfoToVideoBlockElement(currentUrl.url, currentUrl.container, () => {
        currentUrl = null;
        processQueue();
      });
    }
  }

  getCacheValue('settings', settings => {
    userSettings = settings || {};
    console.debug(`Settings loaded : ${JSON.stringify(userSettings)}`);

    new MutationObserver(() => {
      $(videoBlockSelector).each(addUrlToQueue);
      processQueue();
    }).observe(document.body, {
      childList: true,
      subtree: true,
    });

    $(videoBlockSelector).each(addUrlToQueue);
    processQueue();
  });
})();
