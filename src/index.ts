export default class AyCarousel {
  offset : any;
  startX : number = 0;
  startY : number = 0;
  delta : any;
  position : any;
  currentTranslate : number;
  lastTranslate : number;
  callbacks : any = {};
  cards : HTMLElement[];
  cardWidth : number;
  index : number = 0;
  carousel : HTMLElement;
  totalMove : any;
  lastPos : any;
  dots : HTMLElement[] = [];
  translating : boolean = false;
  amplitude;
  velocity;
  frame;
  elapsed;
  timestamp = 0;
  previousTranslate = 0;
  target;
  closestCard;
  velocityInterval;
  config;
  viewportWidth;
  carouselParent;

  constructor(carousel : HTMLElement, config?) {
    let CAROUSEL_STYLES = `
    .progress-dots  {
      text-align: center;
      list-style: none;
    }

    .progress-dots > li.active {
      background: #45a2e2;
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

    .carousel-item {
      float: left;
    }
    `

    let carStyle = document.createElement('style');
    carStyle.appendChild(document.createTextNode(CAROUSEL_STYLES));

    let insertPoint : HTMLElement | null;
    if (insertPoint = document.querySelector('link')) {
        insertPoint.parentNode!.insertBefore(carStyle, insertPoint);
    } else
    if (insertPoint = document.querySelector('style')) {
        insertPoint.parentNode!.insertBefore(carStyle, insertPoint);
    } else
    if (insertPoint = document.querySelector('head')) {
        insertPoint.appendChild(carStyle);
    } else {
        document.appendChild(carStyle);
    }

    if(carousel) {
      this.config = this.setupConfig(config);

      this.carousel = carousel;
      this.handleResize();

      this.carousel.setAttribute('style',  `position: relative; width: 30000px; display: inline-block;`);
      this.carousel.addEventListener('touchstart', e => this.ondragstart(e));
      this.carousel.addEventListener('mousedown', e => this.ondragstart(e));

      this.cards = <any>this.carousel.children;
      this.rescale();

      this.cardWidth = this.cards[0].offsetWidth;
      this.currentTranslate = 0;

      this.carousel.addEventListener('transitionend', () => {
        this.translating = false;
        window.requestAnimationFrame(_ => this.rescale());
      });
      window.requestAnimationFrame(_ => this.rescale());
      window.addEventListener('resize', this.handleResize);

      if(this.config.enableDots) {
        let dotContainer = document.createElement('ul');
        dotContainer.classList.add('progress-dots');

        // Inserting before the carousel's nextSibling <=> Inserting after the carousel
        this.carouselParent.element.insertBefore(dotContainer, this.carousel.nextSibling);

        for(let i = 0; i < this.cards.length; i++) {
          this.dots.push(document.createElement('li'));
          dotContainer.insertAdjacentElement('beforeend', this.dots[i]);
          this.dots[i].addEventListener('touchstart', _ => this.ondotclick(i));
          this.dots[i].addEventListener('click', _ => this.ondotclick(i));
          this.dots[i].tabIndex = i+1;
        }
        this.dots[this.index].className = 'active';
      }
    }
  }

  handleResize() {
    this.viewportWidth = window.innerWidth;

    const carouselParent = this.carousel.parentElement;

    if(carouselParent) {
      this.carouselParent = {
        element: carouselParent,
        width: carouselParent.offsetWidth,
        marginLeft: parseInt(<string>window.getComputedStyle(carouselParent).marginLeft, 0)
      }
    }
  }

  ondragstart(e) {
    const touches =  e.touches ? e.touches[0] : e;
    const {pageX, pageY} = touches;

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
    }

    this.lastPos = {
      x: 0,
      y: 0
    }

    // Velocity Stuff
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
    // Calculations from: 
    // https://ariya.io/2013/11/javascript-kinetic-scrolling-part-2

    const now = Date.now();
    const elapsed = now - this.timestamp;
    this.timestamp = now;
    const delta = this.currentTranslate - this.frame;
    this.frame = this.currentTranslate;

    // Distance moved, divided by time elapsed (+1 to avoid divide by 0)
    // Multiplied by 1000 ms/sec
    const v = 1000 * delta / (1 + elapsed);

    return this.velocity = 0.8 * v + 0.2 * this.velocity;
  }

  momentumScroll(stopPoint) {
    if(this.amplitude) {
      let elapsed = Date.now() - this.timestamp;

      const delta = -this.amplitude * Math.exp(-elapsed / (this.config.decelerationRate));

      if(delta > stopPoint || delta < -stopPoint) {
        const outOfBoundsLeft = this.target+delta > 0+this.cardWidth;
        const outOfBoundsRight = this.target+delta < -this.cardWidth * this.cards.length;
        if(outOfBoundsLeft || outOfBoundsRight) {
          return this.snap(this.index);
        }
        this.translate(this.target + delta, 0);
        window.requestAnimationFrame(_ => this.momentumScroll(stopPoint));
      } else {
        this.snap(this.index);
      }
    }
  }

  ondragmove(e) {
    const touches =  e.touches ? e.touches[0] : e;
    const {pageX, pageY} = touches;
    const move = {
      x: this.startX - pageX,
      y: this.startY - pageY
    }

    // Keep track of the total distance moved right/left in the move
    this.totalMove.x += Math.abs(move.x - this.lastPos.x);
    this.totalMove.y += Math.abs(move.y - this.lastPos.y);
    this.lastPos = {
      x: move.x,
      y: move.y
    };

    // Don't do anything if the move doesn't exceed our threshold
    if(this.totalMove.x < 10 && this.totalMove.y < 10) {
      return;
    }

    // If the swipe is vertical, allow page to scroll instead of moving carousel
    if(this.totalMove.x > this.totalMove.y) {
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
  }

  calculateIndex(position?) {
    let cardLeft = position
    if(!cardLeft) {
      cardLeft = this.cards[this.index].getBoundingClientRect().left
    }

    let cardMidpoint = (cardLeft + cardLeft + this.cardWidth) / 2;
    
    if(cardMidpoint <= 0) {
      // If card midpoint is close enough to left edge, decrement index
      return this.index + 1;
    } else if(cardMidpoint > this.viewportWidth) {
      // If card midpoint is close enough to right edge, increment index
      return this.index - 1;
    } else {
      return this.index;
    }
  }

  ondotclick(i) {
    this.setIndex(i);
    this.snap(this.index);
  }

  setIndex(index: number) {
    const oldIndex = this.index;
    
    // Don't let index go outside bounds
    this.index = Math.max(Math.min(index, this.cards.length-1), 0);

    // Update dots, TODO: animate this
    if(oldIndex !== this.index) {
      this.dots[oldIndex].className = '';
      this.dots[this.index].className = 'active';
    }
  }

  snap(nextIndex? : number, direction? : string) {
    if(direction) {
      direction == 'right' ? nextIndex = this.index+1 : nextIndex = this.index-1;
    } else if(nextIndex !== undefined) {
      nextIndex = Math.min(Math.max(nextIndex, 0), this.cards.length - 1);
    } else {
      return;
    }
    this.index = nextIndex;

    const nextOffset = this.calcOS(this.index);

    const ease = 'ease';
    const distance = Math.abs(this.currentTranslate - nextOffset);
    
    const duration = Math.floor(distance*1.25) + this.config.snapSpeedConstant;

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
    
    this.carousel.removeEventListener('touchend',this.callbacks.onend);
    this.carousel.removeEventListener('mouseup', this.callbacks.onend);
    this.carousel.removeEventListener('mouseleave', this.callbacks.onend);

    window.clearInterval(this.velocityInterval);
    if(this.velocity > 0.5 || this.velocity < -0.5) {
      this.amplitude = (1-this.config.heaviness) * this.velocity;
      this.target = Math.round(this.currentTranslate + this.amplitude);
      
      this.closestCard = Math.round(this.target/this.cardWidth) * this.cardWidth + (this.cardWidth + this.calcOS(1));

      window.requestAnimationFrame(_ => this.momentumScroll(this.config.momentumSnapVelocityThreshold));
    } else {
      this.snap(this.index);
    }
  }

  translate(x : number, length : number, fn? : string) {
    this.carousel.style['transition'] = 'transform';
    this.carousel.style['transitionDuration'] = `${length}ms`;
    this.carousel.style['transform'] = `translate3d(${x}px,0px,0px)`;
    if(fn) {
      this.carousel.style['transitionTimingFunction'] = fn;
    }
    if(length > 0) {
      this.translating = true;
    } else {
      // We only want to calculate the index if we're responding to a user drag
      // i.e. a 0 length transition
      this.setIndex(this.calculateIndex());
    }
    window.requestAnimationFrame(_ => this.rescale());
  }

  percentVisible(card : HTMLElement) {
    let cardRect = card.getBoundingClientRect();

    if((cardRect.left < 0 && cardRect.right < 0) || cardRect.left > this.viewportWidth) {
      return 0;
    } else if(cardRect.left < 0) {
      return cardRect.right/this.cardWidth;
    } else if(cardRect.right > this.viewportWidth) {
      return (this.viewportWidth - cardRect.left)/this.cardWidth;
    } else {
      return 1;
    }
  }

  rescale() {
    // Rescale current card and 2 cards in either direction
    const from = Math.max(this.index-2 ,0);
    const to = Math.min(this.index+2, this.cards.length-1)
 
    for(let i = from; i<=to; i++) {
      let scaler = Math.max(this.percentVisible(this.cards[i]), this.config.minCardScale);

      this.cards[i].style['transform'] = `scale(${scaler})`;
      this.cards[i].style['transitionTimingFunction'] = 'ease';
      this.cards[i].style['transitionDuration'] = `${this.config.shrinkSpeed}ms`;
    }

    if(this.translating) {
      window.requestAnimationFrame(_ => this.rescale());
    }
  }

  calcOS(i) {
    // Width of container - Width of card = All the extra space
    // Divide this by 2 to get desired distance from edge on either side of card
    const edgeToCardDist = (this.carouselParent.width - this.cardWidth)/2;

    // Translating to the left of the desired card, minus our desired edge dist
    // Multiplied by -1 because we are translating to the right
    return Math.min((this.cardWidth*i - edgeToCardDist + this.carouselParent.marginLeft) * -1, 0);
  }

  setupConfig(config?) {
    const defaultConfig = {
      decelerationRate: 700, // How fast we decelerate
      momentumSnapVelocityThreshold: 100, // Velocity at which cards snap
      minCardScale: 0.9, // Smallest that partially-viewable cards can scale to
      snapSpeedConstant: 300, // Constant ms to be added to snapping duration
      heaviness: 0.95, // Scale of 0 to 1, higher = less momentum after release
      shrinkSpeed: 150, // Speed of card scaling transition, in ms 
      enableDots: true  
    };
    return assign({}, defaultConfig, config);
  }
}

// Roughly taken from MDN
const assign = function(target, ...args) { // .length of function is 2
  'use strict';
  args;
  if (target == null) { // TypeError if undefined or null
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var to = Object(target);

  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];

    if (nextSource != null) { // Skip over if undefined or null
      for (var nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
};
