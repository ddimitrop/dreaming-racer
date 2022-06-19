let o1 = new Loop([l15, l7, l12, l13, l14]);
let o2 = new Loop([l19, l3, l11, l10]);
let o2r = new Loop([l10.reverse(), l11.reverse(), l3.reverse(), l19.reverse()]);
let m1 = new Point(2, 1);
let m2 = new Point(1, 3);
let k1 = new Vector(m1, m2);
let m3 = new Point(2, 4);
let k2 = new Vector(m2, m3);
let m4 = new Point(5, 5);
let k3 = new Vector(m3, m4);
let m5 = new Point(7, 3);
let k4 = new Vector(m4, m5);
let k5 = new Vector(m5, m1);
let m6 = new Point(6, 3);
let m7 = new Point(4, 3);
let m8 = new Point(3, 2);
let m9 = new Point(7, 5);
let m10 = new Point(4, 1);
let o3 = new Loop([k1, k2, k3, k4, k5]);
let m11 = new Point(7, 1);
let m12 = new Point(5, 4);
let m13 = new Point(1, 4);
let m14 = new Point(6, 4);
let k6 = new Vector(m2, m7);
let k7 = new Vector(m7, m6);
let k8 = new Vector(m6, m4);
let k9 = new Vector(m4, m9);
let k10 = new Vector(m9, m5);
let k11 = new Vector(m5, m10);
let k12 = new Vector(m10, m1);
let o4 = new Loop([k1, k6, k7, k8, k9, k10, k11, k12]);


(function testLoop(){
  (function testConstructor(){
    console.assert(o2r.vectors[0].equal(l19));
  })();
  (function testIsValid(){
    console.assert(o1.isValid());
    let end = o1.vectors[0].end
    o1.vectors[0].setAngle(1);
    o1.reportErrors = false;
    console.assert(!o1.isValid());
    o1.vectors[0].setEnd(end);
  })();
  (function testEncloses(){
    console.assert(o3.encloses(m6));
    console.assert(o3.encloses(m7));
    console.assert(o3.encloses(m8));
    console.assert(!o3.encloses(m9));
    console.assert(!o3.encloses(m10));

    console.assert(o4.encloses(m8));
    console.assert(o4.encloses(m14));
    console.assert(!o4.encloses(m13));
    console.assert(!o4.encloses(m3));
    console.assert(!o4.encloses(m11));
    console.assert(!o4.encloses(m12));
  })();
  (function testGetSvg(){
    console.assert(
      o1.getSvg('p1') ==
      '<path class="p1" d="M 8 10 L 3 -1 L -1 -5 L -6 -4 L -5 6 z"/>',
      `SVG ${o1.getSvg()}`);
  })();
})();
