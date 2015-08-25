'use strict';

(function (angular) {
  angular.module('youtubePluginWidget')
    .controller('WidgetFeedCtrl', ['DataStore', 'TAG_NAMES', 'STATUS_CODE', 'YoutubeApi', '$routeParams', 'VIDEO_COUNT', '$sce', 'Location', '$rootScope', 'LAYOUTS',
      function (DataStore, TAG_NAMES, STATUS_CODE, YoutubeApi, $routeParams, VIDEO_COUNT, $sce, Location, $rootScope, LAYOUTS) {
        var WidgetFeed = this;

        WidgetFeed.data = null;
        //create new instance of buildfire carousel viewer
        var view = null;
        WidgetFeed.videos = [];
        WidgetFeed.busy = false;
        WidgetFeed.nextPageToken = null;
        var currentListLayout = null;

        /*
         * Fetch user's data from datastore
         */
        var init = function () {
          var success = function (result) {
              WidgetFeed.data = result.data;
              if (WidgetFeed.data && WidgetFeed.data.design && (!WidgetFeed.data.design.itemListLayout)) {
                WidgetFeed.data.design.itemListLayout = LAYOUTS.listLayouts[0].name;
              }
              currentListLayout = WidgetFeed.data.design.itemListLayout;
            }
            , error = function (err) {
              if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                console.error('Error while getting data', err);
              }
            };
          DataStore.get(TAG_NAMES.YOUTUBE_INFO).then(success, error);
        };

        init();
        $rootScope.$on("Carousel:LOADED", function () {
          if (!view) {
            view = new buildfire.components.carousel.view("#carousel", []);
          }
          if (WidgetFeed.data.content && WidgetFeed.data.content.carouselImages) {
            view.loadItems(WidgetFeed.data.content.carouselImages);
          } else {
            view.loadItems([]);
          }
        });

        var onUpdateCallback = function (event) {
          if (event && event.tag === TAG_NAMES.YOUTUBE_INFO) {
            WidgetFeed.data = event.data;
            if (WidgetFeed.data && WidgetFeed.data.design && (!WidgetFeed.data.design.itemListLayout)) {
              WidgetFeed.data.design.itemListLayout = LAYOUTS.listLayouts[0].name;
            }

            if (currentListLayout != WidgetFeed.data.design.itemListLayout) {
              view._destroySlider();
              view = null;
            }
            else {
              if (view) {
                view.loadItems(WidgetFeed.data.content.carouselImages);
              }
            }
            currentListLayout = WidgetFeed.data.design.itemListLayout;
            if (WidgetFeed.data.content && WidgetFeed.data.content.playListID && (WidgetFeed.data.content.playListID !== $routeParams.playlistId)) {
              $routeParams.playlistId = WidgetFeed.data.content.playListID;
              Location.goTo("#/feed/" + WidgetFeed.data.content.playListID);
            } else if (WidgetFeed.data.content && WidgetFeed.data.content.videoID)
              Location.goTo("#/video/" + WidgetFeed.data.content.videoID);
          }
        };
        DataStore.onUpdate().then(null, null, onUpdateCallback);

        WidgetFeed.loadMore = function () {
          if (WidgetFeed.busy) return;
          WidgetFeed.busy = true;
          var _playlistId = $routeParams.playlistId;
          var success = function (result) {
              WidgetFeed.videos = WidgetFeed.videos.length ? WidgetFeed.videos.concat(result.data.items) : result.data.items;
              WidgetFeed.nextPageToken = result.data.nextPageToken;
              if (WidgetFeed.videos.length < result.data.pageInfo.totalResults) {
                WidgetFeed.busy = false;
              }
            }
            , error = function (err) {
              console.error('Error In Fetching Single Video Details', err);
            };
          YoutubeApi.getFeedVideos(_playlistId, VIDEO_COUNT.LIMIT, WidgetFeed.nextPageToken).then(success, error);
        };

        WidgetFeed.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        WidgetFeed.showDescription = function (description) {
         return !(description == '<p>&nbsp;<br></p>');
        };

      }])
})(window.angular);
