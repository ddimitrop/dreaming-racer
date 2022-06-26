/**
 * A racer simulates a robot that lives inside a race track.
 * This version of a racer is non autonomous but we can "drive" in it inside
 * the race track.
 * The racer goes straigt ahead until it bumps to a wall where it gets "stuck".
 * But we can turn it left and right with the "left-right" arrow keys or the
 * "k-l" keys, like playing a racer game.
 */

/** A Racer in a race track */
class Racer {
  #raceTrack = null;
  #currentVector = null;
  #history = [];     // The last vectors of the racer as it moves
  #historyRoute = null;
  historySize = 200;  //  How many moving vectors to keep
  showHistory = false;
  #samples = [];     // The last sample positions of the racer
  samplesSize = 500;   //  How many sample points to keep
  showSamples = false;
  maxStuckPeriods = 1; // For how many periods the racer will get stuck after "crashing"
  positionSize = 5; // The size of the position circle;
  sampleSize = 1; // The size of the position circle;
  #stuckPeriods = 0;
  #speed = null;
  #angleTurn = null;
  #turningAngle = null;

  constructor(raceTrack, speed, angleTurn) {
    this.#raceTrack = raceTrack;
    this.#speed = speed;
    this.#angleTurn = angleTurn;
    this.#historyRoute = new Route(this.#history);
    let minOuter = null;
    for(let point of raceTrack.outerBound.points) {
      if (minOuter == null || point.x < minOuter.x) minOuter = point;
    }
    let minInner = null;
    for(let point of raceTrack.innerBound.points) {
      if (minInner == null || point.x < minInner.x) minInner = point;
    }
    let position = new Point((minOuter.x + minInner.x)/2,
                             (minOuter.y + minInner.y)/2);
    this.setCurrentVector(position, Math.PI/2);
    this.addSample(this.position, false);
    asTimePasses(() => this.moveOn());
  }

  setCurrentVector(position, angle) {
    this.#currentVector = new Vector(position, position);
    this.#currentVector.setAngle(angle);
    this.#currentVector.setDistance(1);
    this.addHistory(this.#currentVector);
  }

  get position() {
    return this.#currentVector.end;
  }

  get nextPosition() {
    let position = this.position;
    if(!this.isInTrack()) {
      position = this.closestPointIn();
    }
    let nextVector = new Vector(position, position);
    let nextAngle = this.#turningAngle || this.#currentVector.angle;
    nextVector.setAngle(nextAngle);
    nextVector.setDistance(this.#speed);
    return nextVector.end;
  }

  moveOn() {
    if(!this.isInTrack()) {
       if(this.#stuckPeriods < this.maxStuckPeriods) {
         if (this.#stuckPeriods == 0) {
           this.addSample(this.position, true);
         }
         // Once the racer goes out of the track it has to get stuck for
         // maxStuckPeriods before able to move again.
         this.#stuckPeriods++;
         return;
       } else if (this.willBeInTrack()){
         this.getInTrack();
         this.addSample(this.position, false);
         this.#stuckPeriods = 0;
       } else {
         let data = this.closestVectorIn();
         let turningAngle =
            this.autonousDrive(this.#currentVector, data.vector, data.outer);
         if(turningAngle) {
           this.#turningAngle = turningAngle;
           this.doTurn();
         }
       }
    } else {
      let turningAngle = this.knowsHasToTurn();
      if(turningAngle) {
        this.#turningAngle = turningAngle;
        this.doTurn();
      }
      this.#currentVector.setDistance(this.#currentVector.distance + this.#speed);
      this.addSample(this.position, false);
    }
  }

  isInTrack() {
    return this.#raceTrack.isInTrack(this.position);
  }

  willBeInTrack() {
    return this.#raceTrack.isInTrack(this.nextPosition);
  }

  closestVectorIn() {
    let outer = true;
    let [vector, distance, index, point] = this.#raceTrack.outerBound.getClosest(this.position);
    let [ivector, idistance, iindex, ipoint] = this.#raceTrack.innerBound.getClosest(this.position);
    if (distance > idistance) {
      outer = false;
      [vector, distance, index, point] = [ivector, idistance, iindex, ipoint];
    }
    return {vector, distance, index, point, outer}
  }

  closestPointIn() {
    return this.closestVectorIn().point;
  }

  getInTrack() {
    this.moveTo(this.closestPointIn());
  }

  moveTo(point) {
    if (!this.position.equal(point)) {
      let moveVector = new Vector(this.position, point);
      this.addHistory(moveVector);
    }
    this.setCurrentVector(point, this.#currentVector.angle);
  }

  turn(left) {
    if (this.#turningAngle == null) {
      this.#turningAngle = this.#currentVector.angle;
    }
    this.#turningAngle += (left ? this.#angleTurn : -this.#angleTurn);
    this.doTurn();
  }

  doTurn() {
    if (this.isInTrack() || this.willBeInTrack()) {
      this.setCurrentVector(this.position, this.#turningAngle);
      this.#turningAngle = null;
    }
  }

  addHistory(vector) {
    if (this.#history.length > this.historySize) {
      this.#history.shift();
    }
    this.#history.push(vector);
  }

  addSample(point, isStuck) {
    if (this.#samples.length > this.samplesSize) {
      this.#samples.shift();
    }
    this.#samples.push({point, isStuck});
  }

  addDrivingSupport() {
    onKey({
      'k' : () => this.turn(true),
      'l' : () => this.turn(false),
      'ArrowLeft' : () => this.turn(true),
      'ArrowRight' : () => this.turn(false)
    })
  }

  /** A racer with autonomous driving would return the angle
   * that the racer need to turn to get unstuck.
   * - racerVector: the vector of the racer to find its angle
   * - wallVector: the vector of the wall that the racer bumped in
   * - isOuter: it its an inner wall.
   * Because we want the racer to go clockwise we turn right if for
   * inner and left for outer walls.
   */
  autonousDrive(racerVector, wallVector, isOuter) {
    // This racer doesn't support autonomous driving.
    return null;
  }

  /** An racer with the ability to learn can turn becore it bumps */
  knowsHasToTurn() {
    // This racer doesn't learn.
    return null;
  }

  /**
   * If the racer is currently processing its experiences into a machine
   * learning model.
   */
  isLearning() {
    // This racer can't learn
    return false;
  }

  getSvg(className) {
    let suffix = this.isInTrack() ? '_moving' : '_stuck'
    let svg = this.position.getSvg(className + suffix, this.positionSize);
    if (this.showSamples) {
      for (let sample of this.#samples) {
        let suffix = sample.isStuck ? '_sample_stuck' : '_sample_ok';
        svg += sample.point.getSvg(className + suffix, this.sampleSize);
      }
    }
    if (this.showHistory) {
      svg += this.#historyRoute.getSvg(className + "_history");
    }
    return svg;
  }

  static makeStatic(space, spaceToUse, vectors, initVectorsPc, initVectorsVar,
     maxAngleVariation, minCornerDistance, historyTrack, speed, angleTurn,
     drivingSupport) {
      let component = RaceTrack.makeStatic(space, spaceToUse, vectors,
           initVectorsPc, initVectorsVar, maxAngleVariation, minCornerDistance);
      let raceTrack = component.instance;
      let racer = new Racer(raceTrack, speed, angleTurn);
      if (drivingSupport) racer.addDrivingSupport();
      component.addInstance('racer', racer, 1);
      asTimePasses(() => {
        component.refresh();
      });
      return component;
  }
}
