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
