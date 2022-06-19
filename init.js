function initDynamicLoop() {
  let space = 600;
  let component = Loop.makeDynamic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 10 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 20 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space/10 /* minCornerDistance */,
    10 /* historyTrack */);
}

function initDynamicRaceTrack() {
  let space = 600;
  let component = RaceTrack.makeDynamic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 10 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 20 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space/10 /* minCornerDistance */,
    10 /* historyTrack */);
}

function initDynamicRaceTrackSingle() {
  let space = 600;
  let component = RaceTrack.makeDynamic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 10 /* initVectorsVar */,
    0.5 /* dynamicVectorsPc */,
    space / 20 /* dynamicVectorsVar */,
    0.2 /* maxAngleVariation */,
    space/10 /* minCornerDistance */,
    1 /* historyTrack */);
}

function initStaticRaceTrack() {
  let space = 600;
  let component = RaceTrack.makeStatic(
    space /* space */,
    space * 0.4 /* spaceToUse */,
    10 /* vectors */,
    0.3 /* initVectorsPc */,
    space / 10 /* initVectorsVar */,
    0.2 /* maxAngleVariation */,
    space/10 /* minCornerDistance */);
}
