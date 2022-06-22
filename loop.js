/**
 * A loop is a route where the last vector is connected to the first (the end
 * point of the last equals the start of the first).
 * Also none of the vectors can ever intersect.
 * The order of vectors should be such so that most of the angles that are formed
 * are not reflex i.e. < PI (clockwise).
 * Otherwise the order of vectors in the array gets reversed.
 */
class Loop extends Route {

  constructor(vectors) {
    super(vectors)

    if(this.nonReflexIndexes().length < this.vectors.length / 2) {
      vectors = this.vectors.reverse().map(vector => vector.reverse());
      this.setVectors(vectors);
    }
  }

  isValid() {
    if (!super.isValid()) return false;

    let first = this.vectors[0];
    let last = this.vectors[this.vectors.length - 1];

    if(!last.end.equal(first.start)) {
      if (this.reportErrors)
        console.assert(false, `Last vector not connected`);
      return false;
    }

    for (let i=0; i < this.vectors.length; i++) {
      let [prev, vector, next] = this.vectorsAt(i);
      for (let j=0; j < this.vectors.length; j++) {
        let another = this.vectors[j];
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

  /** Returns the vectors at position i (prev, current, next) */
  vectorsAt(i) {
    let vector = this.vectors[i];
    let numVectors = this.vectors.length;
    let next = i != numVectors - 1 ? this.vectors[i+1]: this.vectors[0];
    let prev = i != 0 ? this.vectors[i-1]: this.vectors[numVectors - 1];
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
    for (let i=0; i < this.vectors.length; i++) {
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
    for (let i=0; i < this.vectors.length; i++) {
      if (this.angleAt(i) < angle) {
        return false;
      }
    }
    return true;
  }

  /** Returns if the polygon has all angles < angle */
  allAnglesLess(angle) {
    for (let i=0; i < this.vectors.length; i++) {
      if (this.angleAt(i) > angle) {
        return false;
      }
    }
    return true;
  }


  /** Returns the number of non-reflex angles in range 0 .. PI */
  nonReflexIndexes() {
    let numNonReflex = [];
    for (let i=0; i < this.vectors.length; i++) {
      if (this.isNonReflex(i)) {
        numNonReflex.push(i);
      }
    }
    return numNonReflex;
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
    let constPoint = this.vectors[nonReflex[0]].end;
    let wasFoundEnclosed = false;
    // Look for been enclosed at the outer shape made of non-reflex angles.
    for (let i = 0 ; i < nonReflex.length; i++) {
      let vector = this.vectors[nonReflex[i]];
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
    for (let i = this.vectors.length - 1; i >=0; i--) {
      if (this.isNonReflex(i)) {
        lastNonReflex = i;
        break;
      }
    }

    for (let i=0; i < this.vectors.length; i++) {
      if (this.isNonReflex(i)) {
        // Make smaller loops by the vectors arround consecutive reflex angles
        // and ensure that the point is not enclosed inside them.
        if(lastNonReflex != this.circular(i - 1)) {
          let vectors = [];
          for (let j = this.circular(lastNonReflex + 1);
               j != this.circular(i + 1);
               j = this.circular(j + 1)) {
            vectors.push(this.vectors[j]);
          }
          vectors.push(new Vector(this.vectors[i].end, this.vectors[lastNonReflex].end));
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
    for (let i = 0; i < this.vectors.length; i++) {
      let point = this.vectors[i].end;
      if (!otherLoop.encloses(point)) {
        if (this.reportErrors)
          console.assert(false, `Point ${i} ${point} not enclosed in other loop`);
        return false;
      }
    }
    return true;
  }

  getSvgD() {
    return super.getSvgD() + "z";
  }

  /**
   * Will generate a random loop in the square space of size space x space.
   * The var parameters is the percentage (0..1) or randomness that we want
   * on number of vectors, and coordinates.
   * Validation is a check on points to ensure that they adhere to required rules.
   */
  static makeRandom(space, spaceToUse, vectors, vectorsVar, posVar,
                    maxAngleVariation, minCornerDistance, validation) {
    let loop = Loop.randomIdeal(vectors, vectorsVar, spaceToUse);
    loop.addRandomness(1, posVar, space,  maxAngleVariation, minCornerDistance,
                       validation);
    return loop;
  }

  /** Makes an ideal polygon loop with a random number of vectors */
  static randomIdeal(vectors, vectorsVar, spaceToUse) {
    vectors = Math.round(vectors * (1 - vectorsVar) + Math.random() * vectors * vectorsVar);
    return Loop.makeIdeal(vectors, spaceToUse);
  }

  /** Makes an ideal polygon loop of "vector" number of vectors */
  static makeIdeal(vectors, spaceToUse) {
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
    return new Loop(allVectors);
  }

  /** Add some randomness according to params to vectorsVar percentage of vectors */
  addRandomness(vectorsVar, posVar, space,  maxAngleVariation, minCornerDistance, validation) {
    if(!validation) validation = Loop.inSpaceNonFlat(space, this, maxAngleVariation, minCornerDistance);

    this.reportErrors = false;
    for (let i = 0; i < this.vectors.length ; i++) {
      if (Math.random() > vectorsVar) continue;
      let vector = this.vectors[i];
      let next = this.vectors[this.circular(i+1)];
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
    while (tries++ < 10) {
      let newX = prevEnd.x + Math.round(Math.random() * posVar - posVar/2);
      let newY = prevEnd.y + Math.round(Math.random() * posVar - posVar/2);
      let newEnd = new Point(newX, newY);
      let dist = prevEnd.distance(newEnd);
      // Ensure that there is enough change and we don't stabilize.
      let enoughVariation = dist > minDiff;
      vector.setEnd(newEnd);
      next.setStart(vector.end);
      let isValid = validation(vector.end);
      // console.log(`isValid ${isValid} enoughVariation ${enoughVariation}`)
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
    let idealAngle = Math.PI * (loop.vectors.length - 2) / loop.vectors.length;
    let angleVariation = idealAngle * maxAngleVariation;
    return (point) => {
      let isInSpace = isInSpaceFunc(point);
      let isValid = loop.isValid();
      let allAnglesGreater = loop.allAnglesGreater(idealAngle - angleVariation);
      let allAnglesLess = loop.allAnglesLess(idealAngle + angleVariation);
      let minDistance = loop.minDistance();
      let hasMinDistance = minDistance > minDistAllowed;
      //console.log(`isInSpace ${isInSpace} isValid ${isValid} allAnglesGreater ${allAnglesGreater}
      //             allAnglesLess ${allAnglesLess} hasMinDistance ${hasMinDistance}`)
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
    let loop = Loop.makeRandom(space, spaceToUse, vectors, initVectorsPc, initVectorsVar,
                               maxAngleVariation, minCornerDistance);
    let component = new SvgComponent('test', space, 'loop', loop, historyTrack);
    asTimePasses(() => {
      loop.addRandomness(dynamicVectorsPc, dynamicVectorsVar, space,
                         maxAngleVariation, minCornerDistance);
      component.track();
    });
    return component;
  }
}
