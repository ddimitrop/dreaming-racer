function onReady(cb) {
  window.addEventListener('DOMContentLoaded', cb);
}

speedDelay = 200;
timeConfigs = [];

function asTimePasses(cb) {
  timeConfigs.push({
    callback: cb,
    intervalId: window.setInterval(cb, speedDelay),
  })
}

function toggleSpeed() {
  speedDelay = (speedDelay === 200) ? 10 : 200;
  updateSpeeds();
}

function updateSpeeds() {
  for (const config of timeConfigs) {
    clearInterval(config.intervalId);
    config.intervalId = window.setInterval(config.callback, speedDelay);
  }
}

function onKey(keyCallbacks) {
  window.addEventListener('keydown', (event) => {
    callback = keyCallbacks[event.key];
    if (callback) callback();
  });
}
