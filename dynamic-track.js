function init() {
}

/**
 * A track is an area of 2D space defined by an inner loop and an outer loop.
 * A dynamic track is a track where the loop shapes can change.
 */

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
  angle(another) {
    return Math.atan2(another.y - this.y , another.x - this.x);
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
      let ap = t.angle(tp);
      let an = t.angle(tn);
      let at = t.angle(this);
      if (at < 0 && ap == Math.PI) ap = -Math.PI;
      if (at < 0 && an == Math.PI) an = -Math.PI;
      let amn = Math.min(ap, an);
      let amx = Math.max(ap, an);
      if (at < amn || at > amx) return false;
    }
    return true;
  }

  static makeRandom(spaceX, spaceY) {
    let randomX = Math.random() * 2 * spaceX - spaceX;
    let randomY = Math.random() * 2 * spaceY - spaceX;
    return new Point(randomX, randomY);
  }
}

/**
 * A line defined by a starting point, and an ending point
 */
class Line {
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

  equal(another) {
    return this.start.equal(another.start) && this.end.equal(another.end);
  }

  /** Returns the reverse line where start is end and vice versa */
  reverse() {
    return new Line(this.end, this.start);
  }

  getSvg(id) {
    let start = this.start;
    let end = this.end;
    return `<line id="${id}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
  }

  /**
   * If another line intersects with this.
   */
  intersects(another) {
    if (another == this) return false;
    if (another.angle == this.angle) return false; // Parallel
    // Find a1 and b1 for first line (this) where y = a1 * x + b1
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
            (this.end.x <= xi && xi <= this.start.x)) && // For this line
           ((another.start.x <= xi && xi <= another.end.x) ||
            (another.end.x <= xi && xi <= another.start.x)); // and the other line.

  }

  static makeRandom(spaceX, spaceY) {
    let randomStart = Point.makeRandom(spaceX, spaceY);
    let randomEnd = Point.makeRandom(spaceX, spaceY);
    return new Line(randomStart, randomEnd);
  }
}

/**
 * A loop is a list of lines each connected to its next (the end of previous is
 * start of the next) and end of last is the start of the first).
 * Also none of the lines can ever intersect.
 * The order of lines should be such so that most of the angles that are formed
 * are not reflex i.e. < PI (clockwise).
 * Otherwise the order of lines in the array gets reversed.
 */
class Loop {
  #lines = null;
  reportErrors = true;

  constructor(lines) {
    this.#lines = lines;
    if (!this.isValid()) {
      if (this.reportErrors)
        console.assert(false, `Lines of loop are not valid`);
      throw `Lines of loop are not valid`;
    }
    if(this.nonReflexIndexes().length < this.#lines.length / 2) {
      this.#lines = this.#lines.reverse();
      for (let i=0; i < this.#lines.length; i++) {
        this.#lines[i] = this.#lines[i].reverse();
      }
    }
  }

  get lines() {
    return this.#lines;
  }

  /** Returns the lines at position i (prev, current, next) */
  linesAt(i) {
    let line = this.#lines[i];
    let numLines = this.#lines.length;
    let next = i != numLines - 1 ? this.#lines[i+1]: this.#lines[0];
    let prev = i != 0 ? this.#lines[i-1]: this.#lines[numLines - 1];
    return [prev, line, next];
  }

  /** Returns the points that define angle i : i.start, i.end, i+1.end */
  pointsAt(i) {
    let [prev, line, next] = this.linesAt(i);
    return [line.start, line.end, next.end];
  }

  /** Returns the angle defined by the end of the ith line */
  angleAt(i) {
    let [prev, point, next] = this.pointsAt(i);
    return point.angleBetween(prev, next);
  }

  /** Returns in the angle at i is nonReflex (range 0 .. PI) */
  isNonReflex(i) {
    let angle = this.angleAt(i);
    return (angle >= 0 && angle <= Math.PI);
  }

  /** Returns the number of non-reflex angles in range 0 .. PI */
  nonReflexIndexes() {
    let numNonReflex = [];
    for (let i=0; i < this.#lines.length; i++) {
      if (this.isNonReflex(i)) {
        numNonReflex.push(i);
      }
    }
    return numNonReflex;
  }

  isValid() {
    for (let i=0; i < this.#lines.length; i++) {
      let [prev, line, next] = this.linesAt(i);

      if(!line.end.equal(next.start)) {
        if (this.reportErrors)
          console.assert(false, `Line ${i} not connected`);
        return false;
      }
      for (let j=0; j < this.#lines.length; j++) {
        let another = this.#lines[j];
        if (another == line || another == next || another == prev) continue;
        if(line.intersects(another)) {
          if (this.reportErrors)
            console.assert(false, `Line ${i} intersects ${j}`);
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Returns if the point is enclosed in the loop. For loops with non-reflex
   * angles this is easy: split the area in trianges by starting from a constant
   * point and make triangles for each line. The point should be enclosed in one
   * of them.
   *
   * For the general case (includes reflex angles), filter all reflex angles
   * (outer shape) and repeat like above. But also ensure that the point is
   * not enclosed in the reverse area defined by the reflex angles.
   */
  encloses(point) {
    let nonReflex = this.nonReflexIndexes();
    let constPoint = this.#lines[nonReflex[0]].end;
    let wasFoundEnclosed = false;
    // Look for been enclosed at the outer shape made of non-reflex angles.
    for (let i = 0 ; i < nonReflex.length; i++) {
      let line = this.#lines[nonReflex[i]];
      if (!line.start.equal(constPoint) && !line.end.equal(constPoint)) {
        if(point.isEnclosed(constPoint, line.start, line.end)) {
          wasFoundEnclosed = true;
          break;
        }
      }
    }
    if (!wasFoundEnclosed) return false;

    // Now ensure that the point is not enclosed in areas defined by smaller
    // loops around reflex angles.
    let lastNonReflex = null;
    for (let i = this.#lines.length - 1; i >=0; i++) {
      if (this.isNonReflex(i)) {
        lastNonReflex = i;
        break;
      }
    }

    for (let i=0; i < this.#lines.length; i++) {
      if (this.isNonReflex(i)) {
        // Make smaller loops by the lines arround consecutive reflex angles
        // and ensure that the point is not enclosed inside them.
        if(lastNonReflex != (i - 1 + this.#lines.length)%this.#lines.length) {
          let lines = [];
          for (let j = lastNonReflex + 1;
               j != (i + 1)% this.#lines.length;
               j = (j + 1) % this.#lines.length) {
            lines.push(this.#lines[j]);
          }
          lines.push(new Line(this.#lines[i].end, this.#lines[lastNonReflex].end));
          let exclusionLoop = new Loop(lines);
          if (exclusionLoop.encloses(point)) {
            return false;
          }
        }
        lastNonReflex = i;
      }
    }
    return true;
  }

  getSvg(id) {
    let start = this.start;
    let end = this.end;
    let d = "";
    for (let i=0; i < this.#lines.length; i++) {
      let [,p,] = this.pointsAt(i);
      if (i == 0) {
        d = `M ${p.x} ${p.y} `;
      } else {
        d += `L ${p.x} ${p.y} `;
      }
    }
    return `<path id="${id}" d="${d}"/>`;
  }
}

/** A race track has an outter bountary loop and an inner boundary loop. */
// TODO
class RaceTrack {
  constructor() {
    this.outerBound = [];
    this.innerBound = [];
  }
}

// TODO
class RandomTrack extends RaceTrack {

}

// TODO
class DynamicTrack extends RandomTrack {

}
