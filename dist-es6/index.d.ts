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
    dots: HTMLElement[];
    constructor(container: HTMLElement);
    ondragstart(e: any): void;
    ondragmove(e: any): void;
    ondotclick(e: any, i: any): void;
    setIndex(index: number): void;
    snap(nextIndex?: number, direction?: string): void;
    ondragend(e: any): void;
    translate(x: number, length: number, fn: string): void;
    percentVisible(card: HTMLElement): number;
    rescale(): void;
}
