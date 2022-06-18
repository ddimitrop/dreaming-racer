let p1 = new Point(1, 5);
let p2 = new Point(2, 8);
let p3 = new Point(1, 3);
let p4 = new Point(8, 10);
let p5 = new Point(-1, 4);
let p6 = new Point(-3, 1);
let p7 = new Point(2, 3);
let p8 = new Point(3, -1);
let p9 = new Point(-1, -5);
let p10 = new Point(-6, -4);
let p11 = new Point(-5, 6);
let p12 = new Point(-7, -7);
let p13 = new Point(-3, -7);
let p14 = new Point(2, 2);
let p15 = new Point(0, 0);
let p16 = new Point(1, 4);
let p17 = new Point(5, 1);


(function testPoint(){
  (function testDistance(){
    console.assert(p1.distance(p2) == 3.1622776601683795, `${p1.distance(p2)}`);
    console.assert(p2.distance(p1) == p2.distance(p1));
    console.assert(p1.distance(p3) == 2, `${p1.distance(p3)}`);
    console.assert(p1.distance(p4) == 8.602325267042627, `${p1.distance(p4)}`);
    console.assert(p1.distance(p5) == 2.23606797749979, `${p1.distance(p5)}`);
    console.assert(p1.distance(p6) == 5.656854249492381, `${p1.distance(p6)}`);
    console.assert(p1.distance(p7) == 2.23606797749979, `${p1.distance(p7)}`);
  })();

  (function testAngle(){
    // PI = 3.141592653589793
    // PI/2  = 1.5707963267948966
    // PI/4  = 0.7853981633974483
    console.assert(p1.angle(p2) == 1.2490457723982544, `${p1.angle(p2)}`);
    console.assert(p1.angle(p2) - p2.angle(p1) == Math.PI);
    console.assert(p1.angle(p3) == -Math.PI/2, `${p1.angle(p3)}`);
    console.assert(p1.angle(p4) == 0.6202494859828215, `${p1.angle(p4)}`);
    console.assert(p1.angle(p5) == -2.677945044588987, `${p1.angle(p5)}`);
    console.assert(p1.angle(p6) == -2.356194490192345, `${p1.angle(p6)}`);
    console.assert(p1.angle(p7) == -1.1071487177940904, `${p1.angle(p7)}`);
  })();

  (function testIsEnclosed(){
    console.assert(p5.isEnclosed(p11, p9, p4));
    console.assert(p2.isEnclosed(p11, p10, p4));
    console.assert(p14.isEnclosed(p15, p16, p17));
    console.assert(!p8.isEnclosed(p11, p10, p4));
  })();

})();

let l1 = new Vector(p1, p2);
let l2 = new Vector(p3, p1);
let l3 = new Vector(p1, p7);
let l4 = new Vector(p5, p4);
let l5 = new Vector(p5, p6);
let l6 = new Vector(p6, p8);
let l7 = new Vector(p4, p8);
let l8 = new Vector(p2, p4);
let l9 = new Vector(p6, p2);
let l10 = new Vector(p3, p5);
let l11 = new Vector(p7, p3);
let l12 = new Vector(p8, p9);
let l13 = new Vector(p9, p10);
let l14 = new Vector(p10, p11);
let l15 = new Vector(p11, p4);
let l16 = new Vector(p11, p2);
let l17 = new Vector(p12, p6);
let l18 = new Vector(p6, p13);
let l19 = new Vector(p5, p1);

(function testVector(){
  (function testGetSvg(){
    console.assert(l1.getSvg("test") ==
      '<line id="test" x1="1" y1="5" x2="2" y2="8"/>',
      `${l1.getSvg("test")}`);
  })();
  (function testIntersects(){
    console.assert(l1.intersects(l4));
    console.assert(l4.intersects(l1));
    console.assert(l13.intersects(l17));
    console.assert(l13.intersects(l18));
    console.assert(l17.intersects(l13));
    console.assert(l18.intersects(l13));
    console.assert(l6.intersects(l9));
    console.assert(l9.intersects(l6));
    console.assert(!l9.intersects(l14));
    console.assert(!l3.intersects(l4));
    console.assert(!l10.intersects(l3));
  })();
})();

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
      '<path id="p1" d="M 8 10 L 3 -1 L -1 -5 L -6 -4 L -5 6 z"/>',
      `SVG ${o1.getSvg()}`);
  })();
})();

(function testVector1(){
  (function testAngle(){
  })();
  (function testAngle(){
  })();
  (function testAngle(){
  })();
  (function testAngle(){
  })();
  (function testAngle(){
  })();
})();
