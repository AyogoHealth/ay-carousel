import {assign} from './utilities';

const CAROUSEL_STYLES = `
  .progress-dots  {
    text-align: center;
  }

  .progress-dots > li.active {
    background: #24282a;
  }

  .progress-dots > li {
    border-radius: 50%;
    display: inline-block;
    margin: 0 5px;
    width: 8px;
    height: 8px;
    border: 1px solid #24282a;
  }

  .carousel-item {
    width: 90%;
    flex: 0 0 auto;
  }
`;

export default class AyCarousel {

  static documentStyleAdded : boolean = false;

  startX : number = 0;
  startY : number = 0;
  initialIndex : number;
  initialIndexSetOnce : boolean = false;
  currentTranslate : number = 0;
  lastTranslate : number = 0;
  currentlyDragging : boolean = false;
  passedMoveThreshold : boolean = false;
  callbacks : any = {};
  cards : HTMLElement[];
  cardWidth : number;
  index : number = 0;
  startIndex: number;
  carousel : HTMLElement;
  dotContainer : HTMLUListElement;
  dots : HTMLLIElement[] = [];
  totalMove;
  lastPos;
  amplitude = 0;
  velocity = 0;
  frame;
  timestamp = 0;
  target;
  velocityInterval;
  config;
  carouselParent;
  resizeTimeoutId : number;
  destroyed : boolean = false;
  onIndexChange : Function;
  finishedSwipe : Function;
  onMove : Function;

  constructor(carousel : HTMLElement, config?, initialIndex=0, onIndexChange? : Function, finishedSwipe? : Function, onMove? : Function) {
    if (! carousel) {
      return;
    }

    this.config = this.setupConfig(config);
    this.initialIndex = initialIndex;
    if (onIndexChange) {
      this.onIndexChange = onIndexChange;
    }

    if (finishedSwipe) {
      this.finishedSwipe = finishedSwipe;
    }

    if (onMove) {
      this.onMove = onMove;
    }
    this.carousel = carousel;

    if (this.config.includeStyle) {
      if (! AyCarousel.documentStyleAdded) {
        const carStyle = document.createElement('style');
        carStyle.appendChild(document.createTextNode(CAROUSEL_STYLES));

        let insertPoint: HTMLElement | null;
        if (insertPoint = document.querySelector('link')) {
          insertPoint.parentNode!.insertBefore(carStyle, insertPoint);
        } else if (insertPoint = document.querySelector('style')) {
          insertPoint.parentNode!.insertBefore(carStyle, insertPoint);
        } else if (insertPoint = document.querySelector('head')) {
          insertPoint.appendChild(carStyle);
        } else {
          document.appendChild(carStyle);
        }
        AyCarousel.documentStyleAdded = true;
      }

      this.carousel.setAttribute('style',  `position: relative; width: 100%; display: flex; align-items: stretch;`);
    }

    this.callbacks.onDragStart = this.onDragStart.bind(this);
    this.callbacks.onDragMove = this.onDragMove.bind(this);
    this.callbacks.onDragEnd = this.onDragEnd.bind(this);
    this.callbacks.onDotClick = this.onDotClick.bind(this);
    this.callbacks.onDotKey = this.onDotKey.bind(this);
    this.callbacks.onWindowResize = this.handleResize.bind(this);
    this.callbacks.onResizeFollowUp = this.followUpResize.bind(this);
    this.callbacks.onTransitionEnd = (evt : TransitionEvent) => {
      if (evt.target === this.carousel) {
        this.rescale();
      }
    };
    this.callbacks.onClick = (evt : MouseEvent) => {
      if (this.totalMove && (this.totalMove.x > this.config.moveThreshold || this.totalMove.y > this.config.moveThreshold)) {
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

  updateItems() {
    this.cards = [];
    for (let i=0, l=this.carousel.children.length; i<l; i++) {
      let child = <HTMLElement>this.carousel.children[i];
      if ((! this.config.cardFilterClass) || child.classList.contains(this.config.cardFilterClass)) {
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

    window.requestAnimationFrame(_ => this.rescale());

    if (this.dotContainer) {
      this.removeDots(false);
    } else {
      this.dotContainer = document.createElement('ul');
      this.dotContainer.classList.add('progress-dots');
      // Inserting before the carousel's nextSibling <=> Inserting after the carousel
      this.carouselParent.element.insertBefore(this.dotContainer, this.carousel.nextSibling);
    }

    if (this.config.enableDots && this.cards.length > 1) {
      for(let i = 0; i < this.cards.length; i++) {
        this.dots.push(document.createElement('li'));
        this.dotContainer.insertAdjacentElement('beforeend', this.dots[i]);
        this.dots[i].addEventListener('touchstart', this.callbacks.onDotClick);
        this.dots[i].addEventListener('click', this.callbacks.onDotClick);
        this.dots[i].addEventListener('keydown', this.callbacks.onDotKey);
        this.dots[i].tabIndex = 0;
      }
      this.dots[this.index].className = 'active';
    }
  }

  handleResize(snap : boolean = true) {
    if (this.resizeTimeoutId) {
      clearTimeout(this.resizeTimeoutId);
    }
    this.followUpResize(snap);
    this.resizeTimeoutId = window.setTimeout(this.callbacks.onResizeFollowUp, 150, snap);
  }

  followUpResize(snap : boolean = true): void {
    this.resizeTimeoutId = 0;

    let carouselParent = this.carousel.parentElement;

    if (carouselParent) {
      let parentRect = carouselParent.getBoundingClientRect();

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
  }

  onDragStart(e) {
    if (this.cards.length < 2) {
      return;
    } else if (this.currentlyDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.currentlyDragging = true;
    this.passedMoveThreshold = false;

    this.carousel.style.setProperty('will-change', 'transform');

    this.startIndex = this.index;

    const touches =  e.touches ? e.touches[0] : e;
    const {pageX, pageY} = touches;

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

    // Velocity Stuff
    this.velocity = this.amplitude = 0;
    this.frame = this.currentTranslate;
    this.timestamp = Date.now();

    this.velocityInterval = window.setInterval(this.calcVelocity.bind(this), 100);

    this.carousel.addEventListener('mousemove', this.callbacks.onDragMove);
    this.carousel.addEventListener('touchmove', this.callbacks.onDragMove);

    this.carousel.addEventListener('touchend', this.callbacks.onDragEnd);
    this.carousel.addEventListener('mouseup', this.callbacks.onDragEnd);
    this.carousel.addEventListener('mouseleave', this.callbacks.onDragEnd);
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
    if (this.destroyed) {
      return;
    }

    if(this.amplitude) {
      const elapsed = Date.now() - this.timestamp;

      const delta = -this.amplitude * Math.exp(-elapsed / (this.config.decelerationRate));

      if(this.startIndex !== this.index && this.config.limitMomentumToOnePage) {
        // Limit distance of move to +/- 1 from the startIndex
        const moveDiff = Math.max(-1, Math.min(1, this.index - this.startIndex));
        this.snap(this.startIndex + moveDiff);
      } else if(delta > stopPoint || delta < -stopPoint) {
        const outOfBoundsLeft = this.target+delta > (this.config.edgeBounceProportion * this.cardWidth);
        const outOfBoundsRight = this.target+delta < (this.calcOS(this.cards.length-1) - (this.config.edgeBounceProportion * this.cardWidth));
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

  onDragMove(e) {
    const touches =  e.touches ? e.touches[0] : e;
    const {pageX, pageY} = touches;
    const move = {
      x: pageX - this.startX,
      y: pageY - this.startY
    };

    // Keep track of the total distance moved right/left in the move
    this.totalMove.x += Math.abs(move.x - this.lastPos.x);
    this.totalMove.y += Math.abs(move.y - this.lastPos.y);
    this.lastPos = {
      x: move.x,
      y: move.y
    };

    // Don't do anything if the move doesn't exceed our threshold
    if (this.totalMove.x < this.config.moveThreshold && this.totalMove.y < this.config.moveThreshold) {
      return;
    }
    if (! this.passedMoveThreshold) {
      this.passedMoveThreshold = true;
      this.startX = pageX;
      this.startY = pageY;
      return;
    }

    // If the swipe is vertical, allow page to scroll instead of moving carousel
    if(this.totalMove.x > this.totalMove.y) {
      e.preventDefault();

      this.translate(this.lastTranslate + move.x, 0);
      this.velocity = this.calcVelocity();

    }
  }

  calculateIndex() {
    let edgeToCardDist = (this.carouselParent.width - this.cardWidth) / 2;
    let index = Math.round((edgeToCardDist - this.currentTranslate) / this.cardWidth);
    return Math.max(0, Math.min(this.cards.length-1, (index)));
  }

  onDotClick(e) {
    let i = this.dots.indexOf(e.target);
    this.setIndex(i);
    this.snap(this.index);
  }

  onDotKey(e) {
    if (e.keyCode === 32 || e.keyCode === 13) {
      let i = this.dots.indexOf(e.target);
      e.preventDefault();
      e.stopPropagation();
      this.setIndex(i);
      this.snap(this.index);
    }
  }

  setIndex(index: number) {
    const oldIndex = this.index;

    // Don't let index go outside bounds
    this.index = Math.max(Math.min(index, this.cards.length-1), 0);

    // Update dots, TODO: animate this
    if (oldIndex !== this.index && this.dots && this.dots[oldIndex] && this.dots[this.index]) {
      this.dots[oldIndex].className = '';
      this.dots[this.index].className = 'active';
    }

    if (oldIndex !== this.index) {
      this.onIndexChange && this.onIndexChange({ index: this.index });
    }
  }

  snap(nextIndex? : number, direction? : string, instant? : boolean) {
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

    const duration = instant ? 200 : Math.floor(distance*1.25) + this.config.snapSpeedConstant;

    this.translate(nextOffset, duration, ease);

    this.finishedSwipe && this.finishedSwipe({ index: this.index });
  }

  onDragEnd() {
    this.currentlyDragging = false;

    this.carousel.removeEventListener('mousemove', this.callbacks.onDragMove);
    this.carousel.removeEventListener('touchmove', this.callbacks.onDragMove);

    this.carousel.removeEventListener('touchend',this.callbacks.onDragEnd);
    this.carousel.removeEventListener('mouseup', this.callbacks.onDragEnd);
    this.carousel.removeEventListener('mouseleave', this.callbacks.onDragEnd);

    this.carousel.style.removeProperty('will-change');

    window.clearInterval(this.velocityInterval);
    if(this.velocity > 0.5 || this.velocity < -0.5) {
      this.amplitude = (1-this.config.heaviness) * this.velocity;
      this.target = Math.round(this.currentTranslate + this.amplitude);

      this.index = this.calculateIndex();
      window.requestAnimationFrame(_ => this.momentumScroll(this.config.momentumSnapVelocityThreshold));
    } else {
      this.snap(this.index);
    }
  }

  translate(x : number, length : number, fn? : string, updateIndex : boolean = true) {
    let oldTranslate = this.currentTranslate;
    this.currentTranslate = x;

    if (!('transform' in this.carousel.style)) {
      (this.carousel.style as any)['transition'] = '-webkit-transform';
      (this.carousel.style as any)['webkitTransform'] = `translate3d(${x}px,0px,0px)`;
    } else {
      this.carousel.style['transition'] = 'transform';
      this.carousel.style['transform'] = `translate3d(${x}px,0px,0px)`;
    }
    this.carousel.style['transitionDuration'] = `${length}ms`;

    if(fn) {
      this.carousel.style['transitionTimingFunction'] = fn;
    }
    if(length === 0 && updateIndex) {
      // We only want to calculate the index if we're responding to a user drag
      // i.e. a 0 length transition
      this.setIndex(this.calculateIndex());
    }
    window.requestAnimationFrame(_ => this.rescale());
    if (oldTranslate !== this.currentTranslate) {
      this.onMove && this.onMove({ proportion: -this.currentTranslate / ((this.cards.length-1)*this.cardWidth), duration: length });
    }
  }

  proportionVisible(index : number) : number {
    let prop = 1 - Math.abs((this.calcOS(index) - this.currentTranslate) / this.cardWidth);
    return Math.max(0, prop);
  }

  rescale() {
    if (this.destroyed || this.config.minCardScale >= 1) {
      return;
    }

    // Rescale current card and 2 cards in either direction
    const from = Math.max(this.index-2 ,0);
    const to = Math.min(this.index+2, this.cards.length-1);

    for(let i = from; i<=to; i++) {
      const scaler = Math.min(Math.max(this.proportionVisible(i)+0.25, this.config.minCardScale), 1);

      this.cards[i].style['transform'] = `scale(${scaler})`;
      this.cards[i].style['transitionTimingFunction'] = 'ease';
      this.cards[i].style['transitionDuration'] = `${this.config.shrinkSpeed}ms`;
    }
  }

  calcOS(i) {
    // Width of container - Width of card = All the extra space
    // Divide this by 2 to get desired distance from edge on either side of card
    const edgeToCardDist = (this.carouselParent.width - this.cardWidth)/2;

    // Translating to the left of the desired card, minus our desired edge dist
    // Multiplied by -1 because we are translating to the right
    let centeredPosition = (this.cardWidth*i - edgeToCardDist) * -1;

    if (! this.config.edgeShifting) {
      return centeredPosition;
    }

    if (this.cards.length <= 1) {             //If there's only one item, center it
      return centeredPosition;
    } else if (i === 0) {                     //If it's the first of multiple, align left
      return 0;
    } else if (i === this.cards.length - 1) { //If it's the last of multiple, align right
      return (this.carouselParent.width - this.cardWidth) - (this.cardWidth * (this.cards.length - 1));
    } else {                                  //Otherwise it's in the middle of multiple, so center it
      return centeredPosition;
    }
  }

  cleanUp() {
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
  }

  removeDots(includingContainer : boolean = false) {
    while (this.dots.length > 0) {
      let dot = this.dots.pop();
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
  }

  setupConfig(config?) {
    const defaultConfig = {
      decelerationRate: 700, // How fast we decelerate
      momentumSnapVelocityThreshold: 105, // Velocity at which cards snap
      minCardScale: 0.9, // Smallest that partially-viewable cards can scale to
      snapSpeedConstant: 300, // Constant ms to be added to snapping duration
      heaviness: 0.675, // Scale of 0 to 1, higher = less momentum after release
      shrinkSpeed: 150, // Speed of card scaling transition, in ms
      moveThreshold: 10, // Min accumulative x + y distance travelled by pointer before carousel will move and click events are cancelled
      edgeBounceProportion: 0.25, // How far beyond the scroll limits the carousel can travel with momentum before snapping (proportion of card width)
      cardFilterClass: '', // If non-falsey, only carousel children with a class matching the supplied value will be itemised as cards
      edgeShifting: true, // Edge shifting aligns the first and last carousel items to the left and right edge of the parent element, but it's not always wanted. Setting this false centers every item.
      enableDots: true,
      includeStyle: false,
      limitMomentumToOnePage: false
    };
    return assign({}, defaultConfig, config);
  }
}
