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

  get outerBound() {
    return this.#outerBound;
  }

  get innerBound() {
    return this.#innerBound;
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
    let outerBound = Loop.randomIdeal(vectors, vectorsVar, spaceToUse);
    let innerBound = Loop.randomIdeal(vectors, vectorsVar, spaceToUse/2);
    let raceTrack = new RaceTrack(outerBound, innerBound);
    raceTrack.addRandomness(1, posVar, space,  maxAngleVariation, minCornerDistance,
                       validation);
    return raceTrack;
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

  static validNonFlat(space, raceTrack, maxAngleVariation, minCornerDistance) {
    let outerOK = Loop.inSpaceNonFlat(space, raceTrack.#outerBound,
                                      maxAngleVariation, minCornerDistance);
    let innerOK = Loop.inSpaceNonFlat(space, raceTrack.#innerBound,
                                      maxAngleVariation, minCornerDistance);
    return (point) => {
      let innerPointOK = innerOK(point);
      let outerPointOK = outerOK(point);
      let innerEnclosed = raceTrack.innerEnclosed();
      let hasMinDistance = raceTrack.innerDistance() > minCornerDistance;
      //console.log(`innerPointOK ${innerPointOK} outerPointOK ${outerPointOK}
      //            innerEnclosed ${innerEnclosed} hasMinDistance ${hasMinDistance}`)
      return innerPointOK && outerPointOK && innerEnclosed && hasMinDistance;
    };
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
    let component = RaceTrack.makeStatic(space, spaceToUse, vectors,
       initVectorsPc, initVectorsVar, maxAngleVariation, minCornerDistance, historyTrack);
    let raceTrack = component.instance;
    asTimePasses(() => {
      raceTrack.addRandomness(dynamicVectorsPc, dynamicVectorsVar, space,
                              maxAngleVariation, minCornerDistance);
      component.track();
    });
    return component;
  }

  static makeStatic(space, spaceToUse, vectors, initVectorsPc, initVectorsVar,
     maxAngleVariation, minCornerDistance, historyTrack) {
    let raceTrack = RaceTrack.makeRandom(space, spaceToUse, vectors, initVectorsPc, initVectorsVar,
                                         maxAngleVariation, minCornerDistance);
    let component = new SvgComponent('main', space, 'racetrack', raceTrack, historyTrack);
    return component;
  }
}
