import type { mat4 } from 'gl-matrix';

// MAybe I should find a more fitting name ?
class Shader {
  private shader: WebGLShader;
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext, src: string, shader_type: number) {
    this.gl = gl;
    const shader = gl.createShader(shader_type);
    if (!shader) throw new Error('Unable to create shader');
    this.shader = shader;
    gl.shaderSource(this.shader, src.trim());
    gl.compileShader(this.shader);
    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(this.shader)!);
  }
  get handle(): WebGLShader {
    return this.shader;
  }
  disposeShader(): void {
    this.gl.deleteShader(this.shader);
  }
}

export class VertexShader extends Shader {
  constructor(gl: WebGL2RenderingContext, src: string) {
    super(gl, src, gl.VERTEX_SHADER);
  }
}

export class FragmentShader extends Shader {
  constructor(gl: WebGL2RenderingContext, src: string) {
    super(gl, src, gl.FRAGMENT_SHADER);
  }
}

export class ShaderProgram {
  private _program: WebGLProgram;
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext, vertexShader: VertexShader, fragmentShader: FragmentShader) {
    this.gl = gl;
    this._program = gl.createProgram();
    gl.attachShader(this._program, vertexShader.handle);
    gl.attachShader(this._program, fragmentShader.handle);
    gl.linkProgram(this._program);
    if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(this._program);
      gl.deleteProgram(this._program);
      throw new Error(error ?? 'Unknown program linking error');
    }
  }
  get program(): WebGLProgram {
    return this._program;
  }
  bind(): void {
    this.gl.useProgram(this._program);
  }
  getUniformLocation(name: string): WebGLUniformLocation {
    const location = this.gl.getUniformLocation(this._program, name);
    if (location === null) throw new Error(`Uniform "${name}" not found`);
    return location;
  }

  getAttribLocation(name: string): number {
    const location = this.gl.getAttribLocation(this._program, name);
    if (location === -1) throw new Error(`Attribute "${name}" not found`);
    return location;
  }
  setUniform(name: string, value: number | number[] | Float32Array | mat4): void {
    const gl = this.gl;
    const loc = this.getUniformLocation(name);

    if (typeof value === 'number') {
      gl.uniform1f(loc, value);
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          gl.uniform2fv(loc, value);
          break;
        case 3:
          gl.uniform3fv(loc, value);
          break;
        case 4:
          gl.uniform4fv(loc, value);
          break;
        case 9:
          gl.uniformMatrix3fv(loc, false, value);
          break;
        case 16:
          gl.uniformMatrix4fv(loc, false, value);
          break;
        default:
          throw new Error(`Unsupported uniform array length: ${value.length}`);
      }
    } else if (value instanceof Float32Array) {
      switch (value.length) {
        case 16:
          gl.uniformMatrix4fv(loc, false, value);
          break;
        case 9:
          gl.uniformMatrix3fv(loc, false, value);
          break;
        default:
          throw new Error(`Unsupported Float32Array length: ${value.length}`);
      }
    } else {
      throw new Error(`Unsupported uniform value: ${value}`);
    }
  }

  dispose(): void {
    this.gl.deleteProgram(this._program);
  }
}
