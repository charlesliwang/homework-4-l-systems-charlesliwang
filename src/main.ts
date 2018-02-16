import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
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
  'Shader' : 'Custom2'
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let time = 300;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
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
  gui.add(controls, 'Shader', [ 'Lambert', 'Custom1', 'Custom2'] );
 
  const colorPicked = vec4.fromValues(controls.color[0]/255,controls.color[1]/255,controls.color[2]/255,1)
      
  // Display new color whenever color is changed
  colorPicker.onChange(function() {
    const colorPicked = vec4.fromValues(controls.color[0]/255,controls.color[1]/255,controls.color[2]/255,1)
      lambert.setGeometryColor(colorPicked);
      customShader.setGeometryColor(colorPicked);
      customShader2.setGeometryColor(colorPicked);
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

  const customShader2 = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom2-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom2-frag.glsl')),
  ]);

  lambert.setGeometryColor(colorPicked);
  customShader.setGeometryColor(colorPicked);
  customShader2.setGeometryColor(colorPicked);

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
      ]);
    } else if (controls.Shader == "Custom1") {
      let v4 = vec4.fromValues(time,0,0,1);
      customShader.setTime(v4);
      renderer.render(camera, customShader, [
        icosphere,
        //square,
        //cube,
      ]);
    } else {
      let v4 = vec4.fromValues(time,0,0,1);
      customShader2.setTime(v4);
      renderer.render(camera, customShader2, [
        //icosphere,
        square,
        //cube,
      ]);
    }
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    let w = vec2.fromValues(window.innerWidth, window.innerHeight);
    customShader2.setWindow(w);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  let w = vec2.fromValues(window.innerWidth, window.innerHeight);
  customShader2.setWindow(w);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}


main();
