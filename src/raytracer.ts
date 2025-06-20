import { mat4, vec3, vec4 } from 'gl-matrix';

export class Raytracer {
  private eye: vec3;
  private invViewProj: mat4;
  private viewport: [number, number, number, number];

  constructor(modelViewMatrix: mat4, projectionMatrix: mat4, viewport: [number, number, number, number]) {
    this.viewport = viewport;

    // Compute eye position
    const invView = mat4.invert(mat4.create(), modelViewMatrix)!;
    this.eye = vec3.transformMat4(vec3.create(), [0, 0, 0], invView);

    // Compute inverse of projection * view matrix
    const viewProj = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix);
    this.invViewProj = mat4.invert(mat4.create(), viewProj)!;
  }

  getRayForPixel(x: number, y: number): vec3 {
    const [vx, vy, vw, vh] = this.viewport;

    // Normalize screen coords to [-1, +1]
    const ndcX = ((x - vx) / vw) * 2 - 1;
    const ndcY = ((vh - (y - vy)) / vh) * 2 - 1; // flip Y

    // Project a point at z = 1 (far plane)
    const pointFarNDC = vec4.fromValues(ndcX, ndcY, 1, 1);
    const worldFar = vec4.transformMat4(vec4.create(), pointFarNDC, this.invViewProj);
    vec4.scale(worldFar, worldFar, 1 / worldFar[3]);

    const direction = vec3.subtract(vec3.create(), [worldFar[0], worldFar[1], worldFar[2]], this.eye);
    vec3.normalize(direction, direction);
    return direction;
  }

  getEye(): vec3 {
    return this.eye;
  }
}
