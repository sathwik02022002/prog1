/* drawstuff.js - ray caster for axis-aligned boxes
   - Part1: flat (unlit) diffuse color
   - Part2: Blinn-Phong shading (toggle with 'L')
   - Part3: simple creative mode (toggle with Space)
   - Keys: L = toggle lighting, Space = toggle interesting, R = re-render
*/

/* -------------------- Color class (kept from original) -------------------- */

// Color constructor
class Color {
  constructor(r, g, b, a) {
    try {
      if (
        typeof r !== "number" ||
        typeof g !== "number" ||
        typeof b !== "number" ||
        typeof a !== "number"
      )
        throw "color component not a number";
      else if (r < 0 || g < 0 || b < 0 || a < 0)
        throw "color component less than 0";
      else if (r > 255 || g > 255 || b > 255 || a > 255)
        throw "color component bigger than 255";
      else {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
      }
    } catch (e) {
      // end try

      console.log(e);
    }
  } // end Color constructor

  // Color change method
  change(r, g, b, a) {
    try {
      if (
        typeof r !== "number" ||
        typeof g !== "number" ||
        typeof b !== "number" ||
        typeof a !== "number"
      )
        throw "color component not a number";
      else if (r < 0 || g < 0 || b < 0 || a < 0)
        throw "color component less than 0";
      else if (r > 255 || g > 255 || b > 255 || a > 255)
        throw "color component bigger than 255";
      else {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
      }
    } catch (e) {
      // end throw

      console.log(e);
    }
  } // end Color change method
} // end color class

/* -------------------- Basic utilities (kept/adapted) -------------------- */

// draw a pixel at x,y using color
function drawPixel(imagedata, x, y, color) {
  try {
    if (typeof x !== "number" || typeof y !== "number")
      throw "drawpixel location not a number";
    else if (x < 0 || y < 0 || x >= imagedata.width || y >= imagedata.height)
      throw "drawpixel location outside of image";
    else if (color instanceof Color) {
      var pixelindex = (y * imagedata.width + x) * 4;
      imagedata.data[pixelindex] = color.r;
      imagedata.data[pixelindex + 1] = color.g;
      imagedata.data[pixelindex + 2] = color.b;
      imagedata.data[pixelindex + 3] = color.a;
    } else throw "drawpixel color is not a Color";
  } catch (e) {
    // end try

    console.log(e);
  }
} // end drawPixel

/* -------------------- JSON loaders (boxes) -------------------- */

function getInputBoxes() {
  const INPUT_BOXES_URL = "https://ncsucgclass.github.io/prog1/boxes.json";
  var httpReq = new XMLHttpRequest();
  httpReq.open("GET", INPUT_BOXES_URL, false);
  httpReq.send(null);
  var startTime = Date.now();
  while (httpReq.status !== 200 && httpReq.readyState !== XMLHttpRequest.DONE) {
    if (Date.now() - startTime > 3000) break;
  }
  if (httpReq.status !== 200 || httpReq.readyState !== XMLHttpRequest.DONE) {
    console.log("Unable to open input boxes file!");
    return String.null;
  } else {
    return JSON.parse(httpReq.response);
  }
}

/* -------------------- Vector helpers -------------------- */

function vec3(x, y, z) {
  return [x, y, z];
}
function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function mul(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function length(v) {
  return Math.sqrt(dot(v, v));
}
function normalize(v) {
  var L = length(v);
  return L === 0 ? [0, 0, 0] : [v[0] / L, v[1] / L, v[2] / L];
}
function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/* -------------------- Ray-AABB intersection (slab method) --------------------
   Returns {hit:true, t:..., point:[...], normal:[...]} or {hit:false}
   Ray: origin o, direction d (should be normalized)
   Box: expects fields lx,rx,by,ty,fz,rz (world coords in [0..1] per spec)
--------------------------------------------------------------------------- */

function intersectRayAABB(o, d, box) {
  const EPS = 1e-8;
  var lx = box.lx,
    rx = box.rx,
    by = box.by,
    ty = box.ty,
    fz = box.fz,
    rz = box.rz;

  var tmin = -Infinity,
    tmax = Infinity;
  var hitNormal = [0, 0, 0];
  // X slab
  if (Math.abs(d[0]) < EPS) {
    if (o[0] < lx - EPS || o[0] > rx + EPS) return { hit: false };
  } else {
    var tx1 = (lx - o[0]) / d[0];
    var tx2 = (rx - o[0]) / d[0];
    var txmin = Math.min(tx1, tx2),
      txmax = Math.max(tx1, tx2);
    if (txmin > tmin) {
      tmin = txmin;
      // face corresponding to entering X slab
      hitNormal = tx1 < tx2 ? [-1, 0, 0] : [1, 0, 0];
    }
    if (txmax < tmax) tmax = txmax;
  }
  // Y slab
  if (Math.abs(d[1]) < EPS) {
    if (o[1] < by - EPS || o[1] > ty + EPS) return { hit: false };
  } else {
    var ty1 = (by - o[1]) / d[1];
    var ty2 = (ty - o[1]) / d[1];
    var tymin = Math.min(ty1, ty2),
      tymax = Math.max(ty1, ty2);
    if (tymin > tmin) {
      tmin = tymin;
      hitNormal = ty1 < ty2 ? [0, -1, 0] : [0, 1, 0];
    }
    if (tymax < tmax) tmax = tymax;
  }
  // Z slab
  if (Math.abs(d[2]) < EPS) {
    if (o[2] < fz - EPS || o[2] > rz + EPS) return { hit: false };
  } else {
    var tz1 = (fz - o[2]) / d[2];
    var tz2 = (rz - o[2]) / d[2];
    var tzmin = Math.min(tz1, tz2),
      tzmax = Math.max(tz1, tz2);
    if (tzmin > tmin) {
      tmin = tzmin;
      hitNormal = tz1 < tz2 ? [0, 0, -1] : [0, 0, 1];
    }
    if (tzmax < tmax) tmax = tzmax;
  }

  if (tmax >= Math.max(tmin, 0.0)) {
    var tHit = tmin >= 0.0 ? tmin : tmax;
    if (tHit < 0) return { hit: false };
    var pHit = add(o, mul(d, tHit));
    var normal = hitNormal.slice();
    if (tmin < 0) normal = mul(normal, -1.0); // ray started inside box
    return { hit: true, t: tHit, point: pHit, normal: normalize(normal) };
  } else {
    return { hit: false };
  }
}

/* -------------------- Blinn-Phong shading --------------------
   material: {ambient[], diffuse[], specular[], n}
   light: {pos:[x,y,z], ambient:[r,g,b], diffuse:[r,g,b], specular:[r,g,b]}
   pos: intersection point, normal: normalized, viewDir: dir toward eye (normalized)
   fragDiffuse: base diffuse color (from JSON) vector [r,g,b] in 0..1
   returns [r,g,b] in 0..1
--------------------------------------------------------------------------- */

function blinnPhong(material, light, pos, normal, viewDir, fragDiffuse) {
  var N = normalize(normal);
  var L = normalize(sub(light.pos, pos));
  var V = normalize(viewDir);
  var H = normalize(add(L, V));

  // ambient
  var ambient = [
    material.ambient[0] * light.ambient[0],
    material.ambient[1] * light.ambient[1],
    material.ambient[2] * light.ambient[2],
  ];

  // diffuse
  var ndotl = Math.max(0.0, dot(N, L));
  var diffuse = [
    fragDiffuse[0] * light.diffuse[0] * ndotl,
    fragDiffuse[1] * light.diffuse[1] * ndotl,
    fragDiffuse[2] * light.diffuse[2] * ndotl,
  ];

  // specular
  var ndoth = Math.max(0.0, dot(N, H));
  var specFactor = Math.pow(ndoth, material.n);
  var specular = [
    material.specular[0] * light.specular[0] * specFactor,
    material.specular[1] * light.specular[1] * specFactor,
    material.specular[2] * light.specular[2] * specFactor,
  ];

  return [
    clamp01(ambient[0] + diffuse[0] + specular[0]),
    clamp01(ambient[1] + diffuse[1] + specular[1]),
    clamp01(ambient[2] + diffuse[2] + specular[2]),
  ];
}

/* -------------------- Renderer --------------------
   renderScene(context, useLighting, interestingMode)
--------------------------------------------------------------------------- */

function renderScene(context, useLighting, interestingMode) {
  var boxes = getInputBoxes();
  if (boxes == String.null) {
    console.log("No boxes loaded");
    return;
  }

  var w = context.canvas.width;
  var h = context.canvas.height;
  var imagedata = context.createImageData(w, h);

  // camera and window setup (per spec)
  var eye = vec3(0.5, 0.5, -0.5);
  var windowZ = 0.0; // window centered at z=0, size 1x1 in x/y, x,y in [0..1]

  // main (white) light
  var mainLight = {
    pos: vec3(-0.5, 1.5, -0.5),
    ambient: [1, 1, 1],
    diffuse: [1, 1, 1],
    specular: [1, 1, 1],
  };

  // optional second colored light for interesting mode
  var secondLight = {
    pos: vec3(1.5, 0.0, -0.5),
    ambient: [0, 0, 0],
    diffuse: [0.4, 0.2, 0.8],
    specular: [0.2, 0.2, 0.2],
  };

  // loop over pixels (pixel-major)
  for (var j = 0; j < h; j++) {
    for (var i = 0; i < w; i++) {
      // map pixel center to window coordinates (x,y in [0..1])
      var u = (i + 0.5) / w;
      var v = (j + 0.5) / h;
      var pixelPos = vec3(u, v, windowZ);

      var o = eye;
      var d = normalize(sub(pixelPos, eye)); // ray direction

      // find nearest intersection
      var nearestT = Infinity;
      var nearestHit = null;
      var nearestBoxIdx = -1;
      for (var b = 0; b < boxes.length; b++) {
        var hit = intersectRayAABB(o, d, boxes[b]);
        if (hit.hit && hit.t < nearestT) {
          nearestT = hit.t;
          nearestHit = hit;
          nearestBoxIdx = b;
        }
      }

      // default background color (black)
      var finalColor = new Color(0, 0, 0, 255);

      if (nearestHit) {
        // get material fields (some files might not include ambient/specular/n so use defaults)
        var box = boxes[nearestBoxIdx];
        var material = {
          ambient: box.ambient || [0.1, 0.1, 0.1],
          diffuse: box.diffuse || [0.6, 0.6, 0.6],
          specular: box.specular || [0.3, 0.3, 0.3],
          n: box.n || 16,
        };

        if (!useLighting) {
          // Part1: flat color (diffuse directly)
          var r = Math.round(clamp01(material.diffuse[0]) * 255);
          var g = Math.round(clamp01(material.diffuse[1]) * 255);
          var bcol = Math.round(clamp01(material.diffuse[2]) * 255);
          finalColor = new Color(r, g, bcol, 255);
        } else {
          // Part2: shading
          var viewDir = mul(d, -1.0); // dir from surface toward eye
          var baseDiffuse = material.diffuse.slice();

          // Part3 interesting tint per box if mode enabled
          if (interestingMode) {
            var tint = (nearestBoxIdx % 5) * 0.04;
            baseDiffuse[0] = clamp01(baseDiffuse[0] + tint);
            baseDiffuse[1] = clamp01(baseDiffuse[1] + tint * 0.5);
            baseDiffuse[2] = clamp01(baseDiffuse[2] + tint * 0.2);
          }

          var col = blinnPhong(
            material,
            mainLight,
            nearestHit.point,
            nearestHit.normal,
            viewDir,
            baseDiffuse
          );

          if (interestingMode) {
            var add = blinnPhong(
              material,
              secondLight,
              nearestHit.point,
              nearestHit.normal,
              viewDir,
              baseDiffuse
            );
            col[0] = clamp01(col[0] + 0.6 * add[0]);
            col[1] = clamp01(col[1] + 0.6 * add[1]);
            col[2] = clamp01(col[2] + 0.6 * add[2]);
          }

          finalColor = new Color(
            Math.round(col[0] * 255),
            Math.round(col[1] * 255),
            Math.round(col[2] * 255),
            255
          );
        }
      }

      // write into image buffer
      var idx = (j * w + i) * 4;
      imagedata.data[idx] = finalColor.r;
      imagedata.data[idx + 1] = finalColor.g;
      imagedata.data[idx + 2] = finalColor.b;
      imagedata.data[idx + 3] = finalColor.a;
    }
  }

  context.putImageData(imagedata, 0, 0);
}

/* -------------------- Main + keyboard controls -------------------- */

var globalUseLighting = false;
var globalInteresting = false;

function main() {
  var canvas = document.getElementById("viewport");
  if (!canvas) {
    console.log("No canvas with id 'viewport' found.");
    return;
  }
  var context = canvas.getContext("2d");

  // keyboard toggles
  window.addEventListener("keydown", function (e) {
    if (e.code === "KeyL") {
      globalUseLighting = !globalUseLighting;
      console.log("Lighting:", globalUseLighting);
      renderScene(context, globalUseLighting, globalInteresting);
    } else if (e.code === "Space") {
      e.preventDefault();
      globalInteresting = !globalInteresting;
      globalUseLighting = true; // show lighting when toggling interesting mode
      console.log("Interesting mode:", globalInteresting);
      renderScene(context, globalUseLighting, globalInteresting);
    } else if (e.code === "KeyR") {
      console.log("Re-render");
      renderScene(context, globalUseLighting, globalInteresting);
    }
  });

  // initial render: Part1 (flat)
  globalUseLighting = false;
  globalInteresting = false;
  renderScene(context, globalUseLighting, globalInteresting);
}

// call main on load
window.onload = main;
