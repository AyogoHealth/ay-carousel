var AyCarousel = (function () {
    function AyCarousel(carousel) {
        var _this = this;
        this.startX = 0;
        this.callbacks = {};
        this.index = 0;
        this.SNAPPINESS = 40;
        this.carousel = carousel;
        this.carousel.addEventListener('click', function (e) { return _this.onclick(e); });
        this.carousel.addEventListener('touchstart', function (e) { return _this.ondragstart(e); });
        this.carousel.addEventListener('mousedown', function (e) { return _this.ondragstart(e); });
        this.cards = this.carousel.children;
        this.cardWidth = this.cards[0].offsetWidth + this.cards[0].offsetLeft;
        this.carousel.addEventListener('transitionend', function () {
            _this.rescale();
        });
        this.rescale();
        document.getElementById('right').addEventListener('click', this.move.bind(this, undefined, 'right'));
        document.getElementById('left').addEventListener('click', this.move.bind(this, undefined, 'left'));
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
        this.startX = e.pageX;
        this.dragging = undefined;
        this.callbacks.onmove = function (e) { return _this.ondragmove(e); };
        this.callbacks.onend = function (e) { return _this.ondragend(e); };
        this.carousel.addEventListener('mousemove', this.callbacks.onmove);
        this.carousel.addEventListener('touchmove', this.callbacks.onmove);
        this.carousel.addEventListener('touchend', this.callbacks.onend);
        this.carousel.addEventListener('mouseup', this.callbacks.onend);
        this.carousel.addEventListener('mouseleave', this.callbacks.onend);
    };
    AyCarousel.prototype.ondragmove = function (e) {
        var touches = e.touches ? e.touches[0] : e;
        var pageX = touches.pageX, pageY = touches.pageY;
        this.delta = {
            x: pageX - this.position.x,
            y: pageY - this.position.y
        };
        if (typeof this.dragging === 'undefined') {
            this.dragging = !(this.dragging || Math.abs(this.delta.x - this.offset.x) < Math.abs(this.delta.y - this.offset.y));
        }
        else if (!this.dragging) {
            this.dragging = Math.abs(this.delta.x) > Math.abs(this.delta.y);
        }
        if (this.dragging && this.offset) {
            e.preventDefault();
            var currentTranslate = this.delta.x + this.lastTranslate - this.offset.x;
            this.translate(currentTranslate, 0, null);
            var cardMidpoint = (this.cards[this.index].getBoundingClientRect().left + this.cards[this.index].getBoundingClientRect().right) / 2;
            var viewportWidth = window.innerWidth;
            if (cardMidpoint <= 0 + this.SNAPPINESS) {
                this.index = Math.min(this.index + 1, this.cards.length - 1);
            }
            else if (cardMidpoint > viewportWidth - this.SNAPPINESS) {
                this.index = Math.max(this.index - 1, 0);
            }
        }
    };
    AyCarousel.prototype.move = function (nextIndex, direction) {
        if (direction) {
            direction == 'right' ? nextIndex = this.index + 1 : nextIndex = this.index - 1;
        }
        nextIndex = Math.min(Math.max(nextIndex, 0), this.cards.length - 1);
        this.index = nextIndex;
        var container = this.carousel.parentElement;
        var containerWidth = container.offsetWidth;
        var containerMargin = parseInt(window.getComputedStyle(container).marginLeft, 0);
        var card = this.cards[nextIndex];
        var edgeToCardDist = (containerWidth - card.offsetWidth) / 2;
        var nextOffset = Math.min((card.offsetLeft - edgeToCardDist + containerMargin) * -1, 0);
        var ease = 'cubic-bezier(0.785, 0.135, 0.15, 0.86)';
        this.translate(nextOffset, 250, ease);
    };
    AyCarousel.prototype.ondragend = function (e) {
        this.position = {
            x: e.target.offsetLeft,
            y: e.target.offsetTop
        };
        this.carousel.removeEventListener('mousemove', this.callbacks.onmove);
        this.carousel.removeEventListener('touchmove', this.callbacks.onmove);
        this.carousel.removeEventListener('touchend', this.callbacks.onend);
        this.carousel.removeEventListener('mouseup', this.callbacks.onend);
        this.carousel.removeEventListener('mouseleave', this.callbacks.onend);
        this.dragging = undefined;
        this.move(this.index, undefined);
        this.rescale();
    };
    AyCarousel.prototype.onclick = function (e) {
        if (this.delta.x) {
            e.preventDefault();
        }
    };
    AyCarousel.prototype.translate = function (x, length, fn) {
        this.carousel.style['transition'] = 'transform';
        this.carousel.style['transitionTimingFunction'] = fn;
        this.carousel.style['transitionDuration'] = length + "ms";
        this.carousel.style['transform'] = "translate3d(" + x + "px,0px,0px)";
        this.rescale();
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
        var from = Math.max(this.index - 2, 0);
        var to = Math.min(this.index + 2, this.cards.length - 1);
        for (var i = from; i <= to; i++) {
            var scaler = Math.max(this.percentVisible(this.cards[i]), 0.9);
            this.cards[i].style['transform'] = "scale(" + scaler + ")";
            this.cards[i].style['transitionTimingFunction'] = 'ease';
            this.cards[i].style['transitionDuration'] = "250ms";
        }
    };
    return AyCarousel;
}());
new AyCarousel(document.querySelector('.carousel'));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7SUFlRSxvQkFBWSxRQUFzQjtRQUFsQyxpQkFrQkM7UUE5QkQsV0FBTSxHQUFZLENBQUMsQ0FBQztRQUtwQixjQUFTLEdBQVMsRUFBRSxDQUFDO1FBR3JCLFVBQUssR0FBWSxDQUFDLENBQUM7UUFFVixlQUFVLEdBQVksRUFBRSxDQUFDO1FBR2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBRXpCLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBZixDQUFlLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQW5CLENBQW1CLENBQUMsQ0FBQztRQUN2RSxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxVQUFBLENBQUMsSUFBSSxPQUFBLEtBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQW5CLENBQW1CLENBQUMsQ0FBQztRQUV0RSxJQUFJLENBQUMsS0FBSyxHQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBRXpDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFFdEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUU7WUFDOUMsS0FBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxD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QUFDLEtBQUssR0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUE7UUFFdEQsR0FBRyxDQUFBLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsSUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFdBQVMsTUFBTSxNQUFHLENBQUM7WUFDdEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsR0FBRyxNQUFNLENBQUM7WUFDekQsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDdEQsQ0FBQztJQUNILENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUFoTUQsSUFnTUM7QUFDRCxJQUFJLFVBQVUsQ0FBYyxRQUFRLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBBeUNhcm91c2VsIHtcbiAgZHJhZ2dpbmcgOiBib29sZWFuO1xuICBvZmZzZXQgOiBhbnk7XG4gIHN0YXJ0WCA6IG51bWJlciA9IDA7XG4gIGRlbHRhIDogYW55O1xuICBwb3NpdGlvbiA6IGFueTtcbiAgY3VycmVudFRyYW5zbGF0ZSA6IG51bWJlcjtcbiAgbGFzdFRyYW5zbGF0ZSA6IG51bWJlcjtcbiAgY2FsbGJhY2tzIDogYW55ID0ge307XG4gIGNhcmRzIDogSFRNTEVsZW1lbnRbXTtcbiAgY2FyZFdpZHRoIDogbnVtYmVyO1xuICBpbmRleCA6IG51bWJlciA9IDA7XG4gIGNhcm91c2VsIDogSFRNTEVsZW1lbnQ7XG4gIHJlYWRvbmx5IFNOQVBQSU5FU1MgOiBudW1iZXIgPSA0MDtcblxuICBjb25zdHJ1Y3RvcihjYXJvdXNlbCA6IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5jYXJvdXNlbCA9IGNhcm91c2VsO1xuICAgIFxuICAgIHRoaXMuY2Fyb3VzZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHRoaXMub25jbGljayhlKSk7XG4gICAgdGhpcy5jYXJvdXNlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZSA9PiB0aGlzLm9uZHJhZ3N0YXJ0KGUpKTtcbiAgICB0aGlzLmNhcm91c2VsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGUgPT4gdGhpcy5vbmRyYWdzdGFydChlKSk7XG5cbiAgICB0aGlzLmNhcmRzID0gPGFueT50aGlzLmNhcm91c2VsLmNoaWxkcmVuO1xuXG4gICAgdGhpcy5jYXJkV2lkdGggPSB0aGlzLmNhcmRzWzBdLm9mZnNldFdpZHRoICsgdGhpcy5jYXJkc1swXS5vZmZzZXRMZWZ0O1xuXG4gICAgdGhpcy5jYXJvdXNlbC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgKCkgPT4ge1xuICAgICAgdGhpcy5yZXNjYWxlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5yZXNjYWxlKCk7XG4gICAgXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JpZ2h0JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm1vdmUuYmluZCh0aGlzLCB1bmRlZmluZWQsICdyaWdodCcpKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGVmdCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5tb3ZlLmJpbmQodGhpcywgdW5kZWZpbmVkLCAnbGVmdCcpKTsgICBcbiAgfVxuXG4gIG9uZHJhZ3N0YXJ0KGUpIHtcbiAgICBjb25zdCB0b3VjaGVzID0gIGUudG91Y2hlcyA/IGUudG91Y2hlc1swXSA6IGU7XG4gICAgY29uc3Qge3BhZ2VYLCBwYWdlWX0gPSB0b3VjaGVzO1xuXG4gICAgY29uc3QgYm91bmRpbmdSZWN0ID0gdGhpcy5jYXJkc1t0aGlzLmluZGV4XS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgIHg6IHBhZ2VYIC0gYm91bmRpbmdSZWN0LmxlZnQsXG4gICAgICB5OiBwYWdlWSAtIGJvdW5kaW5nUmVjdC50b3BcbiAgICB9O1xuXG4gICAgdGhpcy5kZWx0YSA9IHt9O1xuXG4gICAgdGhpcy5wb3NpdGlvbiA9IHtcbiAgICAgIHg6IHRoaXMuY2Fyb3VzZWwub2Zmc2V0TGVmdCxcbiAgICAgIHk6IHRoaXMuY2Fyb3VzZWwub2Zmc2V0VG9wXG4gICAgfTtcblxuICAgIGxldCBlZGdlVG9DYXJkRGlzdCA9IHRoaXMuY2FyZHNbdGhpcy5pbmRleF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcbiAgICB0aGlzLmxhc3RUcmFuc2xhdGUgPSB0aGlzLmNhcm91c2VsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlZGdlVG9DYXJkRGlzdDtcblxuICAgIHRoaXMuc3RhcnRYID0gZS5wYWdlWDtcbiAgICB0aGlzLmRyYWdnaW5nID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5jYWxsYmFja3Mub25tb3ZlID0gZSA9PiB0aGlzLm9uZHJhZ21vdmUoZSk7XG4gICAgdGhpcy5jYWxsYmFja3Mub25lbmQgPSBlID0+IHRoaXMub25kcmFnZW5kKGUpO1xuICAgIFxuICAgIHRoaXMuY2Fyb3VzZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5jYWxsYmFja3Mub25tb3ZlKTtcbiAgICB0aGlzLmNhcm91c2VsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuY2FsbGJhY2tzLm9ubW92ZSk7XG4gICAgXG4gICAgdGhpcy5jYXJvdXNlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuY2FsbGJhY2tzLm9uZW5kKTtcbiAgICB0aGlzLmNhcm91c2VsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmNhbGxiYWNrcy5vbmVuZCk7XG4gICAgdGhpcy5jYXJvdXNlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5jYWxsYmFja3Mub25lbmQpO1xuICB9XG5cbiAgb25kcmFnbW92ZShlKSB7XG4gICAgY29uc3QgdG91Y2hlcyA9ICBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbMF0gOiBlO1xuICAgIGNvbnN0IHtwYWdlWCwgcGFnZVl9ID0gdG91Y2hlcztcblxuICAgIHRoaXMuZGVsdGEgPSB7XG4gICAgICB4OiBwYWdlWCAtIHRoaXMucG9zaXRpb24ueCxcbiAgICAgIHk6IHBhZ2VZIC0gdGhpcy5wb3NpdGlvbi55XG4gICAgfTtcblxuICAgIGlmKHR5cGVvZiB0aGlzLmRyYWdnaW5nID09PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5kcmFnZ2luZyA9ICEodGhpcy5kcmFnZ2luZyB8fCBNYXRoLmFicyh0aGlzLmRlbHRhLnggLSB0aGlzLm9mZnNldC54KSA8IE1hdGguYWJzKHRoaXMuZGVsdGEueSAtIHRoaXMub2Zmc2V0LnkpKTtcbiAgICB9IGVsc2UgaWYoIXRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgIHRoaXMuZHJhZ2dpbmcgPSBNYXRoLmFicyh0aGlzLmRlbHRhLngpID4gTWF0aC5hYnModGhpcy5kZWx0YS55KTtcbiAgICB9XG5cbiAgICBpZih0aGlzLmRyYWdnaW5nICYmIHRoaXMub2Zmc2V0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGN1cnJlbnRUcmFuc2xhdGUgPSB0aGlzLmRlbHRhLnggKyB0aGlzLmxhc3RUcmFuc2xhdGUgLSB0aGlzLm9mZnNldC54O1xuXG4gICAgICB0aGlzLnRyYW5zbGF0ZShjdXJyZW50VHJhbnNsYXRlLCAwLCBudWxsKTtcblxuICAgICAgbGV0IGNhcmRNaWRwb2ludCA9ICh0aGlzLmNhcmRzW3RoaXMuaW5kZXhdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgKyB0aGlzLmNhcmRzW3RoaXMuaW5kZXhdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0KSAvIDI7XG4gICAgICBsZXQgdmlld3BvcnRXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXG4gICAgICBpZihjYXJkTWlkcG9pbnQgPD0gMCArIHRoaXMuU05BUFBJTkVTUykge1xuICAgICAgICB0aGlzLmluZGV4ID0gTWF0aC5taW4odGhpcy5pbmRleCsxLCB0aGlzLmNhcmRzLmxlbmd0aC0xKTtcbiAgICAgIH0gZWxzZSBpZihjYXJkTWlkcG9pbnQgPiB2aWV3cG9ydFdpZHRoIC0gdGhpcy5TTkFQUElORVNTKSB7XG4gICAgICAgIHRoaXMuaW5kZXggPSBNYXRoLm1heCh0aGlzLmluZGV4LTEsIDApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG1vdmUobmV4dEluZGV4LCBkaXJlY3Rpb24pIHtcbiAgICBpZihkaXJlY3Rpb24pIHtcbiAgICAgIGRpcmVjdGlvbiA9PSAncmlnaHQnID8gbmV4dEluZGV4ID0gdGhpcy5pbmRleCsxIDogbmV4dEluZGV4ID0gdGhpcy5pbmRleC0xO1xuICAgIH1cbiAgICBuZXh0SW5kZXggPSBNYXRoLm1pbihNYXRoLm1heChuZXh0SW5kZXgsIDApLCB0aGlzLmNhcmRzLmxlbmd0aCAtIDEpO1xuICAgIHRoaXMuaW5kZXggPSBuZXh0SW5kZXg7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNhcm91c2VsLnBhcmVudEVsZW1lbnQ7XG4gICAgY29uc3QgY29udGFpbmVyV2lkdGggPSBjb250YWluZXIub2Zmc2V0V2lkdGg7XG4gICAgY29uc3QgY29udGFpbmVyTWFyZ2luID0gcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUoY29udGFpbmVyKS5tYXJnaW5MZWZ0LCAwKTtcbiAgXG4gICAgY29uc3QgY2FyZCA9IHRoaXMuY2FyZHNbbmV4dEluZGV4XTtcblxuICAgIC8vIFdpZHRoIG9mIGNvbnRhaW5lciAtIFdpZHRoIG9mIGNhcmQgPSBBbGwgdGhlIGV4dHJhIHNwYWNlXG4gICAgLy8gRGl2aWRlIHRoaXMgYnkgMiB0byBnZXQgZGVzaXJlZCBkaXN0YW5jZSBmcm9tIGVkZ2Ugb24gZWl0aGVyIHNpZGUgb2YgY2FyZFxuICAgIGNvbnN0IGVkZ2VUb0NhcmREaXN0ID0gKGNvbnRhaW5lcldpZHRoIC0gY2FyZC5vZmZzZXRXaWR0aCkvMjtcbiAgICBcbiAgICAvLyBUcmFuc2xhdGluZyB0byB0aGUgbGVmdCBvZiB0aGUgZGVzaXJlZCBjYXJkLCBtaW51cyBvdXIgZGVzaXJlZCBlZGdlIGRpc3RcbiAgICAvLyBNdWx0aXBsaWVkIGJ5IC0xIGJlY2F1c2Ugd2UgYXJlIHRyYW5zbGF0aW5nIHRvIHRoZSByaWdodFxuICAgIGNvbnN0IG5leHRPZmZzZXQgPSBNYXRoLm1pbigoY2FyZC5vZmZzZXRMZWZ0IC0gZWRnZVRvQ2FyZERpc3QgKyBjb250YWluZXJNYXJnaW4pICogLTEsIDApO1xuXG4gICAgLy8gaHR0cDovL2Vhc2luZ3MubmV0LyNlYXNlSW5PdXRDaXJjXG4gICAgY29uc3QgZWFzZSA9ICdjdWJpYy1iZXppZXIoMC43ODUsIDAuMTM1LCAwLjE1LCAwLjg2KSc7XG5cbiAgICB0aGlzLnRyYW5zbGF0ZShuZXh0T2Zmc2V0LCAyNTAsIGVhc2UpO1xuICB9XG5cbiAgb25kcmFnZW5kKGUpIHtcbiAgICB0aGlzLnBvc2l0aW9uID0ge1xuICAgICAgeDogZS50YXJnZXQub2Zmc2V0TGVmdCxcbiAgICAgIHk6IGUudGFyZ2V0Lm9mZnNldFRvcFxuICAgIH07XG5cbiAgICB0aGlzLmNhcm91c2VsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuY2FsbGJhY2tzLm9ubW92ZSk7XG4gICAgdGhpcy5jYXJvdXNlbC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLmNhbGxiYWNrcy5vbm1vdmUpO1xuICAgIFxuICAgIHRoaXMuY2Fyb3VzZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLHRoaXMuY2FsbGJhY2tzLm9uZW5kKTtcbiAgICB0aGlzLmNhcm91c2VsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmNhbGxiYWNrcy5vbmVuZCk7XG4gICAgdGhpcy5jYXJvdXNlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5jYWxsYmFja3Mub25lbmQpO1xuXG4gICAgdGhpcy5kcmFnZ2luZyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLm1vdmUodGhpcy5pbmRleCwgdW5kZWZpbmVkKTtcblxuICAgIHRoaXMucmVzY2FsZSgpO1xuICB9XG5cbiAgb25jbGljayhlKSB7XG4gICAgaWYodGhpcy5kZWx0YS54KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9XG5cbiAgdHJhbnNsYXRlKHgsIGxlbmd0aCwgZm4pIHtcbiAgICB0aGlzLmNhcm91c2VsLnN0eWxlWyd0cmFuc2l0aW9uJ10gPSAndHJhbnNmb3JtJztcbiAgICB0aGlzLmNhcm91c2VsLnN0eWxlWyd0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb24nXSA9IGZuO1xuICAgIHRoaXMuY2Fyb3VzZWwuc3R5bGVbJ3RyYW5zaXRpb25EdXJhdGlvbiddID0gYCR7bGVuZ3RofW1zYDtcbiAgICB0aGlzLmNhcm91c2VsLnN0eWxlWyd0cmFuc2Zvcm0nXSA9IGB0cmFuc2xhdGUzZCgke3h9cHgsMHB4LDBweClgO1xuXG4gICAgdGhpcy5yZXNjYWxlKCk7XG4gIH1cblxuICBwZXJjZW50VmlzaWJsZShjYXJkKSB7XG4gICAgbGV0IGNhcmRSZWN0ID0gY2FyZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBsZXQgY2FyZFdpZHRoID0gY2FyZC5vZmZzZXRXaWR0aDtcbiAgICBsZXQgZnJhbWVXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXG4gICAgaWYoKGNhcmRSZWN0LmxlZnQgPCAwICYmIGNhcmRSZWN0LnJpZ2h0IDwgMCkgfHwgY2FyZFJlY3QubGVmdCA+IGZyYW1lV2lkdGgpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH0gZWxzZSBpZihjYXJkUmVjdC5sZWZ0IDwgMCkge1xuICAgICAgcmV0dXJuIGNhcmRSZWN0LnJpZ2h0L2NhcmRXaWR0aDtcbiAgICB9IGVsc2UgaWYoY2FyZFJlY3QucmlnaHQgPiBmcmFtZVdpZHRoKSB7XG4gICAgICByZXR1cm4gKGZyYW1lV2lkdGggLSBjYXJkUmVjdC5sZWZ0KS9jYXJkV2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgfVxuXG4gIHJlc2NhbGUoKSB7XG4gICAgLy8gUmVzY2FsZSBjdXJyZW50IGNhcmQgYW5kIDIgY2FyZHMgaW4gZWl0aGVyIGRpcmVjdGlvblxuICAgIGNvbnN0IGZyb20gPSBNYXRoLm1heCh0aGlzLmluZGV4LTIgLDApO1xuICAgIGNvbnN0IHRvID0gTWF0aC5taW4odGhpcy5pbmRleCsyLCB0aGlzLmNhcmRzLmxlbmd0aC0xKVxuXG4gICAgZm9yKGxldCBpID0gZnJvbTsgaTw9dG87IGkrKykge1xuICAgICAgbGV0IHNjYWxlciA9IE1hdGgubWF4KHRoaXMucGVyY2VudFZpc2libGUodGhpcy5jYXJkc1tpXSksIDAuOSk7XG5cbiAgICAgIHRoaXMuY2FyZHNbaV0uc3R5bGVbJ3RyYW5zZm9ybSddID0gYHNjYWxlKCR7c2NhbGVyfSlgO1xuICAgICAgdGhpcy5jYXJkc1tpXS5zdHlsZVsndHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uJ10gPSAnZWFzZSc7XG4gICAgICB0aGlzLmNhcmRzW2ldLnN0eWxlWyd0cmFuc2l0aW9uRHVyYXRpb24nXSA9IGAyNTBtc2A7XG4gICAgfVxuICB9XG59XG5uZXcgQXlDYXJvdXNlbCg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNhcm91c2VsJykpO1xuIl19