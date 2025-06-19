import { mat4 } from 'gl-matrix';
import waterFrag from '../shaders/water.frag';
import waterVert from '../shaders/water.vert';
import { FragmentShader, ShaderProgram, VertexShader } from './shader';

const drawScene = (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void => {
  // Shader creation
  const vertexShader = new VertexShader(gl, waterVert);
  const fragmentShader = new FragmentShader(gl, waterFrag);
  const shaderProgram = new ShaderProgram(gl, vertexShader, fragmentShader);

  shaderProgram.use();

  const aVertexPosition = 0; //gl.getAttribLocation(shaderProgram.program, 'aVertexPosition');
  const uProjectionMatrix = shaderProgram.getUniformLocation('uProjectionMatrix');

  const vertices = [-0.5, 0.5, -2, -0.5, -0.5, -2, 0.5, -0.5, -2, 0.5, 0.5, -2];

  const indices = [0, 1, 2, 0, 2, 3];
  const projectionMatrix = mat4.create();
  const fov = Math.PI / 4;
  const aspect = canvas.width / canvas.height;
  // Object farther than, `far` and nearer than `near`  will get clipped
  const near = 0.01;
  const far = 100.0;
  gl.uniformMatrix4fv(uProjectionMatrix, false, mat4.perspective(projectionMatrix, fov, aspect, near, far));

  // Setting up VBO
  const squareVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Setting up VAO for the given VBO
  // Note: The VAO must be instantiated after the Buffer you use
  const squareVAO = gl.createVertexArray();
  gl.bindVertexArray(squareVAO);

  gl.enableVertexAttribArray(aVertexPosition);
  gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);

  //Setting up IBO
  const squareIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  // Clean up by unbinding everything
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // Color that will be used after the next clear
  gl.clearColor(0, 0, 0, 1);
  // Clears by using the last clearColor value (COLOR_BUFFER_BIT),
  // clears the Z buffer (DEPTH_BUFFER_BIT)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set the area in which we will write
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // retrieve the informations from the VAO
  gl.bindVertexArray(squareVAO);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  gl.bindVertexArray(null);
};

// declare let canvas: HTMLCanvasElement;
window.onload = (): void => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 not supported');
  drawScene(gl, canvas);
};
