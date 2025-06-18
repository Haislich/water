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
  // private vertexShader: VertexShader;
  // private fragmentShader: FragmentShader;

  constructor(gl: WebGL2RenderingContext, vertexShader: VertexShader, fragmentShader: FragmentShader) {
    this.gl = gl;
    // this.vertexShader = vertexShader;
    // this.fragmentShader = fragmentShader;
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
  use(): void {
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
  dispose(): void {
    this.gl.deleteProgram(this._program);
  }
}
