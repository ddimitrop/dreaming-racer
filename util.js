function onReady(cb) {
  window.addEventListener('DOMContentLoaded', cb);
}

function asTimePasses(cb) {
  window.setInterval(cb, 200);
}
