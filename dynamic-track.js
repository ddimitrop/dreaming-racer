function initDynamicLoop() {
  let space = 600;
  let component = Loop.makeDynamic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    10 /* lines */,
    0.3 /* initLinesPc */,
    space / 10 /* initLinesVar */,
    0.5 /* dynamicLinesPc */,
    space / 20 /* dynamicLinesVar */,
    10 /* historyTrack */);
}

function initDynamicRaceTrack() {
  let space = 600;
  let component = RaceTrack.makeDynamic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    /*4, //*/10 /* lines */,
    /*0, //*/0.3 /* initLinesPc */,
    /*0, //*/space / 10 /* initLinesVar */,
    0.5 /* dynamicLinesPc */,
    space / 20 /* dynamicLinesVar */,
    10 /* historyTrack */);
}

function onReady(cb) {
  window.addEventListener('DOMContentLoaded', cb);
}

function asTimePasses(cb) {
  window.setInterval(cb, 200);
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

  /** Returns if the polygon is convex */
  isConvex() {
    for (let i=0; i < this.#lines.length; i++) {
      if (!this.isNonReflex(i)) {
        let [prev, point, next] = this.pointsAt(i);
        let angle = point.angleBetween(prev, next);
        return false;
      }
    }
    return true;
  }

  /** Returns if the polygon has all angles > angle */
  allAnglesGreater(angle) {
    for (let i=0; i < this.#lines.length; i++) {
      if (this.angleAt(i) < angle) {
        return false;
      }
    }
    return true;
  }

  /** Returns if the polygon has all angles < angle */
  allAnglesLess(angle) {
    for (let i=0; i < this.#lines.length; i++) {
      if (this.angleAt(i) > angle) {
        return false;
      }
    }
    return true;
  }

  /** Returns the minimum distance between any 2 points */
  minDistance() {
    let minDistance = Infinity;
    for (let k=0; k < this.#lines.length; k++) {
      let startPoint = this.#lines[k].start;
      for (let i=0; i < this.#lines.length - 1; i++) {
        let n = (i + k) % this.#lines.length;
        let dist = startPoint.distance(this.#lines[n].end);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }
    }
    return minDistance;
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

  /** Returns if all points of the loop are enclosed by the other loop */
  enclosedIn(otherLoop) {
    for (let i = 0; i < this.#lines.length; i++) {
      let point = this.#lines[i].end;
      if (!otherLoop.encloses(point)) {
        if (this.reportErrors)
          console.assert(false, `Point ${i} ${point} not enclosed in other loop`);
        return false;
      }
    }
    return true;
  }

  getSvg(id) {
    let start = this.start;
    let end = this.end;
    let d = "";
    let cd = "";
    for (let i=0; i < this.#lines.length; i++) {
      let [,p,] = this.pointsAt(i);
      if (i == 0) {
        d = `M ${p.x} ${p.y} `;
      } else {
        d += `L ${p.x} ${p.y} `;
      }
    }
    d += 'z';
    return `<path id="${id}" d="${d}"/>`;
  }

  /**
   * Will generate a random loop in the square space of size space x space.
   * The var parameters is the percentage (0..1) or randomness that we want
   * on number of lines, and coordinates.
   * Validation is a check on points to ensure that they adhere to required rules.
   */
  static makeRandom(space, spaceToUse, lines, linesVar, posVar, validation) {
    lines = Math.round(lines * (1 - linesVar) + Math.random() * lines * linesVar);
    let initValidation = validation;
    if (validation == undefined) validation = Loop.isInSpace(space);
    // Start by making a polygon of "lines" lines
    let angleInc = 2 * Math.PI / lines;
    let angle = 0;
    // Get lines from the center to the perimeter of the circle
    // that covers 80% of the space to make a symmetric polygon.
    // Start fom the horizontal axis
    let nextD = new Line(new Point(0, 0), new Point(0, 0));
    nextD.setDistance(spaceToUse);
    nextD.setAngle(angle);
    let initP = nextD.end.round();
    let nextP = initP;
    let allLines = [];
    for (let i = 0; i < lines -1 ; i++) {
      angle += angleInc;
      nextD.setAngle(angle);
      let upcomingNextD = nextD.end.round();
      let nextL = new Line(nextP, upcomingNextD);
      allLines.push(nextL);
      nextP = upcomingNextD;
    }
    allLines.push(new Line(nextP, initP));
    let loop = new Loop(allLines);
    loop.addRandomness(1, posVar, space, initValidation);
    return loop;
  }

  /** Add some randomness according to params to linesVar percentage of lines */
  addRandomness(linesVar, posVar, space, validation) {
    if(!validation) validation = Loop.inSpaceNonFlat(space / 2, this);

    this.reportErrors = false;
    for (let i = 0; i < this.#lines.length ; i++) {
      if (Math.random() > linesVar) continue;
      let line = this.#lines[i];
      let next = this.#lines[(i+1) % this.#lines.length];
      Loop.addRandomnessInLine(line, next, posVar, validation);
    }
    this.reportErrors = true;
  }

  /** Add some randomness according to params to the end of line */
  static addRandomnessInLine(line, next, posVar, validation) {
    let prevEnd = line.end;
    // Keep retrying until the variation keep things valid.
    let minDiff = posVar * 0.3;
    let tries = 0;
    // Avoid infinite loops.
    while (tries++ < 5) {
      let newX = prevEnd.x + Math.round(Math.random() * posVar - posVar/2);
      let newY = prevEnd.y + Math.round(Math.random() * posVar - posVar/2);
      let newEnd = new Point(newX, newY);
      let dist = prevEnd.distance(newEnd);
      // Ensure that there is enough change and we don't stabilize.
      let enoughVariation = dist > minDiff;
      line.setEnd(newEnd);
      next.setStart(line.end);
      let isValid = validation(line.end);
      if (isValid && enoughVariation) {
         return true;
      } else {
        line.setEnd(prevEnd);
        next.setStart(line.end);
      }
    }
    return false;
  }

  static isInSpace(space) {
    return (point) => point.x > -space + 20 && point.x < space - 20 &&
                      point.y > -space + 20 && point.y < space - 20;
  }

  /**
   * Ensures that the loop has good shape. No angle is too small and the polygon
   * area is not too small (all points are quite far from each other).
   */
  static hasGoodShape(space, loop, angle, minDistAllowed) {
    let isInSpaceFunc = Loop.isInSpace(space, loop);
    return (point) => {
      let isInSpace = isInSpaceFunc(point);
      let isValid = loop.isValid();
      let allAnglesGreater = loop.allAnglesGreater(angle);
      let allAnglesLess = loop.allAnglesLess(2 * Math.PI - angle);
      let minDistance = loop.minDistance();
      let hasMinDistance = minDistance > minDistAllowed;
      return isInSpace && isValid &&
             allAnglesGreater && allAnglesLess && hasMinDistance;
    };
  }

  /** Returns a validation check that the polygon has good area */
  static inSpaceNonFlat(space, loop) {
    return Loop.hasGoodShape(space, loop , Math.PI/8, space/10);
  }

  /**
   * Return a random dynamic loop component.
   * space: The space x space area (in pixels) where the loop will exist
   * spaceToUse: The space to use for the initial canonical polygon
   * lines: The default initial number of lines of the loop
   * initLinesPc: The percentage (0-1) variation from 'lines' in the number of lines
   * initLinesVar: The initial random variation (in pixels) for the corner points
   *               of the polygon from the perfect symmetric polygon.
   * dynamicLinesPc: The chance (0-1) for a cornet point to change position as
   *                 time goes by.
   * dynamicLinesVar: The random variation (in pixels) for the end of lines that
   *                  are modified as time goes by from their previous position
   * historyTrack: The number of last positions of the loop to track in the
   *               history vizualization.
   */
  static makeDynamic(space, spaceToUse, lines, initLinesPc, initLinesVar, dynamicLinesPc,
                     dynamicLinesVar, historyTrack) {
    let hspace = space/2;
    let loop = Loop.makeRandom(hspace, spaceToUse, lines, initLinesPc, initLinesVar);
    let component = new SvgComponent('test', 'loop', space, loop);
    asTimePasses(() => {
      loop.addRandomness(dynamicLinesPc, dynamicLinesVar, space);
      component.track(historyTrack);
    });
    return component;
  }
}


/** A race track has an outter bountary loop and an inner boundary loop. */
class RaceTrack {
  #outerBound = null;
  #innerBound = null;

  constructor(outerBound, innerBound) {
    this.#outerBound = outerBound;
    this.#innerBound = innerBound;
    if (!this.isValid()) {
      if (this.reportErrors)
        console.assert(false, `Loops of RaceTrack are not valid`);
      throw `Loops of RaceTrack are not valid`;
    }
  }

  isValid() {
    if (!this.#outerBound.isValid()) {
      if (this.reportErrors)
        console.assert(false, `Outer loop not valid`);
      return false;
    }
    if (!this.#innerBound.isValid()) {
      if (this.reportErrors)
        console.assert(false, `Inner loop not valid`);
      return false;
    }
    if (!this.innerEnclosed()) {
      if (this.reportErrors)
        console.assert(false, `Inner loop not enclosed by outer`);
      return false;
    }
    return true;
  }

  innerEnclosed() {
    return this.#innerBound.enclosedIn(this.#outerBound);
  }

  static makeRandom(space, spaceToUse, lines, linesVar, posVar, validation) {
    if (validation == undefined) validation = Loop.isInSpace(space);
    let outerBound = Loop.makeRandom(space, spaceToUse, lines, linesVar, posVar, validation);
    let validEnclosed = RaceTrack.validEnclosed(outerBound);
    let innerBound = Loop.makeRandom(space, spaceToUse/2, lines, linesVar, posVar, validEnclosed);
    return new RaceTrack(outerBound, innerBound);
  }

  /** Add some randomness according to params to linesVar percentage of lines */
  addRandomness(linesVar, posVar, space, validation) {
    this.reportErrors = false;
    if(!validation) validation = RaceTrack.validNonFlat(space, this);
    this.#outerBound.addRandomness(linesVar, posVar, space, validation);
    this.#innerBound.addRandomness(linesVar, posVar, space, validation);
  }

  static validEnclosed(space, outerLoop) {
    let inSpace = Loop.isInSpace(space);
    return (point) => inSpace(point) && outerLoop.encloses(point);
  }

  static validNonFlat(space, raceTrack) {
    let innerOK = Loop.inSpaceNonFlat(space, raceTrack.#outerBound);
    let outerOK = Loop.inSpaceNonFlat(space, raceTrack.#innerBound);
    return (point) => innerOK(point) && outerOK(point) && raceTrack.innerEnclosed();
  }

  getSvg(id) {
    let outerSvg = this.#outerBound.getSvg(`outer_${id}`);
    let innerSvg = this.#innerBound.getSvg(`inner_${id}`);
    return `${outerSvg}\n${innerSvg}`;
  }

  /**
   * Return a random dynamic racetrack component.
   * space: The space x space area (in pixels) where the loop will exist
   * spaceToUse: The space to use for the initial canonical polygon
   * lines: The default initial number of lines of the loop
   * initLinesPc: The percentage (0-1) variation from 'lines' in the number of lines
   * initLinesVar: The initial random variation (in pixels) for the corner points
   *               of the polygon from the perfect symmetric polygon.
   * dynamicLinesPc: The chance (0-1) for a cornet point to change position as
   *                 time goes by.
   * dynamicLinesVar: The random variation (in pixels) for the end of lines that
   *                  are modified as time goes by from their previous position
   * historyTrack: The number of last positions of the loop to track in the
   *               history vizualization.
   */
  static makeDynamic(space, spaceToUse, lines, initLinesPc, initLinesVar, dynamicLinesPc,
                     dynamicLinesVar, historyTrack) {
    let hspace = space/2;
    let raceTrack = RaceTrack.makeRandom(space, spaceToUse, lines, initLinesPc, initLinesVar);
    let component = new SvgComponent('main', 'racetrack', space, raceTrack);
    asTimePasses(() => {
      raceTrack.addRandomness(dynamicLinesPc, dynamicLinesVar, space);
      component.track(historyTrack);
    });
    return component;
  }
}

class SvgComponent {
  #svg = null;
  #id = null;
  #instance = null;
  #space = null;
  #history = [];
  constructor(id, className, space, instance) {
    this.#svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    document.body.appendChild(this.#svg);
    this.#svg.id = id + '_svg';
    this.#svg.setAttribute('class', className);
    this.#svg.setAttribute('width', `${space}`);
    this.#svg.setAttribute('height', `${space}`);
    this.#id = id;
    this.#instance = instance;
    this.#space = space;
    this.refresh();
  }

  get instance() {
    return this.#instance;
  }

  getInnerHTML(opacity) {
    let space = this.#space;
    let hspace = space / 2;
    let svg = this.#instance.getSvg(this.#id);
    return `<g transform="translate(${hspace}, ${hspace}) scale(1,-1)" style="opacity:${opacity}">
              ${svg}
            </g>`;

  }

  refresh() {
    this.#svg.innerHTML = this.getInnerHTML(1);
  }

  track(maxCalls) {
    let space = this.#space;
    let hspace = space / 2;
    if (this.#history.length > maxCalls) {
      this.#history.shift();
    }
    this.#history.push(this.getInnerHTML(1));
    let opacity = 1;
    let opacityDecrease = 1/maxCalls;
    // Decrease opacity as we go to the past.
    for(let i = this.#history.length - 1; i>=0; i--) {
      let htmlCall = this.#history[i];
      this.#history[i] = htmlCall.replace(/"opacity:.*"/, `"opacity: ${opacity}"`);
      opacity -= opacityDecrease;
    }
    this.#svg.innerHTML = this.#history.join("\n");
  }
}
