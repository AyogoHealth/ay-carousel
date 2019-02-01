/*! Copyright 2016 Ayogo Health Inc. */

import * as angular from 'angular';
import AyCarousel from './index';

const modName = 'ayCarousel';

angular.module(modName, [])
.directive('carousel', function() {
  return {
    restrict: 'E',
    scope: {
      config: '=',
      index: '<?',
      initialIndex: '@',
      onIndexChange: '&',
      onMove: '&',
      disable: '<?'
    },
    link: function($scope: any, $element) {
      let el = $element[0] as HTMLElement;
      let carousel, mutationObserver;

      if(!$scope.disable) {
        carousel = new AyCarousel(el, $scope.config, $scope.initialIndex, $scope.onIndexChange, $scope.onMove);

        mutationObserver = new MutationObserver(() => {
          carousel.updateItems();
        });
        mutationObserver.observe(el, { childList: true });
      }

      $scope.$watch('index', (newVal) => {
        let index = parseInt(newVal, 10);

        if(!isNaN(index)) {
          if(carousel) {
            carousel.setIndex(index);
            carousel.snap(index);
          }
        }
      });

      $scope.$watch('disable', (newVal, oldVal) => {
        if (newVal === oldVal) {
          return;
        }

        if (!newVal) {
          carousel = new AyCarousel(el, $scope.config, $scope.initialIndex, $scope.onIndexChange, $scope.onMove);

          mutationObserver = new MutationObserver(() => {
            carousel.updateItems();
          });
          mutationObserver.observe(el, { childList: true });
        } else if (carousel) {
          carousel.snap(0);
          carousel.cleanUp();
          mutationObserver.disconnect();
        }
      });

      $scope.$on('$destroy', () => {
        if (mutationObserver) {
          mutationObserver.disconnect();
        }

        if (carousel) {
          carousel.cleanUp();
        }
      });
    }
  };
});

export default modName;
