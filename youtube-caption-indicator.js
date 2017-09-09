// ==UserScript==
// @name         Youtube caption indicator
// @namespace    youtube-caption-indicator
// @require      https://code.jquery.com/jquery-3.1.1.min.js
// @version      0.2
// @description  Add language-specific caption information in YouTube video blocks
// @author       Bruno Perel
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    var api_key = '';
    var current_timestamp = Math.floor(Date.now() / 1000);
    var cache_ttl = 3600;

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
        var ccInfo = null;
        if (typeof GM_getValue === "function") {
            ccInfo = GM_getValue('youtube-caption-indicator-' + videoId);
            if (ccInfo) {
                ccInfo = JSON.parse(ccInfo);
                if (current_timestamp - ccInfo.timestamp < cache_ttl) {
                    console.info(videoId + ': Retrieved CC info from cache');
                    callback(ccInfo.items);
                    return;
                }
                else {
                    console.info(videoId + ': Cache expired, retrieving CC info again');
                }
            }
            $.getJSON('https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=' + videoId + '&key=' + api_key)
                .done(function (data) {
                    callback(data.items);

                    if (typeof GM_setValue === 'function') {
                        GM_setValue('youtube-caption-indicator-' + videoId, JSON.stringify({
                            timestamp: current_timestamp,
                            items: data.items
                        }));
                        console.info(videoId + ': Stored in cache for ' + cache_ttl + 'seconds');
                    }
                })
                .fail(function (jqxhr, textStatus, error) {
                    var err = textStatus + ", " + error;
                    console.error(videoId + ': Request Failed: ' + err);
                });
        }
        else {
            console.error('GM_getValue is undefined !');
        }
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
        if (videoId === 'qiuDE38TEpU') {
            debugger;
        }
        getCCInfo(videoId, function (ccInfo) {
            var ccNewElements = $.map(ccInfo, function (ccItem) {
                if (!ccItem.snippet) {
                    console.error(videoId + ': Malformed CC item: no snippet key, ignoring');
                }
                var isAuto = ccItem.snippet.trackKind === 'ASR';
                var language = isAuto ? 'auto' : ccItem.snippet.language;

                return getCCInfoElement(language);
            });

            if (ccInfo.length === 0) {
                ccNewElements = [getCCInfoElement(null)];
            }

            blockElement.html(ccNewElements);
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
        var videoBlockElement = $(this);
        var ccDetailsContainer;
        var metaContainer = videoBlockElement.find('#meta,#metadata').eq(0);
        var badgesContainer = getBadgeContainer(metaContainer);
        var videoUrl = videoBlockElement.find('a[href^="/watch"]').eq(0).attr('href');
        if (!!badgesContainer) {
            ccDetailsContainer = badgesContainer.find('ul.yt-badge-list');
            var ccElements = ccDetailsContainer.find('li.yt-badge-item');
            if (ccElements.length === 0) {
                console.log(videoId + ': No caption for this video, ignoring');
            }
            else if (hasProcessedBadges(ccDetailsContainer)) {
                console.log(videoId + ': Caption list already processed, ignoring');
            }
        }
        else {
            if (videoUrl) {
                addEmptyBadgeSectionAfter(metaContainer);
                ccDetailsContainer = videoBlockElement.find('ul.yt-badge-list');
                addCCInfoToVideoBlockElement(videoUrl, ccDetailsContainer);
            }
            else {
                console.log('Can\'t find the video\'s URL, ignoring');
            }
        }
    }

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


})();