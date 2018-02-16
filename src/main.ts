import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import LSystem from './lsystem';
import LSystemMesh from './geometry/LSystemMesh';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 7,
  'Load Scene': loadScene, // A function pointer, essentially
  color: [40,150,250,1],
  'Shader' : 'Lambert'
};

let icosphere: Icosphere;
let square: Square;
let lsystem: LSystem;
let lsystemmesh: LSystemMesh;
let cube: Cube;
let time = 300;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  lsystemmesh = new LSystemMesh(vec3.fromValues(0, 0, 0));
  lsystemmesh.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}



function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  //const text = new GUIText();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  const colorPicker = gui.addColor(controls, 'color');
  gui.add(controls, 'Shader', [ 'Lambert'] );
 
  const colorPicked = vec4.fromValues(controls.color[0]/255,controls.color[1]/255,controls.color[2]/255,1)
      
  // Display new color whenever color is changed
  colorPicker.onChange(function() {
    const colorPicked = vec4.fromValues(controls.color[0]/255,controls.color[1]/255,controls.color[2]/255,1)
      lambert.setGeometryColor(colorPicked);
      customShader.setGeometryColor(colorPicked);
  });

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  //LSYSTEM INIT 
  lsystem = new LSystem(vec3.fromValues(0,0,0), "AB");

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const customShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  lambert.setGeometryColor(colorPicked);
  customShader.setGeometryColor(colorPicked);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    time = (time + 1) % 300;
    if(controls.Shader == "Lambert") {
      renderer.render(camera, lambert, [
        //icosphere,
        //square,
        cube,
        lsystemmesh,
      ]);
    } 
    // else if (controls.Shader == "Custom1") {
    //   let v4 = vec4.fromValues(time,0,0,1);
    //   customShader.setTime(v4);
    //   renderer.render(camera, customShader, [
    //     icosphere,
    //     //square,
    //     //cube,
    //   ]);
    // }
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}


main();
