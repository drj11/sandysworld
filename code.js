// Inspired by
// https://developer.mozilla.org/en-US/docs/Web/WebGL/Lighting_in_WebGL
// et al.

var canvas;
var gl;

var cubeVerticesBuffer;
var cubeVerticesColorBuffer;
var cubeVerticesIndexBuffer;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var vertexNormalAttribute;
var perspectiveMatrix;

// Game state.

// constructor
function Game() {
  this.cameraHeight = 10
  // Direction vector from nominal [0,0]
  // on XY plane to camera. Not required to
  // be normalised.
  this.cameraVector = [-1, -1]
  this.cursorPos = [3, 2, 0]
}

Game.prototype = {
    moveLeft: function() {
      this.cursorPos[0] -= 1
    },
    moveRight: function() {
      this.cursorPos[0] += 1
    },
    moveForward: function() {
      this.cursorPos[1] += 1
    },
    moveBack: function() {
      this.cursorPos[1] -= 1
    },
    moveDown: function() {
      this.cameraHeight -= 1
    },
    moveUp: function() {
      this.cameraHeight += 1
    },
    // Set Camera angle to a diagonal in
    // one of the four quadrants.
    cameraAngle: function(a) {
      if(a == 1) {
        this.cameraVector = [1, 1]
      }
      if(a == 2) {
        this.cameraVector = [-1, 1]
      }
      if(a == 3) {
        this.cameraVector = [-1, -1]
      }
      if(a == 4) {
        this.cameraVector = [1, -1]
      }
    },
    editCell: function() {
      var zSize = this.grid.length
      var ySize = this.grid[0].length
      var xSize = this.grid[0][0].length
      var x = this.cursorPos[0]
      var y = this.cursorPos[1]
      var z = this.cursorPos[2]
      if(!(0 <= x && x < xSize &&
        0 <= y && y < ySize &&
        0 <= z && z < zSize)) {
        return
      }
      var row = this.grid[z][y]
      var tile = row[x]
      if(tile == " ") {
          tile = "#"
      } else {
          tile = " "
      }
      this.grid[z][y] = row.slice(0,x) + tile + row.slice(x+1)
    },
    save: function() {
      var s = ""
      s += "https://github.com/drj11/sandysworld\n"
      s += "Time: " + (new Date()).toISOString() + "\n"
      s += "~\n"
      s += gridString(this.grid)
      var dataURL = "data:text/plain;base64," + btoa(s)
      window.open(dataURL)
    }
}

the = new Game()

// Map from numeric index to tile symbol.
gridTileMap = " #"

function gridString(grid) {
    var z, y, x
    var zSize = grid.length
    var ySize = grid[0].length
    var xSize = grid[0][0].length
    // grid is best viewed with y+ going "up" the page. So
    // reverse y.
    var s = ""
    for(z=0; z<zSize; ++z) {
      for(y=ySize-1; y>=0; --y) {
        s += grid[z][y]
        s += "\n"
      }
      s += "~\n"
    }
    return s
}


//
// start
//
// Called via the body's onload() script.
function start() {
  the.grid = grid
  var xSize = the.grid[0][0].length
  the.cursorPos[0] = 0|(xSize*0.44)

  canvas = document.getElementById("glcanvas");

  initWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (gl) {
    gl.clearColor(1.0, 1.0, 0.4, 1.0);  // Clear to "yellow"
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    // Build all the objects we'll be drawing.

    initBuffers();

    // Set up to draw the scene periodically.

    setInterval(drawScene, 50);
  }
  document.getElementById("body").onkeypress = keypress
}

function keypress(e) {
  console.log(e)
  // Moving
  if(e.key == "h"){
    the.moveLeft()
  }
  if(e.key == "j"){
    the.moveBack()
  }
  if(e.key == "k"){
    the.moveForward()
  }
  if(e.key == "l"){
    the.moveRight()
  }
  // Camera
  if(e.key == "u") {
    the.moveUp()
  }
  if(e.key == "n") {
    the.moveDown()
  }
  if(1 <= (0|e.key) && (0|e.key) <= 4) {
    the.cameraAngle(0|e.key)
  }
  // Editing
  if(e.key == "x") {
    the.editCell()
  }
  if(e.key == "s") {
    the.save()
  }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

// Create JavaScript arrays to hold the vertex attributes and
// indexes.
function createArrays() {
    return {
        position: [],
        color: [],
        normal: [],
        index: [],
    }
}

// To the object `a` holding the vertex arrays, add
// attributes and indexes for a cube at position {x,y,z}.
function addCube(a, x, y, z) {
  // The vertex positions for a cube with lower left back
  // corner at {0,0,0}.
  var position = [
    // Front face
    0.0, 0.0,  1.0,
     1.0, 0.0,  1.0,
     1.0,  1.0,  1.0,
    0.0,  1.0,  1.0,

    // Back face
    0.0, 0.0, 0.0,
    0.0,  1.0, 0.0,
     1.0,  1.0, 0.0,
     1.0, 0.0, 0.0,

    // Top face
    0.0,  1.0, 0.0,
    0.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, 0.0,

    // Bottom face
    0.0, 0.0, 0.0,
     1.0, 0.0, 0.0,
     1.0, 0.0,  1.0,
    0.0, 0.0,  1.0,

    // Right face
     1.0, 0.0, 0.0,
     1.0,  1.0, 0.0,
     1.0,  1.0,  1.0,
     1.0, 0.0,  1.0,

    // Left face
    0.0, 0.0, 0.0,
    0.0, 0.0,  1.0,
    0.0,  1.0,  1.0,
    0.0,  1.0, 0.0
  ];

  // Add the offset {x,y,z} to each position.
  // Note: increment by 3 to stride from one
  // vertex to the next.
  var i;
  for(i=0; i<position.length; i+=3) {
    position[i] += x
    position[i+1] += y
    position[i+2] += z
  }

  // 4-color for each face
  var faceColor = [
    [1.0,  1.0,  1.0,  1.0],    // z+: up
    [1.0,  1.0,  1.0,  1.0],    // z-: down
    [1.0,  1.0,  1.0,  1.0],    // y+: north
    [1.0,  1.0,  1.0,  1.0],    // y-: south
    [1.0,  1.0,  1.0,  1.0],    // x+: east
    [1.0,  1.0,  1.0,  1.0]     // x-: west
  ];

  // "compile" for colors, one 4-color for each vertex.

  var color = [];

  var face;
  for (face=0; face<6; face++) {
    var c = faceColor[face];

    // Repeat for each of the four vertices of the face.
    for (var i=0; i<4; i++) {
      color = color.concat(c);
    }
  }

  var normal = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];

  // This array defines each face as two triangles, using the
  // indices into the position array to specify each triangle's
  // position.
  var index = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ]

  var v = a.position.length / 3
  // offset indexes by v
  for(i=0; i<index.length; ++i) {
    index[i] += v
  }

  Array.prototype.push.apply(a.position, position)
  Array.prototype.push.apply(a.color, color)
  Array.prototype.push.apply(a.normal, normal)
  Array.prototype.push.apply(a.index, index)
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional cube.
//
function initBuffers() {
  // Array of arrays.
  // The cubes are allocated to different arrays,
  // so that we don't overflow the (unigned short index)
  // any one of them.

  as = []

  // add all the cubes

  var zSize = the.grid.length
  var ySize = the.grid[0].length
  var xSize = the.grid[0][0].length
  var z, y, x
  for(z=0; z<zSize; ++z) {
    as[z] = createArrays()
    for(y=0; y<ySize; ++y) {
      for(x=0; x<xSize; ++x) {
        var tile = the.grid[z][y][x]
        if(tile == " ") {
          continue
        }
        var xPitch = 1.0
        var yPitch = 1.0
        var zPitch = 1.0
        addCube(as[z],
          x*xPitch, y*yPitch, z*zPitch)
      }
    }
  }

  for(var i=0; i<as.length; ++i) {
      // Create and populate GL buffers for all the vertexes.
      var a = as[i]

      // Position
      a.glPosition = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, a.glPosition);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(a.position), gl.STATIC_DRAW);

      // Color
      a.glColor = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, a.glColor);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(a.color), gl.STATIC_DRAW);

      // Normal
      a.glNormal = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, a.glNormal);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(a.normal), gl.STATIC_DRAW);

      // Index
      a.glIndex = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, a.glIndex);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(a.index), gl.STATIC_DRAW);
  }
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Projection Matrix. Orthographic.
  var aspect = 640.0/480.0
  // Half height.
  var hh = 8
  perspectiveMatrix = makeOrtho(-hh*aspect, hh*aspect, -hh, hh, -40, 200)

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.

  loadIdentity();

  // Position the camera

  var pos = the.cursorPos
  var camV = the.cameraVector.concat([0])
  camV = $V(camV)
  var cameraDistance = 10
  camV = camV.multiply(cameraDistance)
  camV = camV.add($V([pos[0], pos[1], the.cameraHeight]))
  var e = camV.elements
  var camM = makeLookAt(e[0], e[1], e[2],
    pos[0], pos[1], 0,
    0, 0, 1)
  multMatrix(camM)

  // Draw all the tiles

  for(var i=0; i<as.length; ++i) {
      setupBuffer(as[i])
      drawBuffer(as[i])
  }

  var currentTime = (new Date).getTime();
}

// setup various arrays for cube.
setupBuffer = function(a) {
  // Setup the arrays, prior to drawing.

  gl.bindBuffer(gl.ARRAY_BUFFER, a.glPosition);
  gl.vertexAttribPointer(vertexPositionAttribute,
    3, gl.FLOAT, false, 0, 0);

  // Set the colors attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, a.glColor);
  gl.vertexAttribPointer(vertexColorAttribute,
    4, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, a.glNormal)
  gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0)
}

// Draw the cube.
function drawBuffer(a) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, a.glIndex);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, a.index.length, gl.UNSIGNED_SHORT, 0);
}


//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram,
    "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);

  vertexColorAttribute = gl.getAttribLocation(shaderProgram,
    "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);

  vertexNormalAttribute = gl.getAttribLocation(shaderProgram,
    "aVertexNormal")
  gl.enableVertexAttribArray(vertexNormalAttribute)
}

//
// getShader
//
// Loads the shader program from the (script) element
// specified by `id`.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  if (!shaderScript) {
    // id not found.
    return null;
  }

  // Get the shader source from the element's children.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  // Derive GL shader type from MIME type.

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Compile the shader program
  gl.shaderSource(shader, theSource);
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " +
      gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

  var normalMatrix = mvMatrix.inverse();
  normalMatrix = normalMatrix.transpose();
  var nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  gl.uniformMatrix4fv(nUniform, false, new
        Float32Array(normalMatrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }

  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;

  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}
