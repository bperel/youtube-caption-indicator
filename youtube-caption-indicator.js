// ==UserScript==
// @name         Youtube caption indicator
// @namespace    youtube-caption-indicator
// @require      https://code.jquery.com/jquery-3.1.1.min.js
// @version      0.1
// @description  Add language-specific caption information in YouTube video blocks
// @author       Bruno Perel
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var api_key = '';

    function addEmptyBadgeSectionAfter(afterWhat) {
        afterWhat.after(
            $('<div>')
                .addClass('yt-lockup-badges')
                .append(
                    $('<ul>').addClass('yt-badge-list')
                )
        );
    }

    function addCCInfoToVideoBlockElement(videoId, blockElement) {
        $.getJSON('https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=' + videoId + '&key=' + api_key)
            .done(function (data) {
                var ccNewElements = $.map(data.items, function (ccItem) {
                    if (!ccItem.snippet) {
                        console.error('Malformed CC item: no snippet key, ignoring');
                    }
                    var isAuto = ccItem.snippet.trackKind === 'ASR';
                    var language = ccItem.snippet.language;
                    var text = 'CC ' + (isAuto ? 'auto' : language);

                    return $('<li>')
                        .addClass('yt-badge-item')
                        .append(
                            $('<span>')
                                .addClass('yt-badge')
                                .text(text)
                        );
                });
                blockElement.html(ccNewElements);
            })
            .fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.error("Request Failed: " + err);
            });
    }

    function getBadgeContainer(videoBlockElement) {
        var badgesContainer = videoBlockElement.find('div.yt-lockup-badges');
        return badgesContainer.length ? badgesContainer : null;
    }

    function hasProcessedBadges(ccDetailsContainer) {
        return ccDetailsContainer.find('li.yt-badge-item').length > 1;
    }

    function createIndicatorFromSearchResults() {
        var videoBlockElement = $(this);
        var videoId = videoBlockElement.attr('data-context-item-id');
        var ccDetailsContainer;
        var badgesContainer = getBadgeContainer(videoBlockElement);
        if (!!badgesContainer) {
            ccDetailsContainer = badgesContainer.find('ul.yt-badge-list');
            var ccElements = ccDetailsContainer.find('li.yt-badge-item');
            if (ccElements.length === 0) {
                console.log('No caption for this video, ignoring');
                return;
            }
            else if (hasProcessedBadges(ccDetailsContainer)) {
                console.log('Caption list already processed, ignoring');
                return;
            }
        }
        else {
            addEmptyBadgeSectionAfter(videoBlockElement.find('.yt-lockup-description'));
            ccDetailsContainer = videoBlockElement.find('ul.yt-badge-list');
        }
        addCCInfoToVideoBlockElement(videoId, ccDetailsContainer);
    }

    function createIndicatorFromRelatedVideos() {
        var videoBlockElement = $(this);
        var videoId = videoBlockElement.find('a.content-link').attr('href').replace(/^.+\?v=(.+)$/, '$1');

        var badgesContainer = getBadgeContainer(videoBlockElement);
        if (!!badgesContainer) {
            console.log('Caption list already processed, ignoring');
        }
        else {
            addEmptyBadgeSectionAfter(videoBlockElement.find('.stat.view-count'));
            addCCInfoToVideoBlockElement(videoId, videoBlockElement.find('ul.yt-badge-list'));
        }
    }

    $('body')
        .on('DOMNodeInserted', '[data-context-item-id]', createIndicatorFromSearchResults)
        .on('DOMNodeInserted', '.related-list-item-compact-video, .autoplay-bar .video-list-item', createIndicatorFromRelatedVideos);

    $('[data-context-item-id]').each(createIndicatorFromSearchResults);

    $('.related-list-item-compact-video, .autoplay-bar .video-list-item').each(createIndicatorFromRelatedVideos);


})();