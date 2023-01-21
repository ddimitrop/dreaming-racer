
class SelfDrivingRacer extends AutonomousRacer {
    //minAngleOffset = Math.PI * 0.1;
    // maxRandomExtraOffset = Math.PI * 0.3;
    showHeatMap = false;
    squareSize = 10;
    predictType = 'raw';
    heatMap;
    maxDistance;
    angleOffset = Math.PI * 0.1;
    angleIterations = 3;

    constructor(raceTrack, speed, angleTurn, space) {
      super(raceTrack, speed, angleTurn);
      this.space = space;
      this.maxDistance = this.space * 0.2;
    }

    getSvg(className) {
      let svg = super.getSvg(className);
      let lSvg = '<g transform="scale(1, 1) translate(-300, -300)")">';
      const minDistance = Math.round(this.closestVectorIn().distance);
      let label =  `Minimum distance ${minDistance}`;
      /*
      if (this.learningMachine.isCollecting()) {
        let finalCount = this.learningMachine.finalCount;
        let samplesToUse = this.learningMachine.samplesToUse;
        label = `Collecting samples ... ${finalCount}/${samplesToUse}`
      } else {
        let isStuck = this.learningMachine.predictHit(this.nextPosition, this.predictType);
        let isStuckChance = Math.round(100 * isStuck);
        label = `Collision Chance: ${isStuckChance}%`
      }
      */
      let space = this.space;
      lSvg += `<text transform="scale(1, -1)" x="0" y="-${2*space-20}"
                    class="${className}_label">
                ${label}
              </text>`;
     if (this.showHeatMap) {
        let hSvg = "";
        //const heatMap = this.learningMachine.getHeatMap(this.predictType, this.squareSize);
        const heatMap = this.getHeatMap();
        let squareSize = this.squareSize;
        for (let i = 0; i < heatMap.length; i++) {
          let hrow = heatMap[i];
          for (let j = 0; j < hrow.length; j++) {
            let v = heatMap[i][j];
            let color = 'transparent';
            if (v != null) {
              v = Math.round(v * 1000)/1000;
              color = `hsl(${135*(1-v)}, 80%, 70%)`;
            }

            hSvg += `<rect class="${className}_heatMap" fill="${color}"
                           x="${i*squareSize}" y="${j*squareSize}"
                           width="${squareSize}" height="${squareSize}"/>
                    `;
          }
        }
        lSvg += hSvg;
      }
      lSvg += "</g>"
      return svg + lSvg;
    }

    knowsHasToTurn() {
      if (this.closestVectorIn().distance < this.maxDistance) {
        let bestAngle = null;
        let bestDist = null;
        for (let i = 1 - this.angleIterations; i < this.angleIterations; i++) {
          let angle = this.angle + i * this.angleOffset;
          let position = this.getNextWithAngle(this.position, angle);
          if (!this.isPointInTrack(position)) continue;
          const dist = this.distanceToWall(position);
          if (!bestDist || bestDist < dist) {
             bestDist = dist;
             bestAngle = angle;
          }
        }
        // Make sure you return a nonReflex angle
        //  bestAngle = Point.nonReflex(bestAngle)

        return bestAngle;
      }
      return null;
    }


    getHeatMap() {
      const numSquares = Math.round(this.space/this.squareSize);
      if (this.heatmap && this.heatmap.length === 2 * numSquares) {
        return this.heatmap;
      }
      let maxDistance = 0;
      this.heatmap = [];
      for (let i = 0; i < 2 * numSquares; i++) {
        this.heatmap.push([])
        for (let j = 0; j < 2 * numSquares; j++) {
          const corner = new Point(
            (i - numSquares) * this.squareSize,
            (j - numSquares) * this.squareSize);
          const distance = this.distanceToWall(corner);
          this.heatmap[i].push(distance);
          maxDistance = Math.max(maxDistance, distance);
        }
      }
      for (let i = 0; i < 2 * numSquares; i++) {
        for (let j = 0; j < 2 * numSquares; j++) {
          const distance = this.heatmap[i][j];
          let risk = (maxDistance - distance)/maxDistance;
          if (risk < 0.85) risk = risk * 0.8;
          this.heatmap[i][j] = risk;
        }
      }

      return this.heatmap;
    }

    // Similar to other helpers - just boilerplate.
    static makeStatic(space, spaceToUse, vectors, initVectorsPc, initVectorsVar,
       maxAngleVariation, minCornerDistance, historyTrack, speed, angleTurn) {
        let component = RaceTrack.makeStatic(space, spaceToUse, vectors,
             initVectorsPc, initVectorsVar, maxAngleVariation, minCornerDistance);
        let raceTrack = component.instance;
        let racer = new SelfDrivingRacer(raceTrack, speed, angleTurn, space);
        component.addInstance('racer', racer, 1);
        asTimePasses(() => {
          component.refresh();
        });
        return component;
    }

  }
