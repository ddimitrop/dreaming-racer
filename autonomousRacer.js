/**
 * An autonomous version of a racer that "drives" by iteself inside the race
 * track.
 * The racer goes straigt ahead until it bumps to a wall. Then it turns itself
 * randommly to keep going on.
 * The racer doesn't know the shape of the track but can detect if it bumps
 * an inner or outer well and can find the angle of that well.
 * It can but doesn't have to be driven with keys.
 */

/** An Autononmous Racer in a race track */
class AutonomousRacer extends Racer {
  minAngleOffset = Math.PI * 0.1;
  maxRandomExtraOffset = Math.PI * 0.3;

  constructor(raceTrack, speed, angleTurn) {
    super(raceTrack, speed, angleTurn);
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
    let angle = null;
    //First calc the randomOffset:
    let randomAngleOffset = this.maxRandomExtraOffset * Math.random() * autonomousRetries
    // You need "autonomousRetries" because sometimes the shape of wall is such
    // that can't escape easily (i.e. a corner).
    if(isOuter == true){
       angle = wallVector.angle - this.minAngleOffset - randomAngleOffset;
    }
    if(isOuter == false){
       angle = wallVector.angle + this.minAngleOffset + randomAngleOffset;
    }
    // Make sure you return a nonReflex angle
    angle = Point.nonReflex(angle)

    return angle;
  }

  // Similar to other helpers - just boilerplate.
  static makeStatic(space, spaceToUse, vectors, initVectorsPc, initVectorsVar,
     maxAngleVariation, minCornerDistance, historyTrack, speed, angleTurn) {
      let component = RaceTrack.makeStatic(space, spaceToUse, vectors,
           initVectorsPc, initVectorsVar, maxAngleVariation, minCornerDistance);
      let raceTrack = component.instance;
      let racer = new AutonomousRacer(raceTrack, speed, angleTurn);
      component.addInstance('racer', racer, 1);
      asTimePasses(() => {
        component.refresh();
      });
      return component;
  }

}
