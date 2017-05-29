export default class AyCarousel {
    constructor(carousel) {
        this.startX = 0;
        this.startY = 0;
        this.callbacks = {};
        this.index = 0;
        this.dots = [];
        this.rescaling = false;
        this.translating = false;
        this.timestamp = 0;
        this.previousTranslate = 0;
        let CAROUSEL_STYLES = `
    .progress-dots  {
      text-align: center;
      list-style: none;
    }

    .progress-dots > li {
      border-radius: 50%;
      background: white;
      display: inline-block;
      margin: 0 3px;
      width: 10px;
      height: 10px;
      border: 1px solid black;
    }

    .progress-dots > li.active {
      background: #45a2e2;
    }

    .card {
      border-radius: 5px;
      box-shadow: inset 0 0 1px black;
      margin: 10px 0px;
      float: left;
      height: auto;
      width: 80vw;
      display: block;
      background: white; 
      line-height: 150px;
      font-size: 32px;
      font-family: sans-serif;
      text-align: center;
    }
    `;
        let carStyle = document.createElement('style');
        carStyle.appendChild(document.createTextNode(CAROUSEL_STYLES));
        let insertPoint;
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
            this.carousel.setAttribute('style', `position: relative; width: 30000px; display: inline-block;`);
            this.carousel.addEventListener('touchstart', e => this.ondragstart(e));
            this.carousel.addEventListener('mousedown', e => this.ondragstart(e));
            this.cards = this.carousel.children;
            this.rescale();
            this.cardWidth = this.cards[0].offsetWidth;
            this.carousel.addEventListener('transitionend', () => {
                this.translating = false;
                window.requestAnimationFrame(_ => this.rescale());
            });
            window.requestAnimationFrame(_ => this.rescale());
            let dotContainer = document.createElement('ul');
            dotContainer.classList.add('progress-dots');
            if (this.carousel.parentElement) {
                this.carousel.parentElement.insertBefore(dotContainer, this.carousel.nextSibling);
            }
            for (let i = 0; i < this.cards.length; i++) {
                this.dots.push(document.createElement('li'));
                dotContainer.insertAdjacentElement('beforeend', this.dots[i]);
                this.dots[i].addEventListener('touchstart', _ => this.ondotclick(i));
                this.dots[i].addEventListener('click', _ => this.ondotclick(i));
                this.dots[i].tabIndex = i + 1;
            }
            this.dots[this.index].className = 'active';
        }
    }
    ondragstart(e) {
        const touches = e.touches ? e.touches[0] : e;
        const { pageX, pageY } = touches;
        const boundingRect = this.cards[this.index].getBoundingClientRect();
        this.offset = {
            x: pageX - boundingRect.left,
            y: pageY - boundingRect.top
        };
        this.delta = {};
        this.position = {
            x: this.carousel.offsetLeft,
            y: this.carousel.offsetTop
        };
        let edgeToCardDist = this.cards[this.index].getBoundingClientRect().left;
        this.lastTranslate = this.carousel.getBoundingClientRect().left - edgeToCardDist;
        this.startX = pageX;
        this.startY = pageY;
        this.callbacks.onmove = e => this.ondragmove(e);
        this.callbacks.onend = e => this.ondragend(e);
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
    }
    calcVelocity() {
        const now = Date.now();
        const elapsed = now - this.timestamp;
        this.timestamp = now;
        const delta = this.currentTranslate - this.frame;
        this.frame = this.currentTranslate;
        const v = 1000 * delta / (1 + elapsed);
        return this.velocity = 0.1 * v;
    }
    momentumScroll(stopPoint) {
        const timeConstant = 325;
        if (this.amplitude) {
            this.setIndex(this.calculateIndex());
            let elapsed = Date.now() - this.timestamp;
            const delta = -this.amplitude * Math.exp(-elapsed / timeConstant);
            if (delta > stopPoint || delta < -stopPoint) {
                this.translate(this.target + delta, 0);
                window.requestAnimationFrame(_ => this.momentumScroll(stopPoint));
            }
            else {
                this.translate(this.target, 0);
                this.snap(this.index, undefined);
            }
        }
    }
    ondragmove(e) {
        const touches = e.touches ? e.touches[0] : e;
        const { pageX, pageY } = touches;
        const move = {
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
    }
    calculateIndex(position) {
        let cardLeft = position;
        if (!cardLeft) {
            cardLeft = this.cards[this.index].getBoundingClientRect().left;
        }
        let cardMidpoint = (cardLeft + cardLeft + this.cardWidth) / 2;
        let viewportWidth = window.innerWidth;
        if (cardMidpoint <= 0) {
            return this.index + 1;
        }
        else if (cardMidpoint > viewportWidth) {
            return this.index - 1;
        }
        else {
            return this.index;
        }
    }
    ondotclick(i) {
        this.setIndex(i);
        this.snap(this.index);
    }
    setIndex(index) {
        const oldIndex = this.index;
        this.index = Math.max(Math.min(index, this.cards.length - 1), 0);
        if (oldIndex !== this.index) {
            this.dots[oldIndex].className = '';
            this.dots[this.index].className = 'active';
        }
    }
    snap(nextIndex, direction) {
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
        const nextOffset = this.calcOS(this.index);
        const ease = 'ease';
        const distance = Math.abs(this.currentTranslate - nextOffset);
        const duration = Math.floor(distance / 0.5) + 100;
        this.translate(nextOffset, duration, ease);
    }
    ondragend(e) {
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
            let stopPoint = 50;
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
            window.requestAnimationFrame(_ => this.momentumScroll(stopPoint));
        }
        else {
            this.snap(this.index, undefined);
        }
    }
    translate(x, length, fn) {
        this.carousel.style['transition'] = 'transform';
        this.carousel.style['transitionDuration'] = `${length}ms`;
        this.carousel.style['transform'] = `translate3d(${x}px,0px,0px)`;
        if (fn) {
            this.carousel.style['transitionTimingFunction'] = fn;
        }
        if (length > 0) {
            this.translating = true;
        }
        window.requestAnimationFrame(_ => this.rescale());
    }
    percentVisible(card) {
        let cardRect = card.getBoundingClientRect();
        let cardWidth = card.offsetWidth;
        let frameWidth = window.innerWidth;
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
    }
    rescale() {
        const from = Math.max(this.index - 2, 0);
        const to = Math.min(this.index + 2, this.cards.length - 1);
        for (let i = from; i <= to; i++) {
            let scaler = Math.max(this.percentVisible(this.cards[i]), 0.9);
            this.cards[i].style['transform'] = `scale(${scaler})`;
            this.cards[i].style['transitionTimingFunction'] = 'ease';
            this.cards[i].style['transitionDuration'] = `150ms`;
        }
        if (this.translating) {
            window.requestAnimationFrame(_ => this.rescale());
        }
    }
    calcOS(i) {
        const container = (this.carousel.parentElement);
        const containerWidth = container.offsetWidth;
        const containerMargin = parseInt(window.getComputedStyle(container).marginLeft, 0);
        const edgeToCardDist = (containerWidth - this.cardWidth) / 2;
        return Math.min((this.cardWidth * i - edgeToCardDist + containerMargin) * -1, 0);
    }
}
//# sourceMappingURL=index.js.map