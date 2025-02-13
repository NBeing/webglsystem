import * as twgl from "twgl.js"
import * as css from "./style/style.css"
import { vec2, mat3, mat4, vec3 } from "gl-matrix"

import spriteImg from "./img/sprite.png"
import flowas from "./img/flowas.jpg"

import vid from "./img/wawa.mp4"
let copyVideo = false;

//Shaders and Assets
const fragmentShaderText = require("./shaders/fragment.glsl").default
const vertexShaderText = require("./shaders/vertex.glsl").default
const colorFragmentShaderText = require("./shaders/color_fragment.glsl").default
const colorVertexShaderText = require("./shaders/color_vertex.glsl").default
const fragmentDitherText = require("./shaders/fragment_dither.glsl").default
const fragmentDither2Text = require("./shaders/fragment_dither2.glsl").default
const threedfragmentShaderText = require("./shaders/3d_fragment.glsl").default
const threedvertexShaderText = require("./shaders/3d_vertex.glsl").default

// console.log("Sp", spriteImg)
let gl = null
let isPaused = false
let playing = true
let _APP
let data = []
let playbackRate = 1

const degreesToRadians = (degrees) => {
  return degrees * ((Math.PI) / 180)
}

const m4 = {
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },
 
  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },
 
  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },
 
  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },
 
  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },
 
  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },
 
  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },
 
  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },
 
  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },
  multiply: function(a, b) {
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
 
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },
  projection: function(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },
};

const lsystems = {
  algae2 : {
    axiom : "aF",
    rules : {
     a: "FFFFFy[++++n][----t]fb",
     b: "+FFFFFy[++++n][----t]fc",
     c: "FFFFFy[++++n][----t]fd",
     d: "-FFFFFy[++++n][----t]fe",
     e: "FFFFFy[++++n][----t]fg",
     g: "FFFFFy[+++fa]fh",
     h: "FFFFFy[++++n][----t]fi",
     i: "+FFFFFy[++++n][----t]fj",
     j: "FFFFFy[++++n][----t]fk",
     k: "-FFFFFy[++++n][----t]fl",
     l: "FFFFFy[++++n][----t]fm",
     m: "FFFFFy[---fa]fa",
     n: "ofFFF",
     o: "fFFFp",
     p: "fFFF[-s]q",
     q: "fFFF[-s]r",
     r: "fFFF[-s]",
     s: "fFfF",
     t: "ufFFF",
     u: "fFFFv",
     v: "fFFF[+s]w",
     w: "fFFF[+s]x",
     x: "fFFF[+s]",
     y: "Fy",
   },
   theta : degreesToRadians(20)   
  },
  weed: {
    axiom : "F",
    rules : {
        F : "FF-[XY]+[XY]",
        X : "+FY",
        Y : "-FX",
    },
    theta : degreesToRadians(22.5)
  },
  saupe: { 
    axiom : "VZFFF",
    rules : {
      V : "[+++W][---W]YV",
      W : "+X[-W]Z",
      X : "-W[+X]Z",
      Y : "YZ",
      Z : "[-FFF][+FFF]F",
    },
    theta : degreesToRadians(20),
    length : 22,
    lineWidth : 30,
    iterations : 11,
    current_angle : 3 * Math.PI / 2,
  },
  realcool: {
    axiom : "F",
    rules : {F : "FF+[+F-F-F]-[-F+F+F]"},
    theta : degreesToRadians(22.5),
  },
  mess: {
    axiom: "F+F+F+F",
    rules: {
      "F": "FF+F-F+F+FF"
    },
    theta: degreesToRadians(70),
    length : 18,
    lineWidth : 10,
    iterations : 3,
    current_angle : 3 * Math.PI / 2,    
  },
  tree : {
    axiom : "X",
    rules : 
    {
      F : "FF",
      X : "F[+X]F[-X]+X",
    },
    theta : degreesToRadians(20),
    length:  4,
    lineWidth:  8,
    iterations:  6,
    current_angle:  3 * Math.PI / 2,    
  },
  rando3: {
    axiom : "F",
    rules : {
      F: "FF-[XY]+[XY]",
      X :"-FY",
      Y : "-FX"
    },
    theta : degreesToRadians(22.5),
    iterations: 6,
    current_angle : 0,
    length: 10,
    lineWidth: 10
  },
  rando4: {
    axiom : "X",
    rules : { 
      "F" : "FF",
      "X" : "F-[[X]+X]+F[+FX]-X",
    },
    theta : degreesToRadians(22.5)
  },
  rando5: {
    axiom : "X",
    rules :  {
      F : "FF",
      X : "F[+X]F[-X]+X",
    },
    theta : degreesToRadians(20)
  },
}


let kernels = {
  normal: [
    0, 0, 0,
    0, 1, 0,
    0, 0, 0,
  ],
  gaussianBlur: [
    0.045, 0.122, 0.045,
    0.122, 0.332, 0.122,
    0.045, 0.122, 0.045,
  ],
  gaussianBlur2: [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1,
  ],
  gaussianBlur3: [
    0, 1, 0,
    1, 1, 1,
    0, 1, 0,
  ],
  unsharpen: [
    -1, -1, -1,
    -1, 9, -1,
    -1, -1, -1,
  ],
  sharpness: [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0,
  ],
  sharpen: [
    -1, -1, -1,
    -1, 16, -1,
    -1, -1, -1,
  ],
  edgeDetect: [
    -0.125, -0.125, -0.125,
    -0.125, 1, -0.125,
    -0.125, -0.125, -0.125,
  ],
  edgeDetect2: [
    -1, -1, -1,
    -1, 8, -1,
    -1, -1, -1,
  ],
  edgeDetect3: [
    -5, 0, 0,
    0, 0, 0,
    0, 0, 5,
  ],
  edgeDetect4: [
    -1, -1, -1,
    0, 0, 0,
    1, 1, 1,
  ],
  edgeDetect5: [
    -1, -1, -1,
    2, 2, 2,
    -1, -1, -1,
  ],
  edgeDetect6: [
    -5, -5, -5,
    -5, 39, -5,
    -5, -5, -5,
  ],
  sobelHorizontal: [
    1, 2, 1,
    0, 0, 0,
    -1, -2, -1,
  ],
  sobelVertical: [
    1, 0, -1,
    2, 0, -2,
    1, 0, -1,
  ],
  previtHorizontal: [
    1, 1, 1,
    0, 0, 0,
    -1, -1, -1,
  ],
  previtVertical: [
    1, 0, -1,
    1, 0, -1,
    1, 0, -1,
  ],
  boxBlur: [
    0.111, 0.111, 0.111,
    0.111, 0.111, 0.111,
    0.111, 0.111, 0.111,
  ],
  triangleBlur: [
    0.0625, 0.125, 0.0625,
    0.125, 0.25, 0.125,
    0.0625, 0.125, 0.0625,
  ],
  emboss: [
    -2, -1, 0,
    -1, 1, 1,
    0, 1, 2,
  ],
};
let mouseXY = [0, 0]
onmousemove = (e) => { mouseXY = [e.x, e.y] }


function setupVideo(url) {
  const video = document.createElement("video");

  let playing = false;
  let timeupdate = false;

  video.playsInline = true;
  video.muted = true;
  video.loop = true;

  // Waiting for these 2 events ensures
  // there is data in the video

  video.addEventListener(
    "playing",
    () => {
      playing = true;
      checkReady();
      video.playbackRate = playbackRate;

    },
    true,
  );

  video.addEventListener(
    "timeupdate",
    () => {
      timeupdate = true;
      checkReady();
    },
    true,
  );

  video.src = url;
  video.play();

  function checkReady() {
    if (playing && timeupdate) {
      copyVideo = true;
    }
  }

  return video;
}
function initTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because video has to be download over the internet
  // they might take a moment until it's ready so
  // put a single pixel in the texture so we can
  // use it immediately.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  // Turn off mips and set wrapping to clamp to edge so it
  // will work regardless of the dimensions of the video.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}

function updateTexture(gl, texture, video) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    video,
  );
}

const meanings = {
  // move in
  "F": (config) => {
    let {
      axiom,
      rules,
      meanings,
      length,
      theta,
      iterations,
      current_x,
      current_y,
      current_angle
    } = config

    const next_x =
      (current_x) + (length * Math.cos(current_angle))
    // we flip the y axis because in p5 land, 
    // positive means "go down"
    // but in math land, negative means "go up"
    const next_y =
      (current_y) + (length * Math.sin(current_angle))

    data.push(
      current_x,
      current_y,
      next_x,
      next_y
    )
    config.current_x = next_x
    config.current_y = next_y
    return config
  },
  "f": (config) => {
    let {
      axiom,
      rules,
      meanings,
      length,
      theta,
      iterations,
      current_x,
      current_y,
      current_angle
    } = config

    const next_x =
      (current_x) + (length * Math.cos(current_angle))
    // we flip the y axis because in p5 land, 
    // positive means "go down"
    // but in math land, negative means "go up"
    const next_y =
      (current_y) + (length * Math.sin(current_angle))

    config.current_x = next_x
    config.current_y = next_y
    return config
  },
  "+": (config) => {
    // angle is in radians, and we want to change the angle in the direction
    config.current_angle = config.current_angle + config.theta// + Math.sin(Math.random() * (config.time * 0.0025) ) * 0.1021
    return config
  },
  "-": (config) => {
    // angle is in radians, and we want to change the angle in the direction
    config.current_angle = config.current_angle - config.theta// - Math.sin(Math.random() * config.time * 0.0025) * 0.0121
    return config
  },
  "|": (config) => {
    // reverse current angle
    config.current_angle = config.current_angle + Math.PI
    return config
  },
  "[": (config) => {
    config.stack.push({
      current_x: config.current_x,
      current_y: config.current_y,
      current_angle: config.current_angle,
    })

    return config
  },
  "]": (config) => {
    const previous_state = config.stack.pop(config)
    config.current_x = previous_state.current_x
    config.current_y = previous_state.current_y
    config.current_angle = previous_state.current_angle

    return config
  },
  "v": (config) => {
    config.current_angle = config.current_angle / 2
    return config
  },
  "^": (config) => {
    config.current_angle = config.current_angle + config.current_angle
    return config
  }

}
//  10,10,PI                    20,20,PI/2             ...   20,20.PI/2     
//  [                   F F F + [                          ] F           ] FF
//   angle1 pushed to stack     angle 2 pushed to stack                       
// write more

const drawTheThingIterative = (config) => {
  let {
    axiom,
    rules, // how to rewrite each token
    meanings, // what each token "does"
    length,  // line length
    theta, // theta
    iterations,      // iterations
    current_x, //starting_point_x,
    current_y, //starting_point_y
    current_angle,
    stack,
    time,
  } = config

  const rewrite = (rules, axiom) => {
    let tmp = []
    for (let i = 0; i < axiom.length; i++) {
      let current = axiom[i]
      if (rules[current]) {
        tmp.push(rules[current])
      } else {
        tmp.push(current)
      }
    }
    tmp = tmp.reduce((acc, cur) => {
      acc = acc.concat(cur)
      return acc

    }, "")
    return tmp
  }

  for (let j = 0; j < iterations; j++) {
    axiom = rewrite(rules, axiom)
  }


  Array.from(axiom).forEach(symbol => {
    // console.log("Looking at", meanings, symbol, config)
    if (meanings[symbol]) {
      config = meanings[symbol](config)
    }

  })
}

class Renderer {
  constructor() {
    this.init()
  }
    createIdentityMatrix3() {
      return mat3.fromValues(
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      )
    }

    createTranslationMatrix3(x, y){
      return mat3.fromValues(
        1, 0, 0,
        0, 1, 0,
        x, y, 1,
      )
    }

    createScaleMatrix3(scaleX, scaleY) {
      return mat3.fromValues(
        scaleX, 0, 0,
        0, scaleY, 0,
        0, 0, 1,
      )
    }
    createRotationMatrix3(angle) {
      const theta = degreesToRadians(angle)
      const cosRot = Math.cos(theta)
      const sinRot = Math.sin(theta)
      return mat3.fromValues(
        cosRot, -sinRot, 0,
        sinRot, cosRot, 0,
        0, 0, 1,
      )
    }
    computeKernelWeight(kernel) {
      var weight = kernel.reduce(function (prev, curr) {
        return prev + curr;
      });
      return weight <= 0 ? 1 : weight;
    }

  getLinePositions(x1, y1, x2, y2, width) {
    // 0 1 2 
    // 3 1 2
    if (y1 == y2) {
      return [
        x1 - (width / 2), y1 + (width / 2), // point 1 - 0,0
        x1 + (width / 2), y1 - (width / 2), // point 2 - width, 0
        x2 - (width / 2), y2 + (width / 2), // point 3 - 0, height    
        x2 + (width / 2), y2 - (width / 2), // point 4 - width height
      ]
    }
    return [
      x1 - (width / 2), y1, // point 1 - 0,0
      x1 + (width / 2), y1, // point 2 - width, 0
      x2 - (width / 2), y2, // point 3 - 0, height    
      x2 + (width / 2), y2  // point 4 - width height
    ]
  }
  generateIndices = (triangle_positions) => {
    let result = []
    let times_around = 0

    for (let i = 0; i < triangle_positions.length; i = i + 8) {
      // console.log(pos[i % 6])
      result.push(
        // pos[i % 6] + times_around
        (times_around * 4),
        (times_around * 4) + 1,
        (times_around * 4) + 2,
        (times_around * 4) + 3,
        (times_around * 4) + 1,
        (times_around * 4) + 2,
      )
      times_around++
    }
    return result
  }
  getRectanglePositionsElementArr(x, y, width, height) {
    let x1 = x; // 0
    let x2 = x + width; // canvas width

    let y1 = y; // 0
    let y2 = y + height; // canvas height
    return [
      x1, y1, // 0,0
      x1, y2, // 0, height    
      x2, y1, // width, 0
      x2, y2, // width height
    ]
  }
  generateLSystem(width, height, two){
    let current_lsystem = lsystems.saupe
    let defaultLength = 25
    this.defaultLineWidth = current_lsystem.lineWidth || 10 
    let defaultIterations = 10
    let defaultCurrent_angle = 0

    let current_x = 0//-mouseXY[0]
    let current_y = height/2//mouseXY[1]
    try {
      drawTheThingIterative({
        axiom: current_lsystem.axiom,
        rules: current_lsystem.rules, // how to rewrite each token
        meanings, // what each token "does"
        length: current_lsystem.length || defaultLength,  // line length
        theta: current_lsystem.theta, // theta
        iterations: current_lsystem.iterations || defaultIterations,      // iterations
        current_x, //starting_point_x,
        current_y, //starting_point_y.
        current_angle: current_lsystem.current_angle || defaultCurrent_angle,
        stack: [],
        time: two,
      })
      this.frameCount = 0
      this.last_id = 0

    } catch (e) {
      console.log("error:", e)
    }
  }
  getLSystemLinePositions(){
    let positions = []
    try {
      for(let i = 0; i < data.length; i = i+4){
        let r = this.getLinePositions(
          data[i], 
          data[i+1],
          data[i+2],
          data[i+3], 
          this.defaultLineWidth
        )
          r.forEach( x => {
            positions.push(x)
          })
      }
      return positions
    } catch(e){
      console.log("E", e )
    }
  }
  generateThreeDeeTexCoords = (positions) => {
    let result = []
    for(let i = 0; i < positions.flat().length; i+=9){
      result.push(
        0,  0, 
        0,  1,
        1,  0,
        
        0, 1,
        1, 1, 
        1, 0,
      )
    }
    return result.flat()
  }
  generateTexCoords = (positions) => {
    let result = []
    // let rand = Math.floor(one * 10000);
    positions.forEach(p => {
      result.push([
        0, 0,
        1., 0,
        0, 1.,
        1., 1.
      ])
    })
    return result.flat()
  }

  renderLSystem(one,two){
    // did we need to do this?
    // this.clearAndSetViewport()
    data = []
    if (copyVideo) {
      updateTexture(gl, this.videoTex, this.video);
    }
    let width = window.innerWidth
    let height = window.innerHeight
  
    this.generateLSystem(width,height, two)    
  
    let __positions = this.lastPositions || []
    
    __positions.push(
      ...this.getRectanglePositionsElementArr(
        -width/2, -height/2, width, height
      ),
      ...this.getLSystemLinePositions(data)
    )
      
    this.programInfo = twgl.createProgramInfo(gl, [vertexShaderText, fragmentShaderText])
    this.positions = new Float32Array(__positions);
    this.indices = this.generateIndices(__positions)
    this.uniforms = {
      u_resolution: vec2.fromValues(width, height)
    }
    this.arrays = {
      a_position: {
        numComponents: 2,
        data: this.positions
      },
      indices: { 
        numComponents: 2, 
        data: this.indices 
      },
      a_texCoord: { 
        numComponents: 2, 
        data: this.generateTexCoords(__positions) 
      },
    };
    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, this.arrays)
  
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  
    const angleInRadians = degreesToRadians(one);
  
    const translationMatrix = this.createTranslationMatrix3(width / 2, height / 2)
    const scaleMatrix = this.createScaleMatrix3(1., 1., 1)
    const rotationMatrix = this.createRotationMatrix3(90)
    let u_matrix = mat3.create()
    mat3.multiply(u_matrix, u_matrix, translationMatrix)
    mat3.multiply(u_matrix, u_matrix, rotationMatrix)
    mat3.multiply(u_matrix, u_matrix, scaleMatrix)
  
    // u_matrix = mat3.multiply(u_matrix,  scaleMatrix, u_matrix)
    // console.log("result", u_matrix)
  
    // From the book:
    // This method will turn clockwise
    // let u_rotation = [
    //   Math.sin(angleInRadians),
    //   Math.cos(angleInRadians),
    // ]
    // The way I found it in the math book
    // This way will turn counterclockwise
    let u_rotation = [
      Math.cos(angleInRadians),
      Math.sin(angleInRadians),
    ]
    // gl.bindTexture(gl.TEXTURE_2D, textures.checker);
    // let u_matrix = mat3.create()
    // let kernelToUse = this.lastKernel || kernels.emboss
    // if (two % 60 == 0) {
    //   // Object.keys(kernel).length
    //   let keys = Object.keys(kernels)
    //   let randint = Math.floor(Math.random() * keys.length)
    //   let randkey = keys[randint]
    //   kernelToUse = kernels[randkey]
    //   this.lastKernel = kernelToUse
    // }
  
    const kernelToUse = kernels.unsharpen
    const uniforms = {
      u_resolution: vec2.fromValues(window.innerWidth, window.innerHeight),
      u_scale: [1, 1],
      u_translation: [width / 2, height / 2],
      u_rotation,
      texture: this.videoTex,
      texture2: this.textures.flowas,
      u_matrix,
      u_kernelWeight: this.computeKernelWeight(kernelToUse),
      "u_kernel": kernelToUse
  
    }
    gl.useProgram(this.programInfo.program)
  
    // using multiple matrices 
    // for( let i = 0 ; i < 8; i++){
    //   const translationMatrix = createTranslationMatrix3(200 + i * 100, 200 + i * 100)
    //   const scaleMatrix = createScaleMatrix3(0.75,0.75,1)
    //   const rotationMatrix = createRotationMatrix3(10 + i * 10) 
    //   mat3.multiply(u_matrix, u_matrix, translationMatrix)
    //   mat3.multiply(u_matrix, u_matrix, rotationMatrix)
    //   mat3.multiply(u_matrix, u_matrix, scaleMatrix)
  
    //   twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
    //   twgl.setUniforms(this.programInfo, uniforms)
    //   twgl.drawBufferInfo(gl, this.bufferInfo);
    // }
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
    twgl.setUniforms(this.programInfo, uniforms)
    twgl.drawBufferInfo(gl, this.bufferInfo);
  
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }
  }
  renderMultipassTest(one,two){
    if (copyVideo) {
      updateTexture(gl, this.videoTex, this.video);
    }
    let width = window.innerWidth
    let height = window.innerHeight
    // playbackRate = Math.sin(0.01 + Math.round(two * 2.0)) * 1.5;

    // first create a texture to render to 
    // create to render to
    const targetTextureWidth = 256;
    const targetTextureHeight = 256;
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    {
      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);
      
      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    // Create and bind the framebuffer
    // a framebuffer is just a collection of attachments
    // not 100% on this but i think we can think of it like,
    // this is an instance of a group of webgl settings / setups
    // like things that are bound, textures, etc
    const fb = gl.createFramebuffer();
    // bind i.e. make this one the active frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      
    // attach the texture as the first color attachment
    // recall we just bound the frame buffer we're interested in above as the active one
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    // attach a texture to a frame buffer, which we created above
    // With our framebuffer bound, anytime we call 
    // e.g. gl.clear, gl.drawArrays, or gl.drawElements
    // WebGL would render to our texture instead of the canvas.
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0//level
    );
    
    const drawSquare = () => {
      this.programInfo = twgl.createProgramInfo(gl, [vertexShaderText, fragmentDither2Text])

      gl.useProgram(this.programInfo.program)

      let __positions = []
          __positions.push(
        ...this.getRectanglePositionsElementArr(
          -width/2, -height/2, width, height
        ),
      )
        
      this.positions = new Float32Array(__positions);
      this.indices = this.generateIndices(__positions)
      this.uniforms = {
        u_resolution: vec2.fromValues(width, height)
      }
      this.arrays = {
        a_position: {
          numComponents: 2,
          data: this.positions
        },
        indices: { 
          numComponents: 2, 
          data: this.indices 
        },
        a_texCoord: { 
          numComponents: 2, 
          data: this.generateTexCoords(__positions) 
        },
      };
      
      this.bufferInfo = twgl.createBufferInfoFromArrays(gl, this.arrays)
      twgl.resizeCanvasToDisplaySize(gl.canvas)
      // gl.viewport(0, 0, gl, 256)
    
      const angleInRadians = degreesToRadians(one);
    
      const translationMatrix = this.createTranslationMatrix3(width / 2, height / 2)
      const scaleMatrix = this.createScaleMatrix3(1., 1., 1)
      const rotationMatrix = this.createRotationMatrix3(90)
      let u_matrix = mat3.create()
      mat3.multiply(u_matrix, u_matrix, translationMatrix)
      mat3.multiply(u_matrix, u_matrix, rotationMatrix)
      mat3.multiply(u_matrix, u_matrix, scaleMatrix)
    
      let u_rotation = [
        Math.cos(angleInRadians),
        Math.sin(angleInRadians),
      ]
    
    
      /*
      TWGL framebuffer creation 

      Creates a framebuffer and attachments.

      This returns a module:twgl.FramebufferInfo because it needs to return 
      the attachments as well as the framebuffer. 
      It also leaves the framebuffer it just created as the currently bound FRAMEBUFFER. 
      Note: If this is WebGL2 or if you called module:twgl.addExtensionsToContext 
      then it will set the drawBuffers to [COLOR_ATTACHMENT0, COLOR_ATTACHMENT1, ...] 
      for how ever many color attachments were created.
      
      The simplest usage

      // create an RGBA/UNSIGNED_BYTE texture and DEPTH_STENCIL renderbuffer
      const fbi = twgl.createFramebufferInfo(gl);

      // const fbi = twgl.createFramebufferInfo(gl);

      // const attachments = [
      //   { format: RGB565, mag: NEAREST },
      //   { format: STENCIL_INDEX8 },
      // ]
      // const fbi = twgl.createFramebufferInfo(gl, attachments);
      // Or with a specific size 
      // const width = 256;
      // const height = 256;
      // const fbi = twgl.createFramebufferInfo(gl, attachments, width, height);
      */
      

      const kernelToUse = kernels.emboss

      const uniforms = {
        u_resolution: vec2.fromValues(window.innerWidth, window.innerHeight),
        u_scale: [1, 1],
        u_translation: [width / 2, height / 2],
        u_rotation,
        texture: this.videoTex,
        texture2: this.textures.flowas,
        u_matrix,
        u_kernelWeight: this.computeKernelWeight(kernelToUse),
        "u_kernel": kernelToUse,
        u_time: two,
        palette: [
          235/360,1,0.5,
          100/360,1,0.5,
          300/360,1,0.5,
           40/360,1,0.5,
          150/360,1,0.5,
          225/360,1,0.5,
           10/360,1,0.5,
          200/360,1,0.5,
        ],
        paletteSize: 8,

      }
    
      twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
      twgl.setUniforms(this.programInfo, uniforms)
      twgl.drawBufferInfo(gl, this.bufferInfo);
    
      if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
      }
    }
    // {
    //   // render to our targetTexture by binding the framebuffer
    //   gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    //   // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   
    //   // render cube with our 3x2 texture
    //   gl.bindTexture(gl.TEXTURE_2D, this.textures.flowas);
   
    //   // Tell WebGL how to convert from clip space to pixels
    //   gl.viewport(0, 0, targetTextureWidth, targetTextureWidth);
   
    //   // Clear the canvas AND the depth buffer.
    //   gl.clearColor(0, 0, 1, 1);   // clear to blue
    //   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
    //   const aspect = targetTextureWidth / targetTextureHeight;
    //   drawSquare(aspect)
    // }
    // {
    //   // render to the canvas
    //   gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //   // render the cube with the texture we just rendered to
    //   gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    //   // Tell WebGL how to convert from clip space to pixels
    //   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    //   // gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

    //   // Clear the canvas AND the depth buffer.
    //   gl.clearColor(1, 1, 1, 1);   // clear to white
    //   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    //   const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    //   drawSquare(aspect);
    // }
    {
      // render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // render the cube with the texture we just rendered to
      gl.bindTexture(gl.TEXTURE_2D, this.videoTex);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      // gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

      // Clear the canvas AND the depth buffer.
      gl.clearColor(1, 1, 1, 1);   // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      drawSquare(aspect);
    }
    // drawSquare()
  }
  threedeerender(timeDiff,timeElapsed){
    if (copyVideo) {
      updateTexture(gl, this.videoTex, this.video);
    }
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    {
      // render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // render the cube with the texture we just rendered to
      gl.bindTexture(gl.TEXTURE_2D, this.videoTex);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      // gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

      // Clear the canvas AND the depth buffer.
      gl.clearColor(1, 1, 1, 1);   // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    }
      // Fill the current ARRAY_BUFFER buffer
  // with the values that define a letter 'F'.

    let width = window.innerWidth
    let height = window.innerHeight
    // playbackRate = Math.sin(0.01 + Math.round(two * 2.0)) * 1.5;

    // first create a texture to render to 
    // create to render to
    const targetTextureWidth = 256;
    const targetTextureHeight = 256;
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    {
      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);
      
      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    // Create and bind the framebuffer
    // a framebuffer is just a collection of attachments
    // not 100% on this but i think we can think of it like,
    // this is an instance of a group of webgl settings / setups
    // like things that are bound, textures, etc
    const fb = gl.createFramebuffer();
    // bind i.e. make this one the active frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      
    // attach the texture as the first color attachment
    // recall we just bound the frame buffer we're interested in above as the active one
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    // attach a texture to a frame buffer, which we created above
    // With our framebuffer bound, anytime we call 
    // e.g. gl.clear, gl.drawArrays, or gl.drawElements
    // WebGL would render to our texture instead of the canvas.
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0//level
    );
    
    const drawSquare = () => {
      this.programInfo = twgl.createProgramInfo(gl, [threedvertexShaderText,threedfragmentShaderText])

      gl.useProgram(this.programInfo.program)

      let __positions = []
      __positions.push([
          // left column front
            0,   0,  0,
            0, 150,  0,
           30,   0,  0,

            0, 150,  0,
            30, 150,  0,
           30,   0,  0,

          // top rung front
           30,   0,  0,
           30,  30,  0,
           100,   0,  0,

           30,  30,  0,
           100,  30,  0,
           100,   0,  0,

          // middle rung front
           30,  60,  0,
           30,  90,  0,
           67,  60,  0,
           
           30,  90,  0,
           67,  90,  0,
           67,  60,  0,

          // left column back
            0,   0,  30,
            30,   0,  30,
            0, 150,  30,
           
            0, 150,  30,
            30,   0,  30,
            30, 150,  30,

          // top rung back
           30,   0,  30,
           100,   0,  30,
           30,  30,  30,
           
           30,  30,  30,
           100,   0,  30,
           100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,

            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          
          0,   0,   0,
          0, 150,  30,
          0, 150,   0,
      ])
      let colors = [
        // left column front
        0,0,0,
        0,0,0,
        0,0,0,
        0,0,0,
        0,0,0,
        0,0,0,

        // top rung front
        255,0,0,
        255,0,0,
        255,0,0,
        255,0,0,
        255,0,0,
        255,0,0,
        // middle rung front
        0,255,0,
        0,255,0,
        0,255,0,
        0,255,0,
        0,255,0,
        0,255,0,

        // left column back
        0,0,255,
        0,0,255,
        0,0,255,
        0,0,255,
        0,0,255,
        0,0,255,
        // top rung back
        127,0,127,
        127,0,127,
        127,0,127,
        127,0,127,
        127,0,127,
        127,0,127,
        // middle rung back
        255,0,0,
        255,0,0,
        255,0,0,
        255,0,0,
        255,0,0,
        255,0,0,

        // top
        0, 255,255,
        0, 255,255,
        0, 255,255,
        0, 255,255,
        0, 255,255,
        0, 255,255,
        
        // top rung right
        255,0,255,
        255,0,255,
        255,0,255,
        255,0,255,
        255,0,255,
        255,0,255,

        // under top rung
        127,0,127,
        127,0,127,
        127,0,127,
        127,0,127,
        127,0,127,
        127,0,127,

        // between top rung and middle
        0,127,0,
        0,127,0,
        0,127,0,
        0,127,0,
        0,127,0,
        0,127,0,

        // top of middle rung
        0,127,127,
        0,127,127,
        0,127,127,
        0,127,127,
        0,127,127,
        0,127,127,
        // right of middle rung
        64,0,64,
        64,0,64,
        64,0,64,
        64,0,64,
        64,0,64,
        64,0,64,

        // bottom of middle rung.
        127,0,64,
        127,0,64,
        127,0,64,
        127,0,64,
        127,0,64,
        127,0,64,

        // right of bottom
        64,127,0,
        64,127,0,
        64,127,0,
        64,127,0,
        64,127,0,
        64,127,0,

        // bottom
        0,127,0,
        0,127,0,
        0,127,0,
        0,127,0,
        0,127,0,
        0,127,0,

        // left side
        64,127,0,
        64,127,0,
        64,127,0,
        64,127,0,
        64,127,0,
        64,127,0,
    ]
      
      this.positions = new Float32Array(...__positions);
      this.indices = this.generateIndices(__positions)
      this.arrays = {
        a_position: {
          numComponents: 3,
          data: this.positions
        },
        a_color: {
          numComponents: 3,
          data: colors
        },
        // indices: { 
        //   numComponents: 2, 
        //   data: this.indices 
        // },
        a_texCoord: { 
          numComponents: 2, 
          data: this.generateThreeDeeTexCoords(__positions) 
        },
      };
      
      this.bufferInfo = twgl.createBufferInfoFromArrays(gl, this.arrays)
      twgl.resizeCanvasToDisplaySize(gl.canvas)
      // gl.viewport(0, 0, gl, 256)
    
      const angleInRadians = degreesToRadians(timeElapsed);
    
      // const translationMatrix = this.createTranslationMatrix3(width / 2, height / 2)
      // const scaleMatrix = this.createScaleMatrix3(1., 1., 1)
      // const rotationMatrix = this.createRotationMatrix3(90)
      // let u_matrix = mat3.create()
      // mat3.multiply(u_matrix, u_matrix, translationMatrix)
      // mat3.multiply(u_matrix, u_matrix, rotationMatrix)
      // mat3.multiply(u_matrix, u_matrix, scaleMatrix)
      const translation = [width/2, height/3, 0]
      const rotation = [3,3 * Math.sin(timeElapsed * 0.005) ,2]
      // const rotation = [0,0,0]

      const scale = [2,2,2]
  
      var matrix = m4.projection(width, height, 1800);
          matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
          matrix = m4.xRotate(matrix, rotation[0]);
          matrix = m4.yRotate(matrix, rotation[1]);
          matrix = m4.zRotate(matrix, rotation[2]);
          matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    
      const kernelToUse = kernels.emboss
      const uniforms = {
        u_resolution: vec2.fromValues(window.innerWidth, window.innerHeight),
        // u_scale: [1, 1],
        // u_translation: [width / 2, height / 2],
        // u_rotation,
        texture: this.videoTex,
        texture2: this.textures.flowas,
        u_matrix: matrix,
        u_kernelWeight: this.computeKernelWeight(kernelToUse),
        "u_kernel": kernelToUse,
        u_time: timeElapsed,
        palette: [
          235/360,1,0.5,
          100/360,1,0.5,
          300/360,1,0.5,
           40/360,1,0.5,
          150/360,1,0.5,
          225/360,1,0.5,
           10/360,1,0.5,
          200/360,1,0.5,
        ],
        paletteSize: 8,

      }
    
      twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
      twgl.setUniforms(this.programInfo, uniforms)
      twgl.drawBufferInfo(gl, this.bufferInfo);
    
      if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
      }
    }
    {
      // render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // render the cube with the texture we just rendered to
      gl.bindTexture(gl.TEXTURE_2D, this.videoTex);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      // gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

      // Clear the canvas AND the depth buffer.
      gl.clearColor(1, 1, 1, 1);   // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      drawSquare(aspect);
    }
  }
  render(timediff, totaltime) {
    // this.renderLSystem(timediff, totaltime)
    // this.renderMultipassTest(timediff, totaltime)
    this.threedeerender(timediff, totaltime)
  }
  createInputs(inputs_arr) {
    // inputs_arr = inputs_arr.map(config => {
    //   this[config.name] = document.createElement('input')
    //   this[config.name].type = config.type
    //   // this[config.name].handle = this[config.name]
    //   this[config.name].handle = document.body.appendChild(this[config.name]);
    // })
    // return inputs_arr
  }
  init() {

    this._canvas = document.createElement('canvas');

    document.body.appendChild(this._canvas);
    this.config = [
      {
        name: "length",
        type: "number",
        value: 0,
        handle: null,
      },
      {
        name: "theta",
        type: "number",
        value: 0,
        handle: null,
      },
      {
        name: "axiom",
        type: "text",
        value: 0,
        handle: null,
      },
    ]
    this.config = this.createInputs(this.config)

    gl = this._canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    this._canvas.style.width = "100vw"
    this._canvas.style.height = "100vh"
    this.textures = twgl.createTextures(gl, {
      checker: {
        mag: gl.NEAREST,
        min: gl.LINEAR,
        wrap: gl.REPEAT,
        src: [
          255, 255, 255, 255,
          192, 192, 192, 255,
          255, 255, 255, 255,
          192, 192, 192, 255,
        ],
      },
      sprite: {
        // mag: gl.NEAREST,
        // min: gl.LINEAR,
        // wrap: gl.REPEAT,
        src: spriteImg
      },
      flowas: {
        src: flowas,
      },
      stripe: {
        mag: gl.NEAREST,
        min: gl.LINEAR,
        wrap: gl.REPEAT,
        format: gl.LUMINANCE,
        src: new Uint8Array([
          10,
          20,
          30,
          40,
          50,
          60,
          70,
          80,
          80,
          70,
          60,
          50,
          40,
          30,
          20,
          10,
        ]),
        width: 8,
      },
    })
    this.videoTex = initTexture(gl);
    this.video = setupVideo(vid);
    // this.newInit()
    // this.render()
  }
  clearAndSetViewport() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.BLEND)
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  resize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = canvas.clientWidth
    const displayHeight = canvas.clientHeight

    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth ||
      canvas.height !== displayHeight;

    if (needResize) {
      // Make the canvas the same size
      canvas.width = displayWidth
      canvas.height = displayHeight
    }
    gl.viewport(0, 0, canvas.width, canvas.height);

    return needResize;
  }
}

class TheScene {
  constructor(config) {
    this._prepareDomEventsRenderLoopAndInitialize()
  }
  setState(config) {
    this.paused = false
    this.canPlayAudio = false
    this.frameCount = 0
    this.devMode = config.devMode || false
  }
  _reinit(config) {
    this.setState(config)
    this.createPolys();
    // this.registerKeyHandler()
    // this.handleAudioInit()

  }
  _init(config) {
    this.setState(config)
    this.registerKeyHandler()
    this.handleAudioInit()

  }
  playBGM() {
    // const bgm = new Audio(conway_jeans);
    // this.audio = bgm
    // bgm.play()
    //   .then(() => {
    //     clearInterval(tryToPlay);
    //   })
    //   .catch(error => {
    //     console.info('User has not interacted with document yet.');
    //   });

  }
  async handleAudioInit() { }
  registerKeyHandler() { }
  async update() {
    if (this.paused) {
      return
    }
  }
  createPolys() { }
  _prepareDomEventsRenderLoopAndInitialize() {
    this._renderer = new Renderer();

    window.addEventListener('resize', () => {
      this._onWindowResize();
    }, false);

    this._init({
      winCondition: false,
      devMode: true
    });

    this._previousRAF = null;
    this._RAF();
  }

  _onWindowResize() {
    this._renderer.resize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    // Right now we're just rendering once
    // this._step()
    if (isPaused) {
      return;
    }
    playing = requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();
      this._step(t - this._previousRAF);
      this._previousRAF = t;
      this.frameCount++
    });
  }

  _step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    // this.update(this.frameCount)

    this._renderer.render(timeElapsedS, this.frameCount);
  }

}

document.addEventListener('DOMContentLoaded', () => {
  console.log("Domcontent loaded")
  _APP = new TheScene({
    devMode: true
  });
}, { once: true });



