class AyCarousel {
  dragging : boolean;
  offset : any;
  startX : number = 0;
  delta : any;
  position : any;
  currentTranslate : number;
  lastTranslate : number;


  callbacks : any = {};

  cards : HTMLElement[];
  cardWidth : number;
  index : number = 0;
  carousel : HTMLElement;

  SNAPPINESS : number = 40;

  constructor() {
    this.carousel = <HTMLElement>document.querySelector('.carousel');
    
    this.carousel.addEventListener('click', e => this.onclick(e));
    this.carousel.addEventListener('touchstart', e => this.ondragstart(e));
    this.carousel.addEventListener('mousedown', e => this.ondragstart(e));

    this.cards = <any>this.carousel.children;

    this.cardWidth = this.cards[0].offsetWidth + this.cards[0].offsetLeft;

    this.carousel.addEventListener('transitionend', () => {
      this.rescale();
    });
    this.rescale();
    
    document.getElementById('right').addEventListener('click', this.move.bind(this, undefined, 'right'));
    document.getElementById('left').addEventListener('click', this.move.bind(this, undefined, 'left'));   
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

    this.startX = e.pageX;
    this.dragging = undefined;

    this.callbacks.onmove = e => this.ondragmove(e);
    this.callbacks.onend = e => this.ondragend(e);
    
    this.carousel.addEventListener('mousemove', this.callbacks.onmove);
    this.carousel.addEventListener('touchmove', this.callbacks.onmove);
    
    this.carousel.addEventListener('touchend', this.callbacks.onend);
    this.carousel.addEventListener('mouseup', this.callbacks.onend);
    this.carousel.addEventListener('mouseleave', this.callbacks.onend);
  }

  ondragmove(e) {
    const touches =  e.touches ? e.touches[0] : e;
    const {pageX, pageY} = touches;

    this.delta = {
      x: pageX - this.position.x,
      y: pageY - this.position.y
    };

    if(typeof this.dragging === 'undefined') {
      this.dragging = !(this.dragging || Math.abs(this.delta.x) < Math.abs(this.delta.y));
    } else if(!this.dragging) {
      this.dragging = Math.abs(this.delta.x) > Math.abs(this.delta.y);
    }

    if(this.dragging && this.offset) {
      e.preventDefault();
      
      const currentTranslate = this.delta.x + this.lastTranslate - this.offset.x;

      this.translate(currentTranslate, 0, null);

      let cardMidpoint = (this.cards[this.index].getBoundingClientRect().left + this.cards[this.index].getBoundingClientRect().right) / 2;
      let viewportWidth = window.innerWidth;

      if(cardMidpoint <= 0 + this.SNAPPINESS) {
        this.index = Math.min(this.index+1, this.cards.length-1);
      } else if(cardMidpoint > viewportWidth - this.SNAPPINESS) {
        this.index = Math.max(this.index-1, 0);
      }
    }
  }

  move(nextIndex, direction) {
    if(direction) {
      direction == 'right' ? nextIndex = this.index+1 : nextIndex = this.index-1;
    }
    nextIndex = Math.min(Math.max(nextIndex, 0), this.cards.length - 1);
    this.index = nextIndex;
    const containerWidth = this.carousel.parentElement.offsetWidth;
    const edgeToCardDist = (containerWidth - this.cards[this.index].offsetWidth)/2;
    let nextOffset = Math.min((this.cards[nextIndex].offsetLeft- edgeToCardDist) * -1, 0);

    // http://easings.net/#easeInOutCirc
    const ease = 'cubic-bezier(0.785, 0.135, 0.15, 0.86)';
    this.translate(nextOffset, 300, ease);
  }

  ondragend(e) {
    this.position = {
      x: e.target.offsetLeft,
      y: e.target.offsetTop
    };

    this.carousel.removeEventListener('mousemove', this.callbacks.onmove);
    this.carousel.removeEventListener('touchmove', this.callbacks.onmove);
    
    this.carousel.removeEventListener('touchend',this.callbacks.onend);
    this.carousel.removeEventListener('mouseup', this.callbacks.onend);
    this.carousel.removeEventListener('mouseleave', this.callbacks.onend);

    this.dragging = undefined;
    this.move(this.index, undefined);

    this.rescale();
  }

  onclick(e) {
    if(this.delta.x) {
      e.preventDefault();
    }
  }

  translate(x, length, fn) {
    this.carousel.style['transition'] = 'transform';
    this.carousel.style['transitionTimingFunction'] = fn;
    this.carousel.style['transitionDuration'] = `${length}ms`;
    this.carousel.style['transform'] = `translate3d(${x}px,0px,0px)`;

    this.rescale();
  }

  percentVisible(card) {
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
      let scaler = Math.max(this.percentVisible(this.cards[i]), 0.8);



      this.cards[i].style['transform'] = `scale(${scaler})`;
      this.cards[i].style['transitionTimingFunction'] = 'ease';
      this.cards[i].style['transitionDuration'] = `250ms`;
    }
  }
}
new AyCarousel();