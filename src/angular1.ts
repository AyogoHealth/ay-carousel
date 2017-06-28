/*! Copyright 2016 Ayogo Health Inc. */

import * as angular from 'angular';
import AyCarousel from './index';

const modName = 'ayCarousel';

angular.module(modName, [])
.directive('carousel', function() {
  return {
    restrict: 'E',
    link: function(_$scope, $element, attrs) {
      let el = $element[0] as HTMLElement;
      let carousel = new AyCarousel(el, attrs.config);
      let elementChanged = () => {
        carousel.updateItems();
      };
      let mutationObserver = new MutationObserver(elementChanged);
      mutationObserver.observe(el, { childList: true });
    }
  };
});

export default modName;
