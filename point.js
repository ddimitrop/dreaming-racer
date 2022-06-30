/** A point in 2D space */
class Point {
  // It is an "immutable point" (can't change its x and y after creating it it).

  // In the ES6 version of javascript were "#" means "private":
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#private_field_declarations
  #x = null;
  #y = null;

  constructor(x, y) {
    this.#x = x;
    this.#y = y;
  }

  get x() {
    return this.#x;
  }

  get y() {
    return this.#y;
  }

  toString() {
    return `x: ${this.x} y: ${this.y}`;
  }

  equal(another) {
    return this.x == another.x && this.y == another.y;
  }

  /** Distance with another point - thanks to Pythagoras :) */
  distance(another) {
    let distx = this.x - another.x;
    let disty = this.y - another.y;
    return Math.sqrt(distx * distx + disty * disty);
  }

  /**
   * Angle that is defined by this point and another point with the
   * horizontal axis.
   */
  angle(another, nonReflex) {
    let angle = Math.atan2(another.y - this.y , another.x - this.x);
    if (nonReflex) {
      angle = Point.nonReflex(angle);
    }
    return angle;
  }

  /** Returns the non reflext equivalent of an angle */
  static nonReflex (angle) {
    if (angle < -Math.PI) {
      return 2 * Math.PI + angle;
    }
    if (angle > Math.PI) {
      return angle - 2 * Math.PI;
    }
    return angle;
  }

  /** Angle that is defined by this point and 2 other points (prev, next). */
  angleBetween(prev, next) {
    return (this.angle(next) - this.angle(prev) + 2 * Math.PI) % (2 * Math.PI);
  }

  /** if this point is enclosed in the triangle defined by t1, t2 ans t3 */
  isEnclosed(t1, t2, t3) {
    // For each point find the angles with the other 2.
    // Then make sure that the angle with "this point" is in between.
    let triangle = [t1, t2, t3];
    for (let i = 0; i < 3; i++) {
      let t = triangle[i];
      let tp = triangle[i == 0 ? 2 : i-1];
      let tn = triangle[i == 2 ? 0 : i+1];
      let ap = t.angle(tp, true);
      let an = t.angle(tn, true);
      let at = t.angle(this, true);
      let apn = Point.nonReflex(ap - an);
      let apt = Point.nonReflex(ap - at);
      if (Math.abs(apn) < Math.abs(apt)) return false;
    }
    return true;
  }

  static makeRandom(spaceX, spaceY) {
    let randomX = Math.round(Math.random() * 2 * spaceX - spaceX);
    let randomY = Math.round(Math.random() * 2 * spaceY - spaceX);
    return new Point(randomX, randomY);
  }

  round() {
    return new Point(Math.round(this.x), Math.round(this.y));
  }

  getSvg(className, radious) {
    let x = this.x;
    let y = this.y;
    radious = radious || 1;
    return `<circle class="${className}" cx="${x}" cy="${y}" r="${radious}"/>`;
  }
}
