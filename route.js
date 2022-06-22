/**
 * A route is a list of vectors each connected to its next (the end of previous is
 * start of the next) and end of last is the start of the first).
 */
class Route {
  #vectors = null;
  reportErrors = true;

  constructor(vectors) {
    this.setVectors(vectors);
  }

  get vectors() {
    return this.#vectors;
  }

  get points() {
    return this.vectors.map(v => v.end);
  }

  setVectors(vectors) {
    this.#vectors = vectors;
    if (!this.isValid()) {
      if (this.reportErrors)
        console.assert(false, `Vectors of loop are not valid`);
      throw `Vectors of loop are not valid`;
    }
  }

  isValid() {
    for (let i=0; i < this.vectors.length - 1; i++) {
      let vector = this.vectors[i];
      let next = this.vectors[i + 1];

      if(!vector.end.equal(next.start)) {
        if (this.reportErrors)
          console.assert(false, `Vector ${i} not connected`);
        return false;
      }
    }
    return true;
  }

  /* Returns the circular index in the vectors array */
  circular(i) {
    return (i + this.vectors.length) % this.vectors.length;
  }

  /** Returns the minimum distance between any 2 points */
  minDistance() {
    let minDistance = Infinity;
    for (let k=0; k < this.vectors.length; k++) {
      let startPoint = this.vectors[k].start;
      for (let i=0; i < this.vectors.length - 1; i++) {
        let n = this.circular(i + k);
        let dist = startPoint.distance(this.vectors[n].end);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }
    }
    return minDistance;
  }

  /** Returns the vector closest to 'point' and the distance from it */
  getClosest(point) {
    let minDistance = Infinity;
    let minVector = null;
    let mi = null;
    for (let i = 0; i < this.vectors.length; i++) {
      let vector = this.vectors[i];
      let distanceFrom = vector.getDistanceFrom(point);
      if (distanceFrom < minDistance) {
        minDistance = distanceFrom;
        minVector = vector;
        mi = i;
      }
    }
    let minPoint = minVector.getClosest(point);
    return [minVector, minDistance, mi, minPoint];
  }

  /** Return the min distance between 2 routes and the vectors involved */
  getClosestFromLoop(otherLoop) {
    let minDistance = Infinity;
    let minVector = null;
    let mi = null;
    let otherVector = null;
    let otherI = 0;
    for (let i = 0; i < this.vectors.length; i++) {
      let vector = this.vectors[i];
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

  getSvgD() {
    let d = "";
    for (let i=0; i < this.vectors.length; i++) {
      let [,p,] = this.pointsAt(i);
      if (i == 0) {
        d = `M ${p.x} ${p.y} `;
      } else {
        d += `L ${p.x} ${p.y} `;
      }
    }
    return d;
  }

  getSvg(className) {
    let d = this.getSvgD();
    return `<path class="${className}" d="${d}"/>`;
  }
}
