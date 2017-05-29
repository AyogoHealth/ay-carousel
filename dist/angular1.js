/*! Copyright 2017 Ayogo Health Inc. */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('angular')) :
	typeof define === 'function' && define.amd ? define(['angular'], factory) :
	(global.ayCarousel = factory(global.angular));
}(this, (function (angular) { 'use strict';

var AyCarousel = (function () {
    function AyCarousel(carousel) {
        var _this = this;
        this.startX = 0;
        this.startY = 0;
        this.callbacks = {};
        this.index = 0;
        this.dots = [];
        this.rescaling = false;
        this.translating = false;
        this.timestamp = 0;
        this.previousTranslate = 0;
        var CAROUSEL_STYLES = "\n    .progress-dots  {\n      text-align: center;\n      list-style: none;\n    }\n\n    .progress-dots > li {\n      border-radius: 50%;\n      background: white;\n      display: inline-block;\n      margin: 0 3px;\n      width: 10px;\n      height: 10px;\n      border: 1px solid black;\n    }\n\n    .progress-dots > li.active {\n      background: #45a2e2;\n    }\n\n    .card {\n      border-radius: 5px;\n      box-shadow: inset 0 0 1px black;\n      margin: 10px 0px;\n      float: left;\n      height: auto;\n      width: 80vw;\n      display: block;\n      background: white; \n      line-height: 150px;\n      font-size: 32px;\n      font-family: sans-serif;\n      text-align: center;\n    }\n    ";
        var carStyle = document.createElement('style');
        carStyle.appendChild(document.createTextNode(CAROUSEL_STYLES));
        var insertPoint;
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
        if (carousel) {
            this.carousel = carousel;
            this.carousel.setAttribute('style', "position: relative; width: 30000px; display: inline-block;");
            this.carousel.addEventListener('touchstart', function (e) { return _this.ondragstart(e); });
            this.carousel.addEventListener('mousedown', function (e) { return _this.ondragstart(e); });
            this.cards = this.carousel.children;
            this.rescale();
            this.cardWidth = this.cards[0].offsetWidth;
            this.carousel.addEventListener('transitionend', function () {
                _this.translating = false;
                window.requestAnimationFrame(function (_) { return _this.rescale(); });
            });
            window.requestAnimationFrame(function (_) { return _this.rescale(); });
            var dotContainer = document.createElement('ul');
            dotContainer.classList.add('progress-dots');
            if (this.carousel.parentElement) {
                this.carousel.parentElement.insertBefore(dotContainer, this.carousel.nextSibling);
            }
            var _loop_1 = function (i) {
                this_1.dots.push(document.createElement('li'));
                dotContainer.insertAdjacentElement('beforeend', this_1.dots[i]);
                this_1.dots[i].addEventListener('touchstart', function (_) { return _this.ondotclick(i); });
                this_1.dots[i].addEventListener('click', function (_) { return _this.ondotclick(i); });
                this_1.dots[i].tabIndex = i + 1;
            };
            var this_1 = this;
            for (var i = 0; i < this.cards.length; i++) {
                _loop_1(i);
            }
            this.dots[this.index].className = 'active';
        }
    }
    AyCarousel.prototype.ondragstart = function (e) {
        var _this = this;
        var touches = e.touches ? e.touches[0] : e;
        var pageX = touches.pageX, pageY = touches.pageY;
        var boundingRect = this.cards[this.index].getBoundingClientRect();
        this.offset = {
            x: pageX - boundingRect.left,
            y: pageY - boundingRect.top
        };
        this.delta = {};
        this.position = {
            x: this.carousel.offsetLeft,
            y: this.carousel.offsetTop
        };
        var edgeToCardDist = this.cards[this.index].getBoundingClientRect().left;
        this.lastTranslate = this.carousel.getBoundingClientRect().left - edgeToCardDist;
        this.startX = pageX;
        this.startY = pageY;
        this.callbacks.onmove = function (e) { return _this.ondragmove(e); };
        this.callbacks.onend = function (e) { return _this.ondragend(e); };
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
        this.velocityInterval = window.setInterval(this.calcVelocity, 100);
        this.carousel.addEventListener('mousemove', this.callbacks.onmove);
        this.carousel.addEventListener('touchmove', this.callbacks.onmove);
        this.carousel.addEventListener('touchend', this.callbacks.onend);
        this.carousel.addEventListener('mouseup', this.callbacks.onend);
        this.carousel.addEventListener('mouseleave', this.callbacks.onend);
    };
    AyCarousel.prototype.calcVelocity = function () {
        var now = Date.now();
        var elapsed = now - this.timestamp;
        this.timestamp = now;
        var delta = this.currentTranslate - this.frame;
        this.frame = this.currentTranslate;
        var v = 1000 * delta / (1 + elapsed);
        return this.velocity = 0.1 * v;
    };
    AyCarousel.prototype.momentumScroll = function (stopPoint) {
        var _this = this;
        var timeConstant = 325;
        if (this.amplitude) {
            this.setIndex(this.calculateIndex());
            var elapsed = Date.now() - this.timestamp;
            var delta = -this.amplitude * Math.exp(-elapsed / timeConstant);
            if (delta > stopPoint || delta < -stopPoint) {
                this.translate(this.target + delta, 0);
                window.requestAnimationFrame(function (_) { return _this.momentumScroll(stopPoint); });
            }
            else {
                this.translate(this.target, 0);
                this.snap(this.index, undefined);
            }
        }
    };
    AyCarousel.prototype.ondragmove = function (e) {
        var touches = e.touches ? e.touches[0] : e;
        var pageX = touches.pageX, pageY = touches.pageY;
        var move = {
            x: this.startX - pageX,
            y: this.startY - pageY
        };
        this.totalMove.x += Math.abs(move.x - this.lastPos.x);
        this.totalMove.y += Math.abs(move.y - this.lastPos.y);
        this.lastPos = {
            x: move.x,
            y: move.y
        };
        if (this.totalMove.x < 10 && this.totalMove.y < 10) {
            return;
        }
        if (this.totalMove.x > this.totalMove.y) {
            e.preventDefault();
            this.delta = {
                x: pageX - this.position.x,
                y: pageY - this.position.y
            };
            this.previousTranslate = this.currentTranslate;
            this.currentTranslate = this.delta.x + this.lastTranslate - this.offset.x;
            this.velocity = this.calcVelocity();
            this.translate(this.currentTranslate, 0);
            this.setIndex(this.calculateIndex());
        }
    };
    AyCarousel.prototype.calculateIndex = function (position) {
        var cardLeft = position;
        if (!cardLeft) {
            cardLeft = this.cards[this.index].getBoundingClientRect().left;
        }
        var cardMidpoint = (cardLeft + cardLeft + this.cardWidth) / 2;
        var viewportWidth = window.innerWidth;
        if (cardMidpoint <= 0) {
            return this.index + 1;
        }
        else if (cardMidpoint > viewportWidth) {
            return this.index - 1;
        }
        else {
            return this.index;
        }
    };
    AyCarousel.prototype.ondotclick = function (i) {
        this.setIndex(i);
        this.snap(this.index);
    };
    AyCarousel.prototype.setIndex = function (index) {
        var oldIndex = this.index;
        this.index = Math.max(Math.min(index, this.cards.length - 1), 0);
        if (oldIndex !== this.index) {
            this.dots[oldIndex].className = '';
            this.dots[this.index].className = 'active';
        }
    };
    AyCarousel.prototype.snap = function (nextIndex, direction) {
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
        var duration = Math.floor(distance / 0.5) + 100;
        this.translate(nextOffset, duration, ease);
    };
    AyCarousel.prototype.ondragend = function (e) {
        var _this = this;
        this.position = {
            x: e.target.offsetLeft,
            y: e.target.offsetTop
        };
        this.totalMove = {
            x: 0,
            y: 0
        };
        this.carousel.removeEventListener('mousemove', this.callbacks.onmove);
        this.carousel.removeEventListener('touchmove', this.callbacks.onmove);
        this.carousel.removeEventListener('touchend', this.callbacks.onend);
        this.carousel.removeEventListener('mouseup', this.callbacks.onend);
        this.carousel.removeEventListener('mouseleave', this.callbacks.onend);
        window.clearInterval(this.velocityInterval);
        if (this.velocity > 0.5 || this.velocity < -0.5) {
            this.amplitude = 0.7 * this.velocity;
            this.target = Math.round(this.currentTranslate + this.amplitude);
            var stopPoint_1 = 50;
            this.closestCard = Math.round(this.target / this.cardWidth) * this.cardWidth + (this.cardWidth + this.calcOS(1));
            if (this.velocity < 0) {
                if (this.closestCard > this.target) {
                    this.target = this.closestCard;
                }
            }
            else {
                if (this.closestCard < this.target) {
                    this.target = this.closestCard;
                }
            }
            this.setIndex(this.calculateIndex());
            window.requestAnimationFrame(function (_) { return _this.momentumScroll(stopPoint_1); });
        }
        else {
            this.snap(this.index, undefined);
        }
    };
    AyCarousel.prototype.translate = function (x, length, fn) {
        var _this = this;
        this.carousel.style['transition'] = 'transform';
        this.carousel.style['transitionDuration'] = length + "ms";
        this.carousel.style['transform'] = "translate3d(" + x + "px,0px,0px)";
        if (fn) {
            this.carousel.style['transitionTimingFunction'] = fn;
        }
        if (length > 0) {
            this.translating = true;
        }
        window.requestAnimationFrame(function (_) { return _this.rescale(); });
    };
    AyCarousel.prototype.percentVisible = function (card) {
        var cardRect = card.getBoundingClientRect();
        var cardWidth = card.offsetWidth;
        var frameWidth = window.innerWidth;
        if ((cardRect.left < 0 && cardRect.right < 0) || cardRect.left > frameWidth) {
            return 0;
        }
        else if (cardRect.left < 0) {
            return cardRect.right / cardWidth;
        }
        else if (cardRect.right > frameWidth) {
            return (frameWidth - cardRect.left) / cardWidth;
        }
        else {
            return 1;
        }
    };
    AyCarousel.prototype.rescale = function () {
        var _this = this;
        var from = Math.max(this.index - 2, 0);
        var to = Math.min(this.index + 2, this.cards.length - 1);
        for (var i = from; i <= to; i++) {
            var scaler = Math.max(this.percentVisible(this.cards[i]), 0.9);
            this.cards[i].style['transform'] = "scale(" + scaler + ")";
            this.cards[i].style['transitionTimingFunction'] = 'ease';
            this.cards[i].style['transitionDuration'] = "150ms";
        }
        if (this.translating) {
            window.requestAnimationFrame(function (_) { return _this.rescale(); });
        }
    };
    AyCarousel.prototype.calcOS = function (i) {
        var container = (this.carousel.parentElement);
        var containerWidth = container.offsetWidth;
        var containerMargin = parseInt(window.getComputedStyle(container).marginLeft, 0);
        var edgeToCardDist = (containerWidth - this.cardWidth) / 2;
        return Math.min((this.cardWidth * i - edgeToCardDist + containerMargin) * -1, 0);
    };
    return AyCarousel;
}());

var modName = 'ayCarousel';
angular.module(modName, [])
    .directive('carousel', function () {
    return {
        restrict: 'E',
        link: function (_$scope, $element) {
            var el = $element[0];
            new AyCarousel(el);
        }
    };
});

return modName;

})));
//# sourceMappingURL=angular1.js.map
