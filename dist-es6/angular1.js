/*! Copyright 2016 Ayogo Health Inc. */
import * as angular from 'angular';
import AyCarousel from './index';
const modName = 'ayCarousel';
angular.module(modName, [])
    .directive('carousel', function () {
    return {
        restrict: 'E',
        scope: {
            config: '=',
            index: '<?',
            initialIndex: '@',
            onIndexChange: '&',
            onMove: '&'
        },
        link: function ($scope, $element) {
            let el = $element[0];
            let carousel = new AyCarousel(el, $scope.config, $scope.initialIndex, $scope.onIndexChange, $scope.onMove);
            let mutationObserver = new MutationObserver(() => {
                carousel.updateItems();
            });
            mutationObserver.observe(el, { childList: true });
            $scope.$watch('index', (newVal) => {
                if (newVal) {
                    let index = parseInt(newVal, 10);
                    carousel.setIndex(index);
                    carousel.snap(index);
                }
            });
            $scope.$on('$destroy', () => {
                mutationObserver.disconnect();
                carousel.cleanUp();
            });
        }
    };
});
export default modName;
//# sourceMappingURL=angular1.js.map