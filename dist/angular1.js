/*! Copyright 2017 Ayogo Health Inc. */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('angular')) :
	typeof define === 'function' && define.amd ? define(['angular'], factory) :
	(global.ayCarousel = factory(global.angular));
}(this, (function (angular) { 'use strict';

var assign = function (target) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
            for (var nextKey in nextSource) {
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
};

var CAROUSEL_STYLES = "\n  .progress-dots  {\n    text-align: center;\n  }\n\n  .progress-dots > li.active {\n    background: #24282a;\n  }\n\n  .progress-dots > li {\n    border-radius: 50%;\n    display: inline-block;\n    margin: 0 5px;\n    width: 8px;\n    height: 8px;\n    border: 1px solid #24282a;\n  }\n\n  .carousel-item {\n    width: 90%;\n    flex: 0 0 auto;\n  }\n";
var AyCarousel = (function () {
    function AyCarousel(carousel, config, initialIndex, onIndexChange, onMove) {
        if (initialIndex === void 0) { initialIndex = 0; }
        var _this = this;
        this.startX = 0;
        this.startY = 0;
        this.initialIndexSetOnce = false;
        this.currentTranslate = 0;
        this.lastTranslate = 0;
        this.currentlyDragging = false;
        this.passedMoveThreshold = false;
        this.callbacks = {};
        this.index = 0;
        this.dots = [];
        this.amplitude = 0;
        this.velocity = 0;
        this.timestamp = 0;
        this.destroyed = false;
        if (!carousel) {
            return;
        }
        this.config = this.setupConfig(config);
        this.initialIndex = initialIndex;
        if (onIndexChange) {
            this.onIndexChange = onIndexChange;
        }
        if (onMove) {
            this.onMove = onMove;
        }
        this.carousel = carousel;
        if (this.config.includeStyle) {
            if (!AyCarousel.documentStyleAdded) {
                var carStyle = document.createElement('style');
                carStyle.appendChild(document.createTextNode(CAROUSEL_STYLES));
                var insertPoint = void 0;
                if (insertPoint = document.querySelector('link')) {
                    insertPoint.parentNode.insertBefore(carStyle, insertPoint);
                }
                else if (insertPoint = document.querySelector('style')) {
                    insertPoint.parentNode.insertBefore(carStyle, insertPoint);
                }
                else if (insertPoint = document.querySelector('head')) {
                    insertPoint.appendChild(carStyle);
                }
                else {
                    document.appendChild(carStyle);
                }
                AyCarousel.documentStyleAdded = true;
            }
            this.carousel.setAttribute('style', "position: relative; width: 100%; display: flex; align-items: stretch;");
        }
        this.callbacks.onDragStart = this.onDragStart.bind(this);
        this.callbacks.onDragMove = this.onDragMove.bind(this);
        this.callbacks.onDragEnd = this.onDragEnd.bind(this);
        this.callbacks.onDotClick = this.onDotClick.bind(this);
        this.callbacks.onDotKey = this.onDotKey.bind(this);
        this.callbacks.onWindowResize = this.handleResize.bind(this);
        this.callbacks.onResizeFollowUp = this.followUpResize.bind(this);
        this.callbacks.onTransitionEnd = function (evt) {
            if (evt.target === _this.carousel) {
                _this.rescale();
            }
        };
        this.callbacks.onClick = function (evt) {
            if (_this.totalMove && (_this.totalMove.x > _this.config.moveThreshold || _this.totalMove.y > _this.config.moveThreshold)) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        };
        this.carousel.addEventListener('touchstart', this.callbacks.onDragStart);
        this.carousel.addEventListener('mousedown', this.callbacks.onDragStart);
        this.carousel.addEventListener('transitionend', this.callbacks.onTransitionEnd);
        this.carousel.addEventListener('click', this.callbacks.onClick, true);
        window.addEventListener('resize', this.callbacks.onWindowResize);
        this.updateItems();
    }
    AyCarousel.prototype.updateItems = function () {
        var _this = this;
        this.cards = [];
        for (var i = 0, l = this.carousel.children.length; i < l; i++) {
            var child = this.carousel.children[i];
            if ((!this.config.cardFilterClass) || child.classList.contains(this.config.cardFilterClass)) {
                this.cards.push(child);
            }
        }
        if (this.cards.length > this.initialIndex && !this.initialIndexSetOnce) {
            this.setIndex(this.initialIndex);
            this.initialIndexSetOnce = true;
        }
        this.handleResize(false);
        this.rescale();
        this.translate(this.calcOS(this.index), 0, undefined, false);
        window.requestAnimationFrame(function (_) { return _this.rescale(); });
        if (this.dotContainer) {
            this.removeDots(false);
        }
        else {
            this.dotContainer = document.createElement('ul');
            this.dotContainer.classList.add('progress-dots');
            this.carouselParent.element.insertBefore(this.dotContainer, this.carousel.nextSibling);
        }
        if (this.config.enableDots && this.cards.length > 1) {
            for (var i = 0; i < this.cards.length; i++) {
                this.dots.push(document.createElement('li'));
                this.dotContainer.insertAdjacentElement('beforeend', this.dots[i]);
                this.dots[i].addEventListener('touchstart', this.callbacks.onDotClick);
                this.dots[i].addEventListener('click', this.callbacks.onDotClick);
                this.dots[i].addEventListener('keydown', this.callbacks.onDotKey);
                this.dots[i].tabIndex = 0;
            }
            this.dots[this.index].className = 'active';
        }
    };
    AyCarousel.prototype.handleResize = function (snap) {
        if (snap === void 0) { snap = true; }
        if (this.resizeTimeoutId) {
            clearTimeout(this.resizeTimeoutId);
        }
        this.followUpResize(snap);
        this.resizeTimeoutId = setTimeout(this.callbacks.onResizeFollowUp, 150, snap);
    };
    AyCarousel.prototype.followUpResize = function (snap) {
        if (snap === void 0) { snap = true; }
        this.resizeTimeoutId = 0;
        var carouselParent = this.carousel.parentElement;
        if (carouselParent) {
            var parentRect = carouselParent.getBoundingClientRect();
            this.carouselParent = {
                element: carouselParent,
                width: parentRect.width,
                left: parentRect.left,
                right: parentRect.right
            };
        }
        if (this.cards.length === 0) {
            return;
        }
        this.cardWidth = this.cards[0].offsetWidth;
        if (snap) {
            this.snap(this.index, undefined, true);
        }
    };
    AyCarousel.prototype.onDragStart = function (e) {
        if (this.cards.length < 2) {
            return;
        }
        else if (this.currentlyDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        this.currentlyDragging = true;
        this.passedMoveThreshold = false;
        this.startIndex = this.index;
        var touches = e.touches ? e.touches[0] : e;
        var pageX = touches.pageX, pageY = touches.pageY;
        this.lastTranslate = this.currentTranslate;
        this.startX = pageX;
        this.startY = pageY;
        this.totalMove = {
            x: 0,
            y: 0
        };
        this.lastPos = {
            x: 0,
            y: 0
        };
        this.velocity = this.amplitude = 0;
        this.frame = this.currentTranslate;
        this.timestamp = Date.now();
        this.velocityInterval = window.setInterval(this.calcVelocity.bind(this), 100);
        this.carousel.addEventListener('mousemove', this.callbacks.onDragMove);
        this.carousel.addEventListener('touchmove', this.callbacks.onDragMove);
        this.carousel.addEventListener('touchend', this.callbacks.onDragEnd);
        this.carousel.addEventListener('mouseup', this.callbacks.onDragEnd);
        this.carousel.addEventListener('mouseleave', this.callbacks.onDragEnd);
    };
    AyCarousel.prototype.calcVelocity = function () {
        var now = Date.now();
        var elapsed = now - this.timestamp;
        this.timestamp = now;
        var delta = this.currentTranslate - this.frame;
        this.frame = this.currentTranslate;
        var v = 1000 * delta / (1 + elapsed);
        return this.velocity = 0.8 * v + 0.2 * this.velocity;
    };
    AyCarousel.prototype.momentumScroll = function (stopPoint) {
        var _this = this;
        if (this.destroyed) {
            return;
        }
        if (this.amplitude) {
            var elapsed = Date.now() - this.timestamp;
            var delta = -this.amplitude * Math.exp(-elapsed / (this.config.decelerationRate));
            if (this.startIndex !== this.index && this.config.limitMomentumToOnePage) {
                var moveDiff = Math.max(-1, Math.min(1, this.index - this.startIndex));
                this.snap(this.startIndex + moveDiff);
            }
            else if (delta > stopPoint || delta < -stopPoint) {
                var outOfBoundsLeft = this.target + delta > (this.config.edgeBounceProportion * this.cardWidth);
                var outOfBoundsRight = this.target + delta < (this.calcOS(this.cards.length - 1) - (this.config.edgeBounceProportion * this.cardWidth));
                if (outOfBoundsLeft || outOfBoundsRight) {
                    return this.snap(this.index);
                }
                this.translate(this.target + delta, 0);
                window.requestAnimationFrame(function (_) { return _this.momentumScroll(stopPoint); });
            }
            else {
                this.snap(this.index);
            }
        }
    };
    AyCarousel.prototype.onDragMove = function (e) {
        var touches = e.touches ? e.touches[0] : e;
        var pageX = touches.pageX, pageY = touches.pageY;
        var move = {
            x: pageX - this.startX,
            y: pageY - this.startY
        };
        this.totalMove.x += Math.abs(move.x - this.lastPos.x);
        this.totalMove.y += Math.abs(move.y - this.lastPos.y);
        this.lastPos = {
            x: move.x,
            y: move.y
        };
        if (this.totalMove.x < this.config.moveThreshold && this.totalMove.y < this.config.moveThreshold) {
            return;
        }
        if (!this.passedMoveThreshold) {
            this.passedMoveThreshold = true;
            this.startX = pageX;
            this.startY = pageY;
            return;
        }
        if (this.totalMove.x > this.totalMove.y) {
            e.preventDefault();
            this.translate(this.lastTranslate + move.x, 0);
            this.velocity = this.calcVelocity();
        }
    };
    AyCarousel.prototype.calculateIndex = function () {
        var edgeToCardDist = (this.carouselParent.width - this.cardWidth) / 2;
        var index = Math.round((edgeToCardDist - this.currentTranslate) / this.cardWidth);
        return Math.max(0, Math.min(this.cards.length - 1, (index)));
    };
    AyCarousel.prototype.onDotClick = function (e) {
        var i = this.dots.indexOf(e.target);
        this.setIndex(i);
        this.snap(this.index);
    };
    AyCarousel.prototype.onDotKey = function (e) {
        if (e.keyCode === 32 || e.keyCode === 13) {
            var i = this.dots.indexOf(e.target);
            e.preventDefault();
            e.stopPropagation();
            this.setIndex(i);
            this.snap(this.index);
        }
    };
    AyCarousel.prototype.setIndex = function (index) {
        var oldIndex = this.index;
        this.index = Math.max(Math.min(index, this.cards.length - 1), 0);
        if (oldIndex !== this.index && this.dots && this.dots[oldIndex] && this.dots[this.index]) {
            this.dots[oldIndex].className = '';
            this.dots[this.index].className = 'active';
        }
        if (oldIndex !== this.index) {
            this.onIndexChange && this.onIndexChange({ index: this.index });
        }
    };
    AyCarousel.prototype.snap = function (nextIndex, direction, instant) {
        if (direction) {
            direction == 'right' ? nextIndex = this.index + 1 : nextIndex = this.index - 1;
        }
        else if (nextIndex !== undefined) {
            nextIndex = Math.min(Math.max(nextIndex, 0), this.cards.length - 1);
        }
        else {
            return;
        }
        this.index = nextIndex;
        var nextOffset = this.calcOS(this.index);
        var ease = 'ease';
        var distance = Math.abs(this.currentTranslate - nextOffset);
        var duration = instant ? 200 : Math.floor(distance * 1.25) + this.config.snapSpeedConstant;
        this.translate(nextOffset, duration, ease);
    };
    AyCarousel.prototype.onDragEnd = function () {
        var _this = this;
        this.currentlyDragging = false;
        this.carousel.removeEventListener('mousemove', this.callbacks.onDragMove);
        this.carousel.removeEventListener('touchmove', this.callbacks.onDragMove);
        this.carousel.removeEventListener('touchend', this.callbacks.onDragEnd);
        this.carousel.removeEventListener('mouseup', this.callbacks.onDragEnd);
        this.carousel.removeEventListener('mouseleave', this.callbacks.onDragEnd);
        window.clearInterval(this.velocityInterval);
        if (this.velocity > 0.5 || this.velocity < -0.5) {
            this.amplitude = (1 - this.config.heaviness) * this.velocity;
            this.target = Math.round(this.currentTranslate + this.amplitude);
            this.index = this.calculateIndex();
            window.requestAnimationFrame(function (_) { return _this.momentumScroll(_this.config.momentumSnapVelocityThreshold); });
        }
        else {
            this.snap(this.index);
        }
    };
    AyCarousel.prototype.translate = function (x, length, fn, updateIndex) {
        var _this = this;
        if (updateIndex === void 0) { updateIndex = true; }
        var oldTranslate = this.currentTranslate;
        this.currentTranslate = x;
        if (!('transform' in this.carousel.style)) {
            this.carousel.style['transition'] = '-webkit-transform';
            this.carousel.style['webkitTransform'] = "translate3d(" + x + "px,0px,0px)";
        }
        else {
            this.carousel.style['transition'] = 'transform';
            this.carousel.style['transform'] = "translate3d(" + x + "px,0px,0px)";
        }
        this.carousel.style['transitionDuration'] = length + "ms";
        if (fn) {
            this.carousel.style['transitionTimingFunction'] = fn;
        }
        if (length === 0 && updateIndex) {
            this.setIndex(this.calculateIndex());
        }
        window.requestAnimationFrame(function (_) { return _this.rescale(); });
        if (oldTranslate !== this.currentTranslate) {
            this.onMove && this.onMove({ proportion: -this.currentTranslate / ((this.cards.length - 1) * this.cardWidth), duration: length });
        }
    };
    AyCarousel.prototype.proportionVisible = function (index) {
        var prop = 1 - Math.abs((this.calcOS(index) - this.currentTranslate) / this.cardWidth);
        return Math.max(0, prop);
    };
    AyCarousel.prototype.rescale = function () {
        if (this.destroyed || this.config.minCardScale >= 1) {
            return;
        }
        var from = Math.max(this.index - 2, 0);
        var to = Math.min(this.index + 2, this.cards.length - 1);
        for (var i = from; i <= to; i++) {
            var scaler = Math.min(Math.max(this.proportionVisible(i) + 0.25, this.config.minCardScale), 1);
            this.cards[i].style['transform'] = "scale(" + scaler + ")";
            this.cards[i].style['transitionTimingFunction'] = 'ease';
            this.cards[i].style['transitionDuration'] = this.config.shrinkSpeed + "ms";
        }
    };
    AyCarousel.prototype.calcOS = function (i) {
        var edgeToCardDist = (this.carouselParent.width - this.cardWidth) / 2;
        var centeredPosition = (this.cardWidth * i - edgeToCardDist) * -1;
        if (!this.config.edgeShifting) {
            return centeredPosition;
        }
        if (this.cards.length <= 1) {
            return centeredPosition;
        }
        else if (i === 0) {
            return 0;
        }
        else if (i === this.cards.length - 1) {
            return (this.carouselParent.width - this.cardWidth) - (this.cardWidth * (this.cards.length - 1));
        }
        else {
            return centeredPosition;
        }
    };
    AyCarousel.prototype.cleanUp = function () {
        this.removeDots(true);
        this.carousel.removeEventListener('touchstart', this.callbacks.onDragStart);
        this.carousel.removeEventListener('mousedown', this.callbacks.onDragStart);
        this.carousel.removeEventListener('transitionend', this.callbacks.onTransitionEnd);
        this.carousel.removeEventListener('click', this.callbacks.onClick);
        window.removeEventListener('resize', this.callbacks.onWindowResize);
        if (this.resizeTimeoutId) {
            clearTimeout(this.resizeTimeoutId);
        }
        this.destroyed = true;
    };
    AyCarousel.prototype.removeDots = function (includingContainer) {
        if (includingContainer === void 0) { includingContainer = false; }
        while (this.dots.length > 0) {
            var dot = this.dots.pop();
            if (dot === undefined) {
                continue;
            }
            dot.removeEventListener('touchstart', this.callbacks.onDotClick);
            dot.removeEventListener('click', this.callbacks.onDotClick);
            dot.removeEventListener('keydown', this.callbacks.onDotKey);
            this.dotContainer.removeChild(dot);
        }
        if (includingContainer && this.dotContainer && this.dotContainer.parentElement) {
            this.dotContainer.parentElement.removeChild(this.dotContainer);
        }
    };
    AyCarousel.prototype.setupConfig = function (config) {
        var defaultConfig = {
            decelerationRate: 700,
            momentumSnapVelocityThreshold: 105,
            minCardScale: 0.9,
            snapSpeedConstant: 300,
            heaviness: 0.675,
            shrinkSpeed: 150,
            moveThreshold: 10,
            edgeBounceProportion: 0.25,
            cardFilterClass: '',
            edgeShifting: true,
            enableDots: true,
            includeStyle: false,
            limitMomentumToOnePage: false
        };
        return assign({}, defaultConfig, config);
    };
    AyCarousel.documentStyleAdded = false;
    return AyCarousel;
}());

var modName = 'ayCarousel';
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
            var el = $element[0];
            var carousel = new AyCarousel(el, $scope.config, $scope.initialIndex, $scope.onIndexChange, $scope.onMove);
            var mutationObserver = new MutationObserver(function () {
                carousel.updateItems();
            });
            mutationObserver.observe(el, { childList: true });
            $scope.$watch('index', function (newVal) {
                var index = parseInt(newVal, 10);
                carousel.setIndex(index);
                carousel.snap(index);
            });
            $scope.$on('$destroy', function () {
                mutationObserver.disconnect();
                carousel.cleanUp();
            });
        }
    };
});

return modName;

})));
//# sourceMappingURL=angular1.js.map
