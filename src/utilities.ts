// Roughly taken from MDN
export const assign = function(target, ...args) { // .length of function is 2
  args;
  if (target == null) { // TypeError if undefined or null
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var to = Object(target);

  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];

    if (nextSource != null) { // Skip over if undefined or null
      for (var nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
};


// Taken from Lymph Node Labyrinth (Copyright 2015 Ayogo Health Inc.)

interface IVelocityTween {
  target: any;
  targetValue: number;
  currentVelocity: number;
  duration: number;
  property: string;
  stopThreshold: number;
}

/**
 * Creates and manages tweens with a model of each property's velocity, with
 * the aim of ensuring a smooth motion curve, irrespective of irregularities in
 * the tween request schedule or target values.
 */
export class VelocityTweener {

  private _lastTime:number;
  private _tweens:IVelocityTween[] = [];

  constructor(time:number) {
    this._lastTime = time;
  }

  /**
   * Register new tween or update existing tween.
   * @param target: Object to receive tweening
   * @param property: Property to be tweened
   * @param targetValue: Destination value for the tweening
   * @param duration: Approximate time over which tween will run (milliseconds)
   * @param stopThreshold (optional): How close the current value must be to the target, and how small the velocity must be, before the tween is considered complete
   */
  public to(target:any, property:string, targetValue:number, duration:number, stopThreshold:number=0.01):void {
    duration = Math.max(0.01, duration);  //Avoid divisions by 0
    for (var i=0, l=this._tweens.length; i<l; i++) {
      if ((this._tweens[i].target === target) && (this._tweens[i].property === property)) {
        this._tweens[i].targetValue = targetValue;
        this._tweens[i].duration = duration;
        this._tweens[i].stopThreshold = stopThreshold;
        return;
      }
    }
    this._tweens.push({
      target: target,
      property: property,
      targetValue: targetValue,
      duration: duration,
      currentVelocity: 0,
      stopThreshold: stopThreshold
    });
  }

  /**
   * Set new current time and update currently running tweens.
   * @param currentTime: current date-time in milliseconds
   */
  public update(currentTime:number):void {
    if (this._tweens.length === 0) {
      this._lastTime = currentTime;
      return;
    }
    var deltaTime = currentTime - this._lastTime;
    for (var i=0, l=this._tweens.length; i<l; i++) {
      if (! VelocityTweener.updateTween(this._tweens[i], deltaTime)) {
        this._tweens.splice(i, 1);
        i--;
        l--;
      }
    }
    this._lastTime = currentTime;
  }

  /**
   * Offset the internal last recorded time without updating tweens. This is
   * useful for resuming from a pause without the long delta advancing tweens
   * past the intended timeline.
   * @param duration (milliseconds)
   */
  public offsetTime(duration:number):void {
    this._lastTime += duration;
  }

  /**
   * Update a single tween for the given delta time.
   * @param tween
   * @param deltaTime
   * @returns {boolean} true: still running; false: reached target
   */
  private static updateTween(tween:IVelocityTween, deltaTime:number):boolean {
    var durAdjust:number = 2 / tween.duration;
    var dtAdjust:number = durAdjust * deltaTime;
    var velAdjust:number = 1 / (1 + dtAdjust + (0.48 * dtAdjust * dtAdjust) + (0.235 * dtAdjust * dtAdjust * dtAdjust));

    var delta:number = tween.target[tween.property] - tween.targetValue;
    var adjustedTarget:number = tween.target[tween.property] - delta;

    var increment:number = (tween.currentVelocity + (durAdjust * delta)) * deltaTime;
    var newValue:number = adjustedTarget + ((delta + increment) * velAdjust);

    tween.currentVelocity = (tween.currentVelocity - (durAdjust * increment)) * velAdjust;

    if ((Math.abs(tween.target[tween.property] - newValue) < tween.stopThreshold) && (Math.abs(tween.currentVelocity) < tween.stopThreshold)) {
      tween.target[tween.property] = tween.targetValue;
      return false;
    }

    tween.target[tween.property] = newValue;
    return true;
  }

  /**
   * Cancel a single property tween, optionally completing it, and otherwise
   * leaving it mid tween.
   * @param target
   * @param property
   * @param complete (optional)
   */
  public cancelPropertyTween(target:any, property:string, complete:boolean=false):void {
    for (var i=0, l=this._tweens.length; i<l; i++) {
      if ((this._tweens[i].target === target) && (this._tweens[i].property === property)) {
        if (complete) {
          this._tweens[i].target[property] = this._tweens[i].targetValue;
        }
        this._tweens.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Cancel all property tweens of the specified target, optionally completing
   * them, and otherwise leaving them mid tween.
   * @param target
   * @param complete (optional)
   */
  public cancelAllTweensOf(target:any, complete:boolean=false):void {
    for (var i=0, l=this._tweens.length; i<l; i++) {
      if (this._tweens[i].target === target) {
        if (complete) {
          this._tweens[i].target[this._tweens[i].property] = this._tweens[i].targetValue;
        }
        this._tweens.splice(i, 1);
        i--;
        l--;
      }
    }
  }

  public get animating():boolean {
    return this._tweens.length > 0;
  }

}
