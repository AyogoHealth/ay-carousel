class AyCarousel {
  dragging : boolean;
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
  readonly SNAPPINESS : number = 40;
  totalMove : any;
  lastPos : any;

  constructor(carousel : HTMLElement) {
    if(carousel) {
      this.carousel = carousel;
      
      this.carousel.addEventListener('touchstart', e => this.ondragstart(e));
      this.carousel.addEventListener('mousedown', e => this.ondragstart(e));

      this.cards = <any>this.carousel.children;

      this.cardWidth = this.cards[0].offsetWidth + this.cards[0].offsetLeft;

      this.carousel.addEventListener('transitionend', () => {
        this.rescale();
      });
      this.rescale();
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

    this.dragging = undefined;

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
    
    this.carousel.addEventListener('mousemove', this.callbacks.onmove);
    this.carousel.addEventListener('touchmove', this.callbacks.onmove);
    
    this.carousel.addEventListener('touchend', this.callbacks.onend);
    this.carousel.addEventListener('mouseup', this.callbacks.onend);
    this.carousel.addEventListener('mouseleave', this.callbacks.onend);
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
      const currentTranslate = this.delta.x + this.lastTranslate - this.offset.x;

      this.translate(currentTranslate, 0, null);

      let cardMidpoint = (this.cards[this.index].getBoundingClientRect().left + this.cards[this.index].getBoundingClientRect().right) / 2;
      let viewportWidth = window.innerWidth;

      if(cardMidpoint <= 0 + this.SNAPPINESS) {
        // If card midpoint is close enough to left edge, decrement index
        this.index = Math.min(this.index+1, this.cards.length-1);
      } else if(cardMidpoint > viewportWidth - this.SNAPPINESS) {
        // If card midpoint is close enough to right edge, increment index
        this.index = Math.max(this.index-1, 0);
      }
    }
  }

  snap(nextIndex? : number, direction? : string) {
    if(direction) {
      direction == 'right' ? nextIndex = this.index+1 : nextIndex = this.index-1;
    }
    nextIndex = Math.min(Math.max(nextIndex, 0), this.cards.length - 1);
    this.index = nextIndex;

    const container = this.carousel.parentElement;
    const containerWidth = container.offsetWidth;
    const containerMargin = parseInt(window.getComputedStyle(container).marginLeft, 0);
  
    const card = this.cards[nextIndex];

    // Width of container - Width of card = All the extra space
    // Divide this by 2 to get desired distance from edge on either side of card
    const edgeToCardDist = (containerWidth - card.offsetWidth)/2;
    
    // Translating to the left of the desired card, minus our desired edge dist
    // Multiplied by -1 because we are translating to the right
    const nextOffset = Math.min((card.offsetLeft - edgeToCardDist + containerMargin) * -1, 0);

    // http://easings.net/#easeInOutCirc
    const ease = 'cubic-bezier(0.785, 0.135, 0.15, 0.86)';
    this.translate(nextOffset, 250, ease);
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

    this.dragging = undefined;

    // Snap to index, which has been set to the nearest card
    this.snap(this.index, undefined);

    this.rescale();
  }

  translate(x : number, length : number, fn : string) {
    this.carousel.style['transition'] = 'transform';
    this.carousel.style['transitionTimingFunction'] = fn;
    this.carousel.style['transitionDuration'] = `${length}ms`;
    this.carousel.style['transform'] = `translate3d(${x}px,0px,0px)`;

    this.rescale();
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
      this.cards[i].style['transitionDuration'] = `250ms`;
    }
  }
}
new AyCarousel(<HTMLElement>document.querySelector('#carousel-1'));
new AyCarousel(<HTMLElement>document.querySelector('#carousel-2'));
