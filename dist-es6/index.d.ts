declare class AyCarousel {
    dragging: boolean;
    offset: any;
    startX: number;
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
    constructor(carousel: HTMLElement);
    ondragstart(e: any): void;
    ondragmove(e: any): void;
    move(nextIndex: any, direction: any): void;
    ondragend(e: any): void;
    onclick(e: any): void;
    translate(x: any, length: any, fn: any): void;
    percentVisible(card: any): number;
    rescale(): void;
}
