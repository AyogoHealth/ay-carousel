declare class AyCarousel {
    dragging: boolean;
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
    readonly SNAPPINESS: number;
    totalMove: any;
    lastPos: any;
    constructor(carousel: HTMLElement);
    ondragstart(e: any): void;
    ondragmove(e: any): void;
    snap(nextIndex: any, direction: any): void;
    ondragend(e: any): void;
    translate(x: any, length: any, fn: any): void;
    percentVisible(card: any): number;
    rescale(): void;
}
