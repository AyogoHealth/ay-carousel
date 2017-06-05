/*! Copyright 2017 Ayogo Health Inc. */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Carousel = factory());
}(this, (function () { 'use strict';

var assign = function (target) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    args;
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

var AyCarousel = (function () {
    function AyCarousel(carousel, config) {
        var _this = this;
        this.startX = 0;
        this.startY = 0;
        this.callbacks = {};
        this.index = 0;
        this.dots = [];
        this.timestamp = 0;
        this.previousTranslate = 0;
        var CAROUSEL_STYLES = "\n    .progress-dots  {\n      text-align: center;\n    }\n\n    .progress-dots > li.active {\n      background: #24282a;\n    }\n\n    .progress-dots > li {\n      border-radius: 50%;\n      display: inline-block;\n      margin: 0 5px;\n      width: 7px;\n      height: 8px;\n      border: 1px solid #24282a;\n    }\n\n    .carousel-item {\n      width: 75vw;\n    }\n    ";
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
            this.config = this.setupConfig(config);
            this.carousel = carousel;
            this.carousel.setAttribute('style', "position: relative; width: 30000px; display: flex; align-items: stretch;");
            this.cards = this.carousel.children;
            this.handleResize();
            if (this.cards.length > 1) {
                this.carousel.addEventListener('touchstart', function (e) { return _this.ondragstart(e); });
                this.carousel.addEventListener('mousedown', function (e) { return _this.ondragstart(e); });
            }
            this.rescale();
            this.cardWidth = this.cards[0].offsetWidth;
            this.currentTranslate = 0;
            this.carousel.addEventListener('transitionend', function () {
                window.requestAnimationFrame(function (_) { return _this.rescale(); });
            });
            window.requestAnimationFrame(function (_) { return _this.rescale(); });
            window.addEventListener('resize', function (_) { return _this.handleResize(); });
            if (this.config.enableDots && this.cards.length > 1) {
                var dotContainer = document.createElement('ul');
                dotContainer.classList.add('progress-dots');
                this.carouselParent.element.insertBefore(dotContainer, this.carousel.nextSibling);
                var _loop_1 = function (i) {
                    this_1.dots.push(document.createElement('li'));
                    dotContainer.insertAdjacentElement('beforeend', this_1.dots[i]);
                    this_1.dots[i].addEventListener('touchstart', function (_) { return _this.ondotclick(i); });
                    this_1.dots[i].addEventListener('click', function (_) { return _this.ondotclick(i); });
                    this_1.dots[i].addEventListener('keydown', function (e) { return _this.ondotkey(e, i); });
                    this_1.dots[i].tabIndex = 0;
                };
                var this_1 = this;
                for (var i = 0; i < this.cards.length; i++) {
                    _loop_1(i);
                }
                this.dots[this.index].className = 'active';
            }
        }
    }
    AyCarousel.prototype.handleResize = function () {
        this.viewportWidth = window.innerWidth;
        this.cardWidth = this.cards[0].offsetWidth;
        var carouselParent = this.carousel.parentElement;
        if (carouselParent) {
            this.carouselParent = {
                element: carouselParent,
                width: carouselParent.offsetWidth,
                marginLeft: parseInt(window.getComputedStyle(carouselParent).marginLeft, 0)
            };
        }
        this.snap(this.index);
    };
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
        return this.velocity = 0.8 * v + 0.2 * this.velocity;
    };
    AyCarousel.prototype.momentumScroll = function (stopPoint) {
        var _this = this;
        if (this.amplitude) {
            var elapsed = Date.now() - this.timestamp;
            var delta = -this.amplitude * Math.exp(-elapsed / (this.config.decelerationRate));
            if (delta > stopPoint || delta < -stopPoint) {
                var outOfBoundsLeft = this.target + delta > 0;
                var outOfBoundsRight = this.target + delta < -this.cardWidth * this.cards.length + (this.cardWidth);
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
        }
    };
    AyCarousel.prototype.calculateIndex = function (position) {
        var cardLeft = position;
        if (!cardLeft) {
            cardLeft = this.cards[this.index].getBoundingClientRect().left;
        }
        var cardMidpoint = (cardLeft + cardLeft + this.cardWidth) / 2;
        if (cardMidpoint <= 0) {
            return this.index + 1;
        }
        else if (cardMidpoint > this.viewportWidth) {
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
    AyCarousel.prototype.ondotkey = function (e, i) {
        if (e.keyCode === 32 || e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            this.ondotclick(i);
        }
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
        var duration = Math.floor(distance * 1.25) + this.config.snapSpeedConstant;
        this.currentTranslate = nextOffset;
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
            this.amplitude = (1 - this.config.heaviness) * this.velocity;
            this.target = Math.round(this.currentTranslate + this.amplitude);
            this.closestCard = Math.round(this.target / this.cardWidth) * this.cardWidth + (this.cardWidth + this.calcOS(1));
            window.requestAnimationFrame(function (_) { return _this.momentumScroll(_this.config.momentumSnapVelocityThreshold); });
        }
        else {
            this.snap(this.index);
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
        if (length == 0) {
            this.setIndex(this.calculateIndex());
        }
        window.requestAnimationFrame(function (_) { return _this.rescale(); });
    };
    AyCarousel.prototype.percentVisible = function (card) {
        var cardRect = card.getBoundingClientRect();
        if ((cardRect.left < 0 && cardRect.right < 0) || cardRect.left > this.viewportWidth) {
            return 0;
        }
        else if (cardRect.left < 0) {
            return cardRect.right / this.cardWidth;
        }
        else if (cardRect.right > this.viewportWidth) {
            return (this.viewportWidth - cardRect.left) / this.cardWidth;
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
            var scaler = Math.min(Math.max(this.percentVisible(this.cards[i]) + 0.25, this.config.minCardScale), 1);
            this.cards[i].style['transform'] = "scale(" + scaler + ")";
            this.cards[i].style['transitionTimingFunction'] = 'ease';
            this.cards[i].style['transitionDuration'] = this.config.shrinkSpeed + "ms";
        }
        if (this.velocity != 0) {
            window.requestAnimationFrame(function (_) { return _this.rescale(); });
        }
    };
    AyCarousel.prototype.calcOS = function (i) {
        var edgeToCardDist = (this.carouselParent.width - this.cardWidth) / 2;
        return Math.min((this.cardWidth * i - edgeToCardDist + this.carouselParent.marginLeft) * -1, 0);
    };
    AyCarousel.prototype.setupConfig = function (config) {
        var defaultConfig = {
            decelerationRate: 900,
            momentumSnapVelocityThreshold: 150,
            minCardScale: 0.9,
            snapSpeedConstant: 300,
            heaviness: 0.95,
            shrinkSpeed: 150,
            enableDots: true
        };
        return assign({}, defaultConfig, config);
    };
    return AyCarousel;
}());

return AyCarousel;

})));
//# sourceMappingURL=index.js.map
