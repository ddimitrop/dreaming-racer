/**
 * A vector defined by a starting point, and an ending point
 */
class Vector {
  #start = null;
  #distance = null;
  #angle = null;
  #end = null;

  constructor(start, end) {
    this.#start = start;
    this.setEnd(end);
  }

  get start() {
    return this.#start;
  }

  get end() {
    return this.#end;
  }

  get distance() {
    return this.#distance;
  }

  get angle() {
    return this.#angle;
  }

  /**
   * Returns the points of the line segment that corresponds to the vector.
   * This is 'start' and 'end' but ordered by snallest 'x'.
   */
  getOrderedPoints() {
    if(this.start.x <= this.end.x) {
      return [this.start, this.end];
    } else {
      return [this.end, this.start];
    }
  }

  /** The slope a of equation y = a * x + b that passes from the 2 points */
  get slope() {
    let [p1, p2] = this.getOrderedPoints();
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    return dy / dx;
  }

  /** The offset b of equation y = a * x + b that passes from the 2 points */
  get offset() {
    if (this.slope == Infinity) return this.start.y;
    return this.start.y - this.slope * this.start.x;
  }

  setStart(start) {
    this.#start = start;
    this.#end = this.calcEnd();
  }

  setDistance(distance) {
    this.#distance = distance;
    this.#end = this.calcEnd();
  }

  setAngle(angle) {
    this.#angle = angle;
    this.#end = this.calcEnd();
  }

  toString() {
    return `start: ${this.start} end: ${this.end} distance: ${this.distance} angle: ${this.angle}`;
  }

  changeAngleBy(pc) {
    this.setAngle((this.angle + pc * Math.PI) % Math.PI);
  }

  // Caching the end point to avoid the cost of redoi ng the Math.
  calcEnd() {
    return new Point(
      this.start.x + this.#distance * Math.cos(this.angle),
      this.start.y + this.#distance * Math.sin(this.angle)
    );
  }

  setEnd(end) {
    this.#end = end;
    this.#distance = this.#start.distance(end);
    this.#angle = this.#start.angle(end);
  }

  setStart(start) {
    this.#start = start;
    this.#distance = this.#start.distance(this.#end);
    this.#angle = this.#start.angle(this.#end);
  }

  equal(another) {
    return this.start.equal(another.start) && this.end.equal(another.end);
  }

  /** Returns the reverse vector where start is end and vice versa */
  reverse() {
    return new Vector(this.end, this.start);
  }

  getSvg(className) {
    let start = this.start;
    let end = this.end;
    return `<line class="${className}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
  }

  /**
   * If another vector intersects with this.
   */
  intersects(another) {
    if (another == this) return false;
    if (another.angle == this.angle) return false; // Parallel
    // Find a1 and b1 for first vector (this) where y = a1 * x + b1
    // That is:
    // start.y = a1 * start.x + b1 and
    // end.y = a1 * end.x + b1
    let a1 = (this.end.y - this.start.y) / (this.end.x - this.start.x);
    let b1 = this.start.y - a1 * this.start.x;
    // Now the same for "another"
    let a2 = (another.end.y - another.start.y) / (another.end.x - another.start.x);
    let b2 = another.start.y - a2 * another.start.x;
    if (a1 == a2) return false; // Parallel
    // Now find the intesection point where
    // i.y = a1 * i.x + b1 and  i.y = a2 * i.x + b2
    let xi = (b1-b2) / (a2-a1);
    // We have start.y = b1
    if (Math.abs(a1) == Infinity) xi = this.start.x;
    // Same for another
    if (Math.abs(a2) == Infinity) xi = another.start.x;
    let yi = a1 * xi + b1;
    // Now the intersection point should be within range of start and end.
    return ((this.start.x <= xi && xi <= this.end.x) ||
            (this.end.x <= xi && xi <= this.start.x)) && // For this vector
           ((another.start.x <= xi && xi <= another.end.x) ||
            (another.end.x <= xi && xi <= another.start.x)); // and the other vector.

  }

  /** Returns the point on the line of vector that is closest to 'point' */
  getLineClosest(point) {
    // Vector is horizontal
    if (this.slope == 0) {
      return new Point(point.x, this.start.y);
    // Vector is vertical
    } else if (this.slope == Infinity) {
      return new Point(this.start.x, point.y);
    }
    // The slope of lines that are orthogonal to the line of the vector.
    let oSlope = -1 / this.slope;
    // The offset of the orthogonal line that passes from point;
    let oOffset = point.y - oSlope * point.x;
    // Now we need the intersection point of the vectors line and the orthogonal.
    // iy = slope * ix + offset  and
    // iy = oSlope * ix + oOffset     =>
    // ix (slope - oslope)  + offset - oOffset = 0   =>
    let ix = (oOffset - this.offset) / (this.slope - oSlope);
    let iy = this.slope * ix + this.offset;
    return new Point(ix, iy);
  }

  /** Returns the point of the vector that is closest to 'point' */
  getClosest(point) {
    let lineClosest = this.getLineClosest(point);
    let [p1, p2] = this.getOrderedPoints();
    if (lineClosest.x < p1.x) {
      return p1;
    } else if (lineClosest.x > p2.x) {
      return p2;
    }
    return lineClosest;
  }

  /** Returns the min distance of point to any point of the vector */
  getDistanceFrom(point) {
    return point.distance(this.getClosest(point));
  }

  static makeRandom(spaceX, spaceY) {
    let randomStart = Point.makeRandom(spaceX, spaceY);
    let randomEnd = Point.makeRandom(spaceX, spaceY);
    return new Vector(randomStart, randomEnd);
  }
}
