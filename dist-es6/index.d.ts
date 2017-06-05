export default class AyCarousel {
    offset: any;
    startX: number;
    startY: number;
    delta: any;
    position: any;
    currentTranslate: number;
    lastTranslate: number;
    callbacks: any;
    cards: HTMLElement[];
    cardWidth: number;
    index: number;
    carousel: HTMLElement;
    totalMove: any;
    lastPos: any;
    dots: HTMLElement[];
    amplitude: any;
    velocity: any;
    frame: any;
    elapsed: any;
    timestamp: number;
    previousTranslate: number;
    target: any;
    closestCard: any;
    velocityInterval: any;
    config: any;
    viewportWidth: any;
    carouselParent: any;
    constructor(carousel: HTMLElement, config?: any);
    handleResize(): void;
    ondragstart(e: any): void;
    calcVelocity(): number;
    momentumScroll(stopPoint: any): void;
    ondragmove(e: any): void;
    calculateIndex(position?: any): number;
    ondotclick(i: any): void;
    ondotkey(e: any, i: any): void;
    setIndex(index: number): void;
    snap(nextIndex?: number, direction?: string): void;
    ondragend(e: any): void;
    translate(x: number, length: number, fn?: string): void;
    percentVisible(card: HTMLElement): number;
    rescale(): void;
    calcOS(i: any): number;
    setupConfig(config?: any): any;
}
