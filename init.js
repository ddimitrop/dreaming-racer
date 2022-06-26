function initDynamicLoop() {
  let space = 300;
  let component = Loop.makeDynamic(
    space /* space */,
    space * 0.8 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 5 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 10 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space / 5 /* minCornerDistance */,
    10 /* historyTrack */);
}

function initDynamicRaceTrack() {
  let space = 300;
  let component = RaceTrack.makeDynamic(
    space /* space */,
    space * 0.8 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 5 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 10 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space / 5 /* minCornerDistance */,
    10 /* historyTrack */);
}

function initDynamicRaceTrackSingle() {
  let space = 300;
  let component = RaceTrack.makeDynamic(
    space /* space */,
    space * 0.8 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 5 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 10 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space / 5 /* minCornerDistance */,
    1 /* historyTrack */);
}

function initStaticRaceTrack() {
  let space = 300;
  let component = RaceTrack.makeStatic(
    space /* space */,
    space * 0.8 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 5 /* initVectorsVar */,
    0.2 /* maxAngleVariation */,
    space / 5 /* minCornerDistance */);
}

function ininNonAutonomousRacer() {
  let space = 300;
  let component = Racer.makeStatic(
    space /* space */,
    space * 0.8 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 5 /* initVectorsVar */,
    0.2 /* maxAngleVariation */,
    space / 5 /* minCornerDistance */,
    1 /* historySize */,
    space / 15  /* speed */,
    Math.PI / 10 /* angleTurn */,
    true /* drivingSupport */);
  window.racer = component.instances[1];
}
