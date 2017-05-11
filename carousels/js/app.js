
let dragging;
let offset;
let startX = 0;
let delta = {};
let position;
let currentTranslate;
let lastTranslate;
let cards;
let cardWidth;
let index = 0;

function init() {
  carousels = document.getElementsByClassName('carousel');
  for(let i = 0; i < carousels.length; i++) {
    carousel = carousels[i];
    
    carousel.addEventListener('click', onclick);
    carousel.addEventListener('touchstart', ondragstart);
    carousel.addEventListener('mousedown', ondragstart);

    cards = carousel.children;
    cardWidth = cards[0].offsetWidth + cards[0].offsetLeft;
  }
}

function ondragstart(e) {
  const touches =  e.touches ? e.touches[0] : e;
  const {pageX, pageY} = touches;

  const boundingRect = cards[index].getBoundingClientRect();
  offset = {
    x: pageX - boundingRect.left,
    y: pageY - boundingRect.top
  };

  delta = {};

  position = {
    x: carousel.offsetLeft,
    y: carousel.offsetTop
  };

  // TODO: figure out why this needs to be subtracted by 70 :s
  lastTranslate = carousel.getBoundingClientRect().left - 70;

  startX = e.pageX;
  dragging = undefined;

  carousel.addEventListener('mousemove', ondragmove);
  carousel.addEventListener('touchmove', ondragmove);
  
  carousel.addEventListener('touchend', ondragend);
  carousel.addEventListener('mouseup', ondragend);
  carousel.addEventListener('mouseleave', ondragend);
}

function ondragmove(e) {
  const touches =  e.touches ? e.touches[0] : e;
  const {pageX, pageY} = touches;


  delta = {
    x: pageX - position.x,
    y: pageY - position.y
  };

  if(typeof dragging === 'undefined') {
    dragging = !(dragging || Math.abs(delta.x) < Math.abs(delta.y));
  } else if(!dragging) {
    dragging = Math.abs(delta.x) > Math.abs(delta.y);
  }

  if(dragging && offset) {
    e.preventDefault();
    
    const currentTranslate = delta.x + lastTranslate - offset.x;

    translate(currentTranslate, 0, null);
    
    index = Math.min(Math.max(Math.round((-currentTranslate)/cardWidth), 0), cards.length-1);
  }
}

function move(nextIndex) {
  nextIndex = Math.min(Math.max(nextIndex, 0), cards.length - 1);

  let nextOffset = Math.min((cards[nextIndex].offsetLeft-50) * -1, 0);

  // http://easings.net/#easeInOutCirc
  const ease = 'cubic-bezier(0.785, 0.135, 0.15, 0.86)';
  translate(nextOffset, 500, ease);
}

function ondragend(e) {
  position = {
    x: e.target.offsetLeft,
    y: e.target.offsetTop
  };

  carousel.removeEventListener('mousemove', ondragmove);
  carousel.removeEventListener('touchmove', ondragmove);
  carousel.removeEventListener('touchend', ondragend);
  carousel.removeEventListener('mouseup', ondragend);
  carousel.removeEventListener('mouseleave', ondragend);

  dragging = undefined;
  move(index);
}

function onclick(e) {
  if(delta.x) {
    e.preventDefault();
  }
}

function translate(x, length, fn) {
  carousel.style['transitionTimingFunction'] = fn;
  carousel.style['transitionDuration'] = `${length}ms`;
  carousel.style['transform'] = `translate3d(${x}px,0px,0px)`;
}

init();
