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
      '<line class="test" x1="1" y1="5" x2="2" y2="8"/>',
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
