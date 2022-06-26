function onReady(cb) {
  window.addEventListener('DOMContentLoaded', cb);
}

function asTimePasses(cb) {
  window.setInterval(cb, 200);
}

function onKey(keyCallbacks) {
  window.addEventListener('keydown', (event) => {
    callback = keyCallbacks[event.key];
    if (callback) callback();
  });
}
