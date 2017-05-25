/*! Copyright 2016 Ayogo Health Inc. */
import * as angular from 'angular';
import AyCarousel from './index';
const modName = 'ayCarousel';
angular.module(modName, [])
    .directive('carousel', function () {
    return {
        restrict: 'E',
        link: function (_$scope, $element) {
            let el = $element[0];
            new AyCarousel(el);
        }
    };
});
export default modName;
//# sourceMappingURL=angular1.js.map