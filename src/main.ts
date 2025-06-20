import { mat4 } from 'gl-matrix';
import waterFrag from '../shaders/water.frag';
import waterVert from '../shaders/water.vert';
import { Mesh } from './mesh';
import { FragmentShader, ShaderProgram, VertexShader } from './shader';

let angleX = 0.3 * Math.PI; // Vertical tilt
let angleY = 0.01 * Math.PI; // Horizontal orbit
let isDragging = false;
let lastX = 0;
let lastY = 0;

const drawScene = (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void => {
  // Shader creation
  const vertexShader = new VertexShader(gl, waterVert);
  const fragmentShader = new FragmentShader(gl, waterFrag);
  const shaderProgram = new ShaderProgram(gl, vertexShader, fragmentShader);

  shaderProgram.bind();
  const uProjectionMatrix = shaderProgram.getUniformLocation('uProjectionMatrix');
  const projectionMatrix = mat4.create();
  const fov = Math.PI / 6;
  const aspect = canvas.width / canvas.height;
  // Object farther than, `far` and nearer than `near`  will get clipped
  const near = 0.01;
  const far = 100.0;
  gl.uniformMatrix4fv(uProjectionMatrix, false, mat4.perspective(projectionMatrix, fov, aspect, near, far));

  const uModelViewMatrix = shaderProgram.getUniformLocation('uModelViewMatrix');
  const modelViewMatrix = mat4.create();

  // Step 1: pull camera back 4 units
  mat4.translate(modelViewMatrix, modelViewMatrix, [0, -0, -3]);

  // Step 2: rotate around X and Y
  mat4.rotateX(modelViewMatrix, modelViewMatrix, -angleX);
  mat4.rotateY(modelViewMatrix, modelViewMatrix, -angleY);

  // Step 3: move up a little (scene centering)
  mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, 0]);

  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

  const squareMesh = Mesh.plane(gl, 1); //new Mesh(gl, indexedGeometry, [attrib]);
  // Color that will be used after the next clear
  gl.clearColor(0, 0, 0, 1);
  // Clears by using the last clearColor value (COLOR_BUFFER_BIT),
  // clears the Z buffer (DEPTH_BUFFER_BIT)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set the area in which we will write
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  squareMesh.draw();
};

// declare let canvas: HTMLCanvasElement;
window.onload = (): void => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 not supported');
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      angleY -= dx * 0.01;
      angleX -= dy * 0.01;

      // angleX = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, angleX)); // clamp
      lastX = e.clientX;
      lastY = e.clientY;

      drawScene(gl, canvas);
    }
  });

  drawScene(gl, canvas);
};
