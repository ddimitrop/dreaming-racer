function initDynamicLoop() {
  let space = 600;
  let component = Loop.makeDynamic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 10 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 20 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space/10 /* minCornerDistance */,
    10 /* historyTrack */);
}

function initDynamicRaceTrack() {
  let space = 600;
  let component = RaceTrack.makeDynamic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 10 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 20 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space/10 /* minCornerDistance */,
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

  getSvg(id) {
    let start = this.start;
    let end = this.end;
    return `<line id="${id}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
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

/**
 * A loop is a list of vectors each connected to its next (the end of previous is
 * start of the next) and end of last is the start of the first).
 * Also none of the vectors can ever intersect.
 * The order of vectors should be such so that most of the angles that are formed
 * are not reflex i.e. < PI (clockwise).
 * Otherwise the order of vectors in the array gets reversed.
 */
class Loop {
  #vectors = null;
  reportErrors = true;

  constructor(vectors) {
    this.#vectors = vectors;
    if (!this.isValid()) {
      if (this.reportErrors)
        console.assert(false, `Vectors of loop are not valid`);
      throw `Vectors of loop are not valid`;
    }
    if(this.nonReflexIndexes().length < this.#vectors.length / 2) {
      this.#vectors = this.#vectors.reverse();
      for (let i=0; i < this.#vectors.length; i++) {
        this.#vectors[i] = this.#vectors[i].reverse();
      }
    }
  }

  get vectors() {
    return this.#vectors;
  }

  /** Returns the vectors at position i (prev, current, next) */
  vectorsAt(i) {
    let vector = this.#vectors[i];
    let numVectors = this.#vectors.length;
    let next = i != numVectors - 1 ? this.#vectors[i+1]: this.#vectors[0];
    let prev = i != 0 ? this.#vectors[i-1]: this.#vectors[numVectors - 1];
    return [prev, vector, next];
  }

  /** Returns the points that define angle i : i.start, i.end, i+1.end */
  pointsAt(i) {
    let [prev, vector, next] = this.vectorsAt(i);
    return [vector.start, vector.end, next.end];
  }

  /** Returns the angle defined by the end of the ith vector */
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
    for (let i=0; i < this.#vectors.length; i++) {
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
    for (let i=0; i < this.#vectors.length; i++) {
      if (this.angleAt(i) < angle) {
        return false;
      }
    }
    return true;
  }

  /** Returns if the polygon has all angles < angle */
  allAnglesLess(angle) {
    for (let i=0; i < this.#vectors.length; i++) {
      if (this.angleAt(i) > angle) {
        return false;
      }
    }
    return true;
  }

  /* Returns the circular index in the vectors array */
  circular(i) {
    return (i + this.#vectors.length) % this.#vectors.length;
  }

  /** Returns the minimum distance between any 2 points */
  minDistance() {
    let minDistance = Infinity;
    for (let k=0; k < this.#vectors.length; k++) {
      let startPoint = this.#vectors[k].start;
      for (let i=0; i < this.#vectors.length - 1; i++) {
        let n = this.circular(i + k);
        let dist = startPoint.distance(this.#vectors[n].end);
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
    for (let i=0; i < this.#vectors.length; i++) {
      if (this.isNonReflex(i)) {
        numNonReflex.push(i);
      }
    }
    return numNonReflex;
  }

  isValid() {
    for (let i=0; i < this.#vectors.length; i++) {
      let [prev, vector, next] = this.vectorsAt(i);

      if(!vector.end.equal(next.start)) {
        if (this.reportErrors)
          console.assert(false, `Vector ${i} not connected`);
        return false;
      }
      for (let j=0; j < this.#vectors.length; j++) {
        let another = this.#vectors[j];
        if (another == vector || another == next || another == prev) continue;
        if(vector.intersects(another)) {
          if (this.reportErrors)
            console.assert(false, `Vector ${i} intersects ${j}`);
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Returns if the point is enclosed in the loop. For loops with non-reflex
   * angles this is easy: split the area in trianges by starting from a constant
   * point and make triangles for each vector. The point should be enclosed in one
   * of them.
   *
   * For the general case (includes reflex angles), filter all reflex angles
   * (outer shape) and repeat like above. But also ensure that the point is
   * not enclosed in the reverse area defined by the reflex angles.
   */
  encloses(point) {
    let nonReflex = this.nonReflexIndexes();
    let constPoint = this.#vectors[nonReflex[0]].end;
    let wasFoundEnclosed = false;
    // Look for been enclosed at the outer shape made of non-reflex angles.
    for (let i = 0 ; i < nonReflex.length; i++) {
      let vector = this.#vectors[nonReflex[i]];
      if (!vector.start.equal(constPoint) && !vector.end.equal(constPoint)) {
        if(point.isEnclosed(constPoint, vector.start, vector.end)) {
          wasFoundEnclosed = true;
          break;
        }
      }
    }
    if (!wasFoundEnclosed) return false;

    // Now ensure that the point is not enclosed in areas defined by smaller
    // loops around reflex angles.
    let lastNonReflex = null;
    for (let i = this.#vectors.length - 1; i >=0; i--) {
      if (this.isNonReflex(i)) {
        lastNonReflex = i;
        break;
      }
    }

    for (let i=0; i < this.#vectors.length; i++) {
      if (this.isNonReflex(i)) {
        // Make smaller loops by the vectors arround consecutive reflex angles
        // and ensure that the point is not enclosed inside them.
        if(lastNonReflex != this.circular(i - 1)) {
          let vectors = [];
          for (let j = this.circular(lastNonReflex + 1);
               j != this.circular(i + 1);
               j = this.circular(j + 1)) {
            vectors.push(this.#vectors[j]);
          }
          vectors.push(new Vector(this.#vectors[i].end, this.#vectors[lastNonReflex].end));
          let exclusionLoop = new Loop(vectors);
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
    for (let i = 0; i < this.#vectors.length; i++) {
      let point = this.#vectors[i].end;
      if (!otherLoop.encloses(point)) {
        if (this.reportErrors)
          console.assert(false, `Point ${i} ${point} not enclosed in other loop`);
        return false;
      }
    }
    return true;
  }

  /** Returns the vector closest to 'point' and the distance from it */
  getClosest(point) {
    let minDistance = Infinity;
    let minVector = null;
    let mi = null;
    for (let i = 0; i < this.#vectors.length; i++) {
      let vector = this.#vectors[i];
      let distanceFrom = vector.getDistanceFrom(point);
      if (distanceFrom < minDistance) {
        minDistance = distanceFrom;
        minVector = vector;
        mi = i;
      }
    }
    return [minVector, minDistance, mi];
  }

  /** Return the min distance between 2 loops and the vectors involved */
  getClosestFromLoop(otherLoop) {
    let minDistance = Infinity;
    let minVector = null;
    let mi = null;
    let otherVector = null;
    let otherI = 0;
    for (let i = 0; i < this.#vectors.length; i++) {
      let vector = this.#vectors[i];
      let point = vector.end;
      let [oVector, oDistance, oi] = otherLoop.getClosest(point);
      if (oDistance < minDistance) {
        minDistance = oDistance;
        minVector = vector;
        mi = i;
        otherVector = oVector;
        otherI = oi;
      }
    }
    return [minDistance, minVector, otherVector, mi, otherI];
  }

  getSvg(id) {
    let start = this.start;
    let end = this.end;
    let d = "";
    let cd = "";
    for (let i=0; i < this.#vectors.length; i++) {
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
   * on number of vectors, and coordinates.
   * Validation is a check on points to ensure that they adhere to required rules.
   */
  static makeRandom(space, spaceToUse, vectors, vectorsVar, posVar,
                    maxAngleVariation, minCornerDistance, validation) {
    vectors = Math.round(vectors * (1 - vectorsVar) + Math.random() * vectors * vectorsVar);
    let initValidation = validation;
    if (validation == undefined) validation = Loop.isInSpace(space);
    // Start by making a polygon of "vectors" vectors
    let angleInc = 2 * Math.PI / vectors;
    let angle = 0;
    // Get vectors from the center to the perimeter of the circle
    // that covers 80% of the space to make a symmetric polygon.
    // Start fom the horizontal axis
    let nextD = new Vector(new Point(0, 0), new Point(0, 0));
    nextD.setDistance(spaceToUse);
    nextD.setAngle(angle);
    let initP = nextD.end.round();
    let nextP = initP;
    let allVectors = [];
    for (let i = 0; i < vectors -1 ; i++) {
      angle += angleInc;
      nextD.setAngle(angle);
      let upcomingNextD = nextD.end.round();
      let nextL = new Vector(nextP, upcomingNextD);
      allVectors.push(nextL);
      nextP = upcomingNextD;
    }
    allVectors.push(new Vector(nextP, initP));
    let loop = new Loop(allVectors);
    loop.addRandomness(1, posVar, space,  maxAngleVariation, minCornerDistance,
                       initValidation);
    return loop;
  }

  /** Add some randomness according to params to vectorsVar percentage of vectors */
  addRandomness(vectorsVar, posVar, space,  maxAngleVariation, minCornerDistance, validation) {
    if(!validation) validation = Loop.inSpaceNonFlat(space, this, maxAngleVariation, minCornerDistance);

    this.reportErrors = false;
    for (let i = 0; i < this.#vectors.length ; i++) {
      if (Math.random() > vectorsVar) continue;
      let vector = this.#vectors[i];
      let next = this.#vectors[this.circular(i+1)];
      Loop.addRandomnessInVector(vector, next, posVar, validation);
    }
    this.reportErrors = true;
  }

  /** Add some randomness according to params to the end of vector */
  static addRandomnessInVector(vector, next, posVar, validation) {
    let prevEnd = vector.end;
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
      vector.setEnd(newEnd);
      next.setStart(vector.end);
      let isValid = validation(vector.end);
      if (isValid && enoughVariation) {
         return true;
      } else {
        vector.setEnd(prevEnd);
        next.setStart(vector.end);
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
  static hasGoodShape(space, loop, maxAngleVariation, minDistAllowed) {
    let isInSpaceFunc = Loop.isInSpace(space, loop);
    let idealAngle = Math.PI * (loop.#vectors.length - 2) / loop.#vectors.length;
    let angleVariation = idealAngle * maxAngleVariation;
    return (point) => {
      let isInSpace = isInSpaceFunc(point);
      let isValid = loop.isValid();
      let allAnglesGreater = loop.allAnglesGreater(idealAngle - angleVariation);
      let allAnglesLess = loop.allAnglesLess(idealAngle + angleVariation);
      let minDistance = loop.minDistance();
      let hasMinDistance = minDistance > minDistAllowed;
      return isInSpace && isValid &&
             allAnglesGreater && allAnglesLess && hasMinDistance;
    };
  }

  /** Returns a validation check that the polygon has good area */
  static inSpaceNonFlat(space, loop, maxAngleVariation, minCornerDistance) {
    return Loop.hasGoodShape(space, loop , maxAngleVariation, minCornerDistance);
  }

  /**
   * Return a random dynamic loop component.
   * space: The space x space area (in pixels) where the loop will exist
   * spaceToUse: The space to use for the initial canonical polygon
   * vectors: The default initial number of vectors of the loop
   * initVectorsPc: The percentage (0-1) variation from 'vectors' in the number of vectors
   * initVectorsVar: The initial random variation (in pixels) for the corner points
   *               of the polygon from the perfect symmetric polygon.
   * dynamicVectorsPc: The chance (0-1) for a cornet point to change position as
   *                 time goes by.
   * dynamicVectorsVar: The random variation (in pixels) for the end of vectors that
   *                  are modified as time goes by from their previous position
   * maxAngleVariation: Max angle variation from ideal polygon.
   * minCornerDistance: Min corner distance for all edges of the polygon
   * historyTrack: The number of last positions of the loop to track in the
   *               history vizualization.
   */
  static makeDynamic(space, spaceToUse, vectors, initVectorsPc, initVectorsVar, dynamicVectorsPc,
                     dynamicVectorsVar, maxAngleVariation, minCornerDistance, historyTrack) {
    let hspace = space/2;
    let loop = Loop.makeRandom(hspace, spaceToUse, vectors, initVectorsPc, initVectorsVar,
                               maxAngleVariation, minCornerDistance);
    let component = new SvgComponent('test', 'loop', space, loop);
    asTimePasses(() => {
      loop.addRandomness(dynamicVectorsPc, dynamicVectorsVar, hspace,
                         maxAngleVariation, minCornerDistance);
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

  innerDistance() {
    let [minDistance] = this.#innerBound.getClosestFromLoop(this.#outerBound);
    return minDistance;
  }

  static makeRandom(space, spaceToUse, vectors, vectorsVar, posVar,
                    maxAngleVariation, minCornerDistance, validation) {
    let hspace = space/2;
    if (validation == undefined) validation = Loop.isInSpace(space);
    let outerBound = Loop.makeRandom(space, spaceToUse, vectors, vectorsVar, posVar,
                                     maxAngleVariation, minCornerDistance, validation);
    let validEnclosed = RaceTrack.validEnclosed(outerBound);
    let innerBound = Loop.makeRandom(space, spaceToUse/2, vectors, vectorsVar, posVar,
                                     maxAngleVariation, minCornerDistance, validEnclosed);
    return new RaceTrack(outerBound, innerBound);
  }

  /** Add some randomness according to params to vectorsVar percentage of vectors */
  addRandomness(vectorsVar, posVar, space, maxAngleVariation, minCornerDistance, validation) {
    this.reportErrors = false;
    this.#outerBound.reportErrors = false;
    this.#innerBound.reportErrors = false;
    if(!validation) validation = RaceTrack.validNonFlat(space, this,
                                                        maxAngleVariation, minCornerDistance);
    this.#outerBound.addRandomness(vectorsVar, posVar, space,
                                   maxAngleVariation, minCornerDistance, validation);
    this.#innerBound.addRandomness(vectorsVar, posVar, space,
                                   maxAngleVariation, minCornerDistance, validation);
    this.reportErrors = true;
    this.#outerBound.reportErrors = true;
    this.#innerBound.reportErrors = true;
  }

  static validEnclosed(space, outerLoop) {
    let inSpace = Loop.isInSpace(space);
    return (point) => inSpace(point) && outerLoop.encloses(point);
  }

  static validNonFlat(space, raceTrack, maxAngleVariation, minCornerDistance) {
    let innerOK = Loop.inSpaceNonFlat(space, raceTrack.#outerBound,
                                      maxAngleVariation, minCornerDistance);
    let outerOK = Loop.inSpaceNonFlat(space, raceTrack.#innerBound,
                                      maxAngleVariation, minCornerDistance);
    return (point) => innerOK(point) && outerOK(point) &&
                      raceTrack.innerEnclosed() &&
                      raceTrack.innerDistance() > minCornerDistance;
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
   * vectors: The default initial number of vectors of the loop
   * initVectorsPc: The percentage (0-1) variation from 'vectors' in the number of vectors
   * initVectorsVar: The initial random variation (in pixels) for the corner points
   *               of the polygon from the perfect symmetric polygon.
   * dynamicVectorsPc: The chance (0-1) for a cornet point to change position as
   *                 time goes by.
   * dynamicVectorsVar: The random variation (in pixels) for the end of vectors that
   *                  are modified as time goes by from their previous position
   * maxAngleVariation: Max angle variation from ideal polygon.
   * minCornerDistance: Min corner distance for all edges of the polygon
   * historyTrack: The number of last positions of the loop to track in the
   *               history vizualization.
   */
  static makeDynamic(space, spaceToUse, vectors, initVectorsPc, initVectorsVar, dynamicVectorsPc,
                     dynamicVectorsVar, maxAngleVariation, minCornerDistance, historyTrack) {
    let hspace = space/2;
    let raceTrack = RaceTrack.makeRandom(hspace, spaceToUse, vectors, initVectorsPc, initVectorsVar,
                                         maxAngleVariation, minCornerDistance);
    let component = new SvgComponent('main', 'racetrack', space, raceTrack);
    asTimePasses(() => {
      raceTrack.addRandomness(dynamicVectorsPc, dynamicVectorsVar, hspace,
                              maxAngleVariation, minCornerDistance);
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
