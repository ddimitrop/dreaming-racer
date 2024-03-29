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
  #autonomousRetries = 0;
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

  get angle () {
    return this.#turningAngle == null ?
           this.#currentVector.angle :
           this.#turningAngle;
  }

  setAngle (angle) {
    return this.#turningAngle = angle;
  }

  resetAngle () {
    return this.#turningAngle = null;
  }

  get nextPosition() {
    let position = this.position;
    if(!this.isInTrack()) {
      position = this.closestPointIn();
    }
    return this.getNextWithAngle(position, this.angle);
  }

  getNextWithAngle(position, angle) {
    let nextVector = new Vector(position, position);
    nextVector.setAngle(angle);
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
         this.#autonomousRetries = 0;
       } else {
         let data = this.closestVectorIn();
         this.#autonomousRetries++;
         let turningAngle =
            this.autonomousDrive(this.#currentVector, data.outer,
                                 this.#autonomousRetries);
         this.turnToAngle(turningAngle);
       }
    } else {
      let turningAngle = this.knowsHasToTurn();
      this.turnToAngle(turningAngle);
      this.#currentVector.setDistance(this.#currentVector.distance + this.#speed);
      this.addSample(this.position, false);
    }
  }

  isPointInTrack(position) {
    return this.#raceTrack.isInTrack(position)
  }

  isInTrack() {
    return this.isPointInTrack(this.position);
  }

  willBeInTrack() {
    return this.isPointInTrack(this.nextPosition);
  }

  closestVectorIn() {
    return this.#raceTrack.closestVectorTo(this.position);
  }

  distanceToWall(position) {
    return this.#raceTrack.closestVectorTo(position).distance;
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
    let changeAngle = (left ? this.#angleTurn : -this.#angleTurn);
    this.turnToAngle(this.angle + changeAngle);
  }

  turnToAngle(turningAngle) {
    if(turningAngle !== null) {
      this.setAngle(turningAngle);
      this.doTurn();
    }
  }

  doTurn() {
    if (this.isInTrack() || this.willBeInTrack()) {
      this.setCurrentVector(this.position, this.#turningAngle);
      this.resetAngle();
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
   * - wallVector: the vector of the wall that the racer bumped in
   * - isOuter: it its an inner wall.
   * - autonomousRetries: How many tries where done to unstuck
   * Because we want the racer to go clockwise we turn right if for
   * inner and left for outer walls.
   */
  autonomousDrive(wallVector, isOuter, autonomousRetries) {
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
