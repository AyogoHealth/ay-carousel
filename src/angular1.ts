/*! Copyright 2016 Ayogo Health Inc. */

import * as angular from 'angular';
import AyCarousel from './index';

const modName = 'ayCarousel';

angular.module(modName, [])
.directive('carousel', function() {
  return {
    restrict: 'E',
    link: function($scope, $element, attrs) {
      let el = $element[0] as HTMLElement;
      let carousel = new AyCarousel(el, attrs.config);

      let mutationObserver = new MutationObserver(() => {
        carousel.updateItems();
      });
      mutationObserver.observe(el, { childList: true });

      $scope.$on('$destroy', () => {
        mutationObserver.disconnect();
        carousel.cleanUp();
      });
    }
  };
});

export default modName;
