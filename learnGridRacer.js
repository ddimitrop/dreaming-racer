/** The base learning racer using  grid learner by default. */
class LearGridRacer extends SelfDrivingRacer {

  constructor(raceTrack, speed, angleTurn, space, squareSize = 10,
              samplesToUse = 2000, maxRisk = 0.2,
              learningMachine) {
    super(raceTrack, speed, angleTurn, space, maxRisk);
    this.learningMachine = learningMachine;
    if (!this.learningMachine) {
      this.learningMachine = new GridLearner(space, squareSize);
    }
    this.samplesToUse = samplesToUse;
    this.samplesUsed = 0;
  }

  addSample(point, isStuck) {
    super.addSample(point, isStuck);
    if (this.isCollecting()) {
      this.samplesUsed++;
      this.learningMachine.addPoint(point, isStuck);
    }
  }

  isCollecting() {
    return this.samplesUsed < this.samplesToUse;
  }

  riskToCrash(position) {
    if (this.isCollecting()) return null;
    return this.learningMachine.riskToCrash(position)
  }

  getHeatMap() {
    return this.learningMachine.getHeatmap();
  }

  getLabel() {
    if (this.isCollecting()) return `${this.samplesUsed} / ${this.samplesToUse}`;
    return super.getLabel();
  }

  // Similar to other helpers - just boilerplate.
  static makeStatic(space, spaceToUse, vectors, initVectorsPc, initVectorsVar,
     maxAngleVariation, minCornerDistance, historyTrack, speed, angleTurn) {
      let component = RaceTrack.makeStatic(space, spaceToUse, vectors,
           initVectorsPc, initVectorsVar, maxAngleVariation, minCornerDistance);
      let raceTrack = component.instance;
      let racer = new LearGridRacer(raceTrack, speed, angleTurn, space);
      component.addInstance('racer', racer, 1);
      asTimePasses(() => {
        component.refresh();
      });
      return component;
  }
}

/** Keeps number of crashes in a grid and predicts risk based on them. */
class GridLearner {
  constructor(space, squareSize) {
    this.space = space;
    this.squareSize = squareSize;
    this.numSquares = Math.round(this.space/this.squareSize);
    this.heatmap = [];
    this.smooth = 3;

    for (let i = 0; i < 2 * this.numSquares; i++) {
      this.heatmap.push([])
      for (let j = 0; j < 2 * this.numSquares; j++) {
        this.heatmap[i].push(0);
      }
    }
  }

  addPoint(point, isStuck) {
    if (isStuck) {
      const {i,j} = this.getGridSquare(point);
      const value = this.heatmap[i][j];
      for (let si = -this.smooth; si <= this.smooth; si++) {
        for (let sj = -this.smooth; sj <= this.smooth; sj++) {
          let increase = (2 * this.smooth + 1 - Math.abs(si) - Math.abs(sj)) /
                           (2 * this.smooth + 1);
          increase = increase * 0.5 + 0.5;               
          this.increaseHeat(i + si, j + sj, increase);
        }
      }
    }
  }

  increaseHeat(i, j, inc) {
    if (i < 0 || i >= 2 * this.numSquares) return;
    if (j < 0 || j >= 2 * this.numSquares) return;
    let val = this.heatmap[i][j];
    this.heatmap[i][j] = Math.max(val, inc);
  }

  getGridSquare(position) {
    const i = Math.floor((position.x + this.space) / this.squareSize);
    const j = Math.floor((position.y + this.space) / this.squareSize);
    return {i,j};
  }

  riskToCrash(position) {
    const {i,j} = this.getGridSquare(position);
    return this.heatmap[i][j];
  }

  getHeatmap() {
    return this.heatmap;
  }
}
