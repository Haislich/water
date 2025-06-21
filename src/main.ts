import { mat4, vec3 } from 'gl-matrix';
import { StaticTextureObject } from './texture';
import { Water } from './water';

let angleX = 0.3 * Math.PI;
let angleY = 0.01 * Math.PI;
let isDragging = false;
let lastX = 0;
let lastY = 0;

const loadCubemap = (gl: WebGL2RenderingContext): StaticTextureObject => {
  const faceImages: Record<string, HTMLImageElement> = {
    xpos: document.getElementById('posx') as HTMLImageElement,
    xneg: document.getElementById('negx') as HTMLImageElement,
    ypos: document.getElementById('posy') as HTMLImageElement,
    yneg: document.getElementById('negy') as HTMLImageElement,
    zpos: document.getElementById('posz') as HTMLImageElement,
    zneg: document.getElementById('negz') as HTMLImageElement,
  };

  return StaticTextureObject.fromCubemapImages(gl, 1, 'sky', faceImages);
};

const computeCamera = (viewMatrix: mat4): [mat4, [number, number, number]] => {
  const eye = vec3.transformMat4(vec3.create(), [0, 0, 0], mat4.invert(mat4.create(), viewMatrix)!);
  return [viewMatrix, [eye[0], eye[1], eye[2]]];
};

const drawScene = (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, water: Water): void => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const projMatrix = mat4.perspective(mat4.create(), Math.PI / 6, canvas.width / canvas.height, 0.01, 100.0);

  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, [0, 0, -5]);
  mat4.rotateX(viewMatrix, viewMatrix, -angleX);
  mat4.rotateY(viewMatrix, viewMatrix, -angleY);

  const [view, eyePos] = computeCamera(viewMatrix);
  water.render(view, projMatrix, eyePos);
};

window.onload = (): void => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 not supported');

  const cubemap = loadCubemap(gl);
  const water = new Water(gl, cubemap);

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
      lastX = e.clientX;
      lastY = e.clientY;
      drawScene(gl, canvas, water);
    }
  });

  drawScene(gl, canvas, water);
};
