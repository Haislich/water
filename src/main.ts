import { mat4 } from 'gl-matrix';
const drawScene = (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void => {
  // Shader creation
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) throw new Error('Unable to create vertex Shaders');
  gl.shaderSource(vertexShader, vert.trim());
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) throw new Error('Error compiling shader');

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) throw new Error('Unable to instantiate Shaders');
  gl.shaderSource(fragmentShader, frag.trim());
  gl.compileShader(fragmentShader);
  // Throwing this error might be more suitable: gl.getShaderInfoLog(shader)
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) throw new Error('Error compiling shader');

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
  const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

  const vertices = [-0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0];

  const indices = [0, 1, 2, 0, 2, 3];

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
  const projectionMatrix = mat4.create();
  const fov = Math.PI / 4;
  const aspect = canvas.width / canvas.height;
  // Object farther than, `far` and nearer than `near`  will get clipped
  const near = 0.01;
  const far = 100.0;
  gl.uniformMatrix4fv(uProjectionMatrix, false, mat4.perspective(projectionMatrix, fov, aspect, near, far));

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

const vert = `
#version 300 es
precision mediump float;

in vec3 aVertexPosition;
uniform mat4 uProjectionMatrix;

void main(void){
  // * uProjection
  gl_Position =  vec4(aVertexPosition, 1.0);
}
`;

const frag = `
#version 300 es
    precision mediump float;

    // Color that is the result of this shader
    out vec4 fragColor;

    void main(void) {
      // Set the result as red
      fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;
