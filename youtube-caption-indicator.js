// ==UserScript==
// @name         Youtube caption indicator
// @namespace    youtube-caption-indicator
// @require      https://code.jquery.com/jquery-3.1.1.min.js
// @version      0.3
// @description  Add language-specific caption information in YouTube video blocks
// @author       Bruno Perel
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    var api_key = '';
    var current_timestamp;
    var cache_ttl = 3600;

    function getCacheValue(key, callback) {
        if (typeof GM_getValue === "function") {
            callback(JSON.parse(GM_getValue(key)));
        }
        else if (typeof(browser) === 'object') {
            browser.storage.sync.get(key, function(value) {
                callback(value[key]);
            });
        }
        else {
            console.error('No suitable cache provider!');
        }
    }

    function setCacheValue(key, value, wasAlreadyInCache, callback) {
        if (typeof GM_setValue === "function") {
            GM_setValue(key, JSON.stringify(value));
            callback(wasAlreadyInCache);
        }
        else if (typeof(browser) === 'object') {
            var object = {};
            object[key] = value;
            browser.storage.sync.set(object, function() {
                callback(wasAlreadyInCache);
            });
        }
        else {
            console.error('No suitable cache provider!');
        }
    }

    function addEmptyBadgeSectionAfter(afterWhat) {
        afterWhat.after(
            $('<div>')
                .addClass('yt-lockup-badges')
                .append(
                    $('<ul>').addClass('yt-badge-list')
                )
        );
    }

    function getCCInfo(videoId, callback) {
        getCacheValue('youtube-caption-indicator-' + videoId, function (ccInfo) {
            if (ccInfo && ccInfo.items) {
                if (current_timestamp - ccInfo.timestamp < cache_ttl) {
                    console.info(videoId + ': Retrieved CC info from cache');
                    callback(ccInfo.items, true);
                    return;
                }
                else {
                    console.info(videoId + ': Cache expired, retrieving CC info again');
                }
            }
            console.info(videoId + ': Retrieving CC info from API');
            $.getJSON('https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=' + videoId + '&key=' + api_key)
                .done(function (data) {
                    callback(data.items, false);
                })
                .fail(function (jqxhr, textStatus, error) {
                    var err = textStatus + ", " + error;
                    console.error(videoId + ': Request Failed: ' + err);
                });
        });
    }

    function getCCInfoElement(language) {
        var text = language ? ('CC ' + language) : '(no CC)';
        return $('<span>')
            .addClass('badge badge-style-type-collection style-scope ytd-badge-supported-renderer')
            .css({display: 'inline-block', paddingRight: '10px'})
            .append(
                $('<span>')
                    .addClass('style-scope ytd-badge-supported-renderer')
                    .text(text)
            );
    }

    function addCCInfoToVideoBlockElement(videoUrl, blockElement) {
        var videoId = videoUrl.replace(/^.+\?v=(.+)$/, '$1');
        getCCInfo(videoId, function (ccInfo, fromCache) {
            var ccNewElements = $.map(ccInfo, function (ccItem) {
                if (!ccItem.snippet) {
                    console.info(videoId + ': Malformed CC item: no snippet key, ignoring');
                }
                var isAuto = ccItem.snippet.trackKind === 'ASR';
                var language = isAuto ? 'auto' : ccItem.snippet.language;

                return getCCInfoElement(language);
            });

            if (ccInfo.length === 0) {
                ccNewElements = [getCCInfoElement(null)];
            }

            blockElement.html(ccNewElements);

            setCacheValue('youtube-caption-indicator-' + videoId, {
                timestamp: current_timestamp,
                items: ccInfo
            }, fromCache, function(wasAlreadyInCache) {
                if (!wasAlreadyInCache) {
                    console.info(videoId + ': Stored in cache for ' + cache_ttl + ' seconds');
                }
            });
        });
    }

    function getBadgeContainer(metaContainer) {
        var badgesContainer = metaContainer.find('div.yt-lockup-badges');
        return badgesContainer.length ? badgesContainer : null;
    }

    function hasProcessedBadges(ccDetailsContainer) {
        return ccDetailsContainer.find('li.yt-badge-item').length > 1;
    }

    function createIndicatorFromSearchResults() {
        current_timestamp = Math.floor(Date.now() / 1000);
        var videoBlockElement = $(this);
        var ccDetailsContainer;
        var metaContainer = videoBlockElement.find('#meta,#metadata').eq(0);
        var badgesContainer = getBadgeContainer(metaContainer);
        var videoUrl = videoBlockElement.find('a[href^="/watch"]').eq(0).attr('href');
        if (!!badgesContainer) {
            ccDetailsContainer = badgesContainer.find('ul.yt-badge-list');
            var ccElements = ccDetailsContainer.find('li.yt-badge-item');
            if (ccElements.length === 0) {
                console.info(videoId + ': No caption for this video, ignoring');
            }
            else if (hasProcessedBadges(ccDetailsContainer)) {
                console.info(videoId + ': Caption list already processed, ignoring');
            }
        }
        else {
            if (videoUrl) {
                addEmptyBadgeSectionAfter(metaContainer);
                ccDetailsContainer = videoBlockElement.find('ul.yt-badge-list');
                addCCInfoToVideoBlockElement(videoUrl, ccDetailsContainer);
            }
            else {
                console.info('Can\'t find the video\'s URL, ignoring');
            }
        }
    }

    function init() {
        var videoBlockSelector = 'ytd-grid-video-renderer,ytd-compact-video-renderer';

        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                $(mutation.addedNodes).filter(videoBlockSelector).each(createIndicatorFromSearchResults);
            });
        })
            .observe($('body').get(0), {
                childList: true,
                subtree: true
            });

        $(videoBlockSelector).each(createIndicatorFromSearchResults);
    }

    init();

})();