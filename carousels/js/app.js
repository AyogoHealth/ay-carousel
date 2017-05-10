
let dragging;
let offset;
let startX = 0;
let delta = {};
let position;
let currentTranslate;

function init() {
  carousels = document.getElementsByClassName('carousel');
  for(let i = 0; i < carousels.length; i++) {
    carousel = carousels[i];
    
    carousel.addEventListener('click', onclick);
    carousel.addEventListener('touchstart', ondragstart);
    carousel.addEventListener('mousedown', ondragstart);
  }
}

function ondragstart(e) {
  const touches =  e.touches ? e.touches[0] : e;
  const {pageX, pageY} = touches;

 
  if(currentTranslate === undefined) {
    currentTranslate = 0;
  } else {
    currentTranslate = (delta.x - offset.x + currentTranslate) || 0;
  }
  
  offset = {
    x: pageX,
    y: pageY
  };

  delta = {};

  position = {
    x: carousel.offsetLeft,
    y: carousel.offsetTop
  };

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
  
    const xTranslate = delta.x - offset.x + currentTranslate;
    
    translate(xTranslate, 0, null);
  }
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