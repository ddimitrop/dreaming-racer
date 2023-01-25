
class SelfDrivingRacer extends AutonomousRacer {
    showHeatMap = false;
    squareSize = 10;
    heatMap;
    maxDistance;
    angleOffset = Math.PI * 0.1;
    angleIterations = 3;
    maxRisk;

    constructor(raceTrack, speed, angleTurn, space, maxRisk = 0.4) {
      super(raceTrack, speed, angleTurn);
      this.space = space;
      this.maxDistance = this.space * 0.3;
      this.maxRisk = maxRisk;
    }

    getLabel() {
      const risk = Math.round(this.riskToCrash(this.position) * 100) / 100;
      return  `Risk to crash ${risk}`;
    }

    getSvg(className) {
      let svg = super.getSvg(className);
      let lSvg = '<g transform="scale(1, 1) translate(-300, -300)")">';
      let label =  this.getLabel();
      let space = this.space;
      lSvg += `<text transform="scale(1, -1)" x="0" y="-${2*space-20}"
                    class="${className}_label">
                ${label}
              </text>`;
     if (this.showHeatMap) {
        let hSvg = "";
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

    /** Override this to assess risk to crash based on learning */
    riskToCrash(position) {
      const distanceToWall = this.distanceToWall(position);
      if (distanceToWall > this.maxDistance) return 0;
      return (this.maxDistance - distanceToWall)/ this.maxDistance;
    }

    knowsHasToTurn() {
      const currentRisk = this.riskToCrash(this.position);
      if (currentRisk == null) return null;
      if (currentRisk > this.maxRisk) {
        let bestAngle = null;
        let bestRisk = null;
        for (let i = 1 - this.angleIterations; i < this.angleIterations; i++) {
          let angle = this.angle + i * this.angleOffset;
          let position = this.getNextWithAngle(this.position, angle);
          if (!this.isPointInTrack(position)) continue;
          const risk = this.riskToCrash(position);
          if (!bestRisk || bestRisk > risk) {
             bestRisk = risk;
             bestAngle = angle;
          }
        }
        return bestAngle;
      }
      return null;
    }


    getHeatMap() {
      const numSquares = Math.round(this.space/this.squareSize);
      if (this.heatmap && this.heatmap.length === 2 * numSquares) {
        return this.heatmap;
      }

      this.heatmap = [];

      for (let i = 0; i < 2 * numSquares; i++) {
        this.heatmap.push([])
        for (let j = 0; j < 2 * numSquares; j++) {
          const position = new Point(
            (i - numSquares) * this.squareSize,
            (j - numSquares) * this.squareSize);
          if (!this.isPointInTrack(position)) {
            this.heatmap[i].push(1);
            continue;
          };
          const risk = this.riskToCrash(position);
          this.heatmap[i].push(risk);
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
