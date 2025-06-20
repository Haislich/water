import { mat4 } from 'gl-matrix';
import { Mesh } from './mesh';
// import passVertSrc from '../shaders/pass.vert';
import { FragmentShader, ShaderProgram, VertexShader } from './shader';
import { StaticTextureObject, TextureBuffer } from './texture';

export class Water {
  private gl: WebGL2RenderingContext;
  private waterMesh: Mesh;
  private waterTex: TextureBuffer;
  private dropShader: ShaderProgram;
  private updateShader: ShaderProgram;
  private normalShader: ShaderProgram;
  private renderShader: ShaderProgram;
  private cubemap: StaticTextureObject;
  private resolution: number;

  constructor(gl: WebGL2RenderingContext, cubemap: StaticTextureObject, resolution = 256) {
    this.gl = gl;
    this.resolution = resolution;
    this.cubemap = cubemap;

    this.waterMesh = Mesh.plane(gl, 100);

    this.waterTex = new TextureBuffer(gl, 'waterTex', 0, resolution, resolution, gl.RGBA32F, gl.FLOAT, gl.LINEAR);
    const passVert = new VertexShader(gl, '');
    this.dropShader = new ShaderProgram(gl, passVert, new FragmentShader(gl, './shaders/drop.frag'));
    this.updateShader = new ShaderProgram(gl, passVert, new FragmentShader(gl, './shaders/update.frag'));
    this.normalShader = new ShaderProgram(gl, passVert, new FragmentShader(gl, './shaders/normal.frag'));
    this.renderShader = new ShaderProgram(gl, new VertexShader(gl, './shaders/water.vert'), new FragmentShader(gl, './shaders/water.frag'));
  }

  addDrop(x: number, y: number, radius: number, strength: number): void {
    this.waterTex.update(() => {
      this.dropShader.bind();
      this.dropShader.setUniform('center', [x, y]);
      this.dropShader.setUniform('radius', radius);
      this.dropShader.setUniform('strength', strength);
      this.waterTex.bind(this.dropShader.program);
      this.drawFullscreenQuad();
    });
  }

  stepSimulation(): void {
    const delta = [1 / this.resolution, 1 / this.resolution];

    // Apply update shader
    this.waterTex.update(() => {
      this.updateShader.bind();
      this.updateShader.setUniform('delta', delta);
      this.waterTex.bind(this.updateShader.program);
      this.drawFullscreenQuad();
    });

    // Update normals
    this.waterTex.update(() => {
      this.normalShader.bind();
      this.normalShader.setUniform('delta', delta);
      this.waterTex.bind(this.normalShader.program);
      this.drawFullscreenQuad();
    });
  }

  render(viewMatrix: mat4, projMatrix: mat4, eyePosition: [number, number, number]): void {
    const gl = this.gl;
    gl.useProgram(this.renderShader.program);
    this.renderShader.setUniform('viewMatrix', viewMatrix);
    this.renderShader.setUniform('projMatrix', projMatrix);
    this.renderShader.setUniform('eye', eyePosition);
    this.renderShader.setUniform('water', 0);
    this.renderShader.setUniform('sky', 1);

    this.waterTex.bind(this.renderShader.program);
    this.cubemap.bind(this.renderShader.program);

    this.waterMesh.draw();
  }

  private drawFullscreenQuad(): void {
    const gl = this.gl;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // assumed screen-aligned quad
  }
}
