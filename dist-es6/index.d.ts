export default class AyCarousel {
    static documentStyleAdded: boolean;
    startX: number;
    startY: number;
    initialIndex: number;
    initialIndexSetOnce: boolean;
    currentTranslate: number;
    lastTranslate: number;
    callbacks: any;
    cards: HTMLElement[];
    cardWidth: number;
    index: number;
    carousel: HTMLElement;
    dotContainer: HTMLUListElement;
    dots: HTMLLIElement[];
    totalMove: any;
    lastPos: any;
    amplitude: number;
    velocity: number;
    frame: any;
    timestamp: number;
    target: any;
    velocityInterval: any;
    config: any;
    carouselParent: any;
    resizeTimeoutId: number;
    destroyed: boolean;
    constructor(carousel: HTMLElement, config?: any, initialIndex?: number);
    updateItems(): void;
    handleResize(snap?: boolean): void;
    followUpResize(snap?: boolean): void;
    onDragStart(e: any): void;
    calcVelocity(): number;
    momentumScroll(stopPoint: any): void;
    onDragMove(e: any): void;
    calculateIndex(): number;
    onDotClick(e: any): void;
    onDotKey(e: any): void;
    setIndex(index: number): void;
    snap(nextIndex?: number, direction?: string, instant?: boolean): void;
    onDragEnd(): void;
    translate(x: number, length: number, fn?: string, updateIndex?: boolean): void;
    proportionVisible(index: number): number;
    rescale(): void;
    calcOS(i: any): number;
    cleanUp(): void;
    removeDots(includingContainer?: boolean): void;
    setupConfig(config?: any): any;
}
