import { mat4 } from 'gl-matrix';
import { Mesh } from './mesh';
import { FragmentShader, ShaderProgram, VertexShader } from './shader';
import { StaticTextureObject } from './texture';

// Import GLSL as strings (using your bundler config)
import waterFragSrc from '../shaders/water.frag';
import waterVertSrc from '../shaders/water.vert';

export class Water {
  private gl: WebGL2RenderingContext;
  private waterMesh: Mesh;
  private renderShader: ShaderProgram;
  private cubemap: StaticTextureObject;

  constructor(gl: WebGL2RenderingContext, cubemap: StaticTextureObject) {
    this.gl = gl;
    this.cubemap = cubemap;

    // Flat XZ plane, subdivided for smoother curves/reflections
    this.waterMesh = Mesh.plane(gl, 100);

    const vert = new VertexShader(gl, waterVertSrc);
    const frag = new FragmentShader(gl, waterFragSrc);
    this.renderShader = new ShaderProgram(gl, vert, frag);
  }

  render(viewMatrix: mat4, projMatrix: mat4, eyePosition: [number, number, number]): void {
    this.renderShader.use();
    this.renderShader.setUniform('uViewMatrix', viewMatrix);
    this.renderShader.setUniform('uProjectionMatrix', projMatrix);
    this.renderShader.setUniform('uModelMatrix', mat4.create()); // identity for flat plane
    this.renderShader.setUniform('eye', eyePosition);
    this.renderShader.setUniform('sky', 1); // cubemap will be bound to TEXTURE1

    this.cubemap.bind(this.renderShader.program);
    this.waterMesh.draw();
  }
}
