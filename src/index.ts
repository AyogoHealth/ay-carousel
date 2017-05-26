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
  readonly SNAPPINESS : number = 65;
  totalMove : any;
  lastPos : any;
  dots : HTMLElement[] = [];
  rescaling : boolean = false;
  translating : boolean = false;
  amplitude;
  velocity;
  frame;
  elapsed;
  timestamp = 0;
  previousTranslate = 0;
  target;

  constructor(carousel : HTMLElement) {
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
      height: 80vw;
      width: 80vw;
      display: block;
      background: white; 
      line-height: 150px;
      font-size: 32px;
      font-family: sans-serif;
      text-align: center;
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
      this.carousel = carousel;

      this.carousel.setAttribute('style',  `position: relative; width: 30000px; display: inline-block;`);
      this.carousel.addEventListener('touchstart', e => this.ondragstart(e));
      this.carousel.addEventListener('mousedown', e => this.ondragstart(e));

      this.cards = <any>this.carousel.children;
      this.rescale();

      this.cardWidth = this.cards[0].offsetWidth;

      this.carousel.addEventListener('transitionend', () => {
        this.translating = false;
        window.requestAnimationFrame(_ => this.rescale());
      });
      window.requestAnimationFrame(_ => this.rescale());
      let dotContainer = document.createElement('ul');
      dotContainer.classList.add('progress-dots');
      
      // Inserting before the carousel's nextSibling <=> Inserting after the carousel
      if(this.carousel.parentElement) {
        this.carousel.parentElement.insertBefore(dotContainer, this.carousel.nextSibling);
      }

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

    this.totalMove = 
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

    const v = 1000 * delta / (1 + elapsed);
    return 0.8 * v + 0.2 * v;
  }

  momentumScroll() {
    const timeConstant = 325;
    const stopPoint = 0.5;

    if(this.amplitude) {
      this.setIndex(this.calculateIndex());
      let elapsed = Date.now() - this.timestamp;
      const delta = -this.amplitude * Math.exp(-elapsed / timeConstant);
      if(delta > stopPoint || delta < -stopPoint) {
        this.translate(this.target + delta, 0);
        window.requestAnimationFrame(_ => this.momentumScroll());
      } else {
        this.translate(this.target, 0);
        this.snap(this.index, undefined);
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

    if(this.totalMove.x < 10 && this.totalMove.y < 10) {
      return;
    }

    if(this.totalMove.x > this.totalMove.y) {
      e.preventDefault();
      this.delta = {
        x: pageX - this.position.x,
        y: pageY - this.position.y
      };

      this.previousTranslate = this.currentTranslate;
      this.currentTranslate = this.delta.x + this.lastTranslate - this.offset.x;

      this.translate(this.currentTranslate, 0);

      this.setIndex(this.calculateIndex());
    }
  }

  calculateIndex() {
    let cardMidpoint = (this.cards[this.index].getBoundingClientRect().left + this.cards[this.index].getBoundingClientRect().right) / 2;
    let viewportWidth = window.innerWidth;

    if(cardMidpoint <= 0 + this.SNAPPINESS) {
      // If card midpoint is close enough to left edge, decrement index
      return this.index + 1;
    } else if(cardMidpoint > viewportWidth - this.SNAPPINESS) {
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

    // http://easings.net/#easeInOutCirc
    // const ease = 'cubic-bezier(0.785, 0.135, 0.15, 0.86)';
    const ease = 'ease';
    const distance = Math.abs(this.currentTranslate - nextOffset);
    
    const duration = Math.floor(distance/0.2);

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

    const velocity = this.calcVelocity();

    if(velocity > 0.5 || velocity < -0.5) {
      this.amplitude = 0.8 * velocity;
      this.target = Math.round(this.currentTranslate + this.amplitude);

      // Round to nearest offset
      this.target = Math.round(this.target/this.cardWidth) * this.cardWidth + (this.cardWidth + this.calcOS(1));

      this.timestamp = Date.now();
      window.requestAnimationFrame(_ => this.momentumScroll());
    }
    
    // Snap to index, which has been set to the nearest card
    //this.snap(this.index, undefined);
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
    }
    window.requestAnimationFrame(_ => this.rescale());
  }

  percentVisible(card : HTMLElement) {
    let cardRect = card.getBoundingClientRect();
    let cardWidth = card.offsetWidth;
    let frameWidth = window.innerWidth;

    if((cardRect.left < 0 && cardRect.right < 0) || cardRect.left > frameWidth) {
      return 0;
    } else if(cardRect.left < 0) {
      return cardRect.right/cardWidth;
    } else if(cardRect.right > frameWidth) {
      return (frameWidth - cardRect.left)/cardWidth;
    } else {
      return 1;
    }
  }

  rescale() {
    // Rescale current card and 2 cards in either direction
    const from = Math.max(this.index-2 ,0);
    const to = Math.min(this.index+2, this.cards.length-1)

    for(let i = from; i<=to; i++) {
      let scaler = Math.max(this.percentVisible(this.cards[i]), 0.9);

      this.cards[i].style['transform'] = `scale(${scaler})`;
      this.cards[i].style['transitionTimingFunction'] = 'ease';
      this.cards[i].style['transitionDuration'] = `150ms`;
    }

    if(this.translating) {
      window.requestAnimationFrame(_ => this.rescale());
    }
  }

  calcOS(i) {
    const container = <HTMLElement>(this.carousel.parentElement);
    const containerWidth = container.offsetWidth;
    const containerMargin = parseInt(<string>window.getComputedStyle(container).marginLeft, 0);
    
    // Width of container - Width of card = All the extra space
    // Divide this by 2 to get desired distance from edge on either side of card
    const edgeToCardDist = (containerWidth - this.cardWidth)/2;

    // Translating to the left of the desired card, minus our desired edge dist
    // Multiplied by -1 because we are translating to the right
    return Math.min((this.cardWidth*i - edgeToCardDist + containerMargin) * -1, 0);
  }
}
