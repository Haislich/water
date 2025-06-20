class Texture {
  protected gl: WebGL2RenderingContext;
  protected _texture: WebGLTexture;
  protected textureUnit: number;
  protected name: string;

  constructor(
    gl: WebGL2RenderingContext,
    textureUnit: number,
    name: string,
    width: number,
    height: number,
    data: HTMLImageElement | null,
    internalFormat: number = gl.RGBA,
    type: number = gl.UNSIGNED_BYTE,
    filter: number = gl.NEAREST
  ) {
    this.gl = gl;
    this.textureUnit = textureUnit;
    this.name = name;
    const tex = gl.createTexture();
    if (!tex) throw new Error('Failed to create texture');
    this._texture = tex;
    //Textures must be binded before used.
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Create a texture with this informations
    if (data instanceof HTMLImageElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, type, data);
    } else if (data == null) {
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, type, data!);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //clear up webgl state machine
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  get texture(): WebGLTexture {
    return this._texture;
  }
  bind(shader: WebGLProgram): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + this.textureUnit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture);

    const location = this.gl.getUniformLocation(shader, this.name);
    if (location !== null) {
      this.gl.uniform1i(location, this.textureUnit);
    }
  }
}

export class StaticTextureObject extends Texture {
  constructor(
    gl: WebGL2RenderingContext,
    textureUnit: number,
    name: string,
    data: HTMLImageElement,
    internalFormat: number = gl.RGBA,
    type: number = gl.UNSIGNED_BYTE,
    filter: number = gl.NEAREST
  ) {
    // webgl will inger the image size
    super(gl, textureUnit, name, 0, 0, data, internalFormat, type, filter);
    if (filter !== gl.NEAREST && filter !== gl.LINEAR) {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }
}

// we will use them only to do computations
export class TextureBuffer {
  private gl: WebGL2RenderingContext;
  private width: number;
  private height: number;
  private readTex: Texture;
  private writeTex: Texture;
  private framebuffer: WebGLFramebuffer;

  private readIndex = true;

  constructor(
    gl: WebGL2RenderingContext,
    name: string,
    textureUnit: number,
    width: number,
    height: number,
    internalFormat: number = gl.RGBA,
    type: number = gl.UNSIGNED_BYTE,
    filter: number = gl.NEAREST
  ) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.readTex = new Texture(gl, textureUnit, name, width, height, null, internalFormat, type, filter);
    this.writeTex = new Texture(gl, textureUnit, name, width, height, null, internalFormat, type, filter);

    // we won't be rendering this kind of textures
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error('Failed to create framebuffer');
    this.framebuffer = fbo;
  }

  get read(): WebGLTexture {
    return this.readIndex ? this.readTex.texture : this.writeTex.texture;
  }

  get write(): WebGLTexture {
    return this.readIndex ? this.writeTex.texture : this.readTex.texture;
  }
  bind(shader: WebGLProgram): void {
    if (this.readIndex) {
      this.readTex.bind(shader);
    } else {
      this.writeTex.bind(shader);
    }
  }
  swap(): void {
    this.readIndex = !this.readIndex;
  }

  update(draw: () => void): void {
    const gl = this.gl;

    const prevFrameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevViewport = gl.getParameter(gl.VIEWPORT);

    /* render to the off-screen target */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.write, 0);

    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.COLOR_BUFFER_BIT); // if you need a clear

    draw(); // user-supplied rendering

    this.swap(); // ping-pong the textures

    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFrameBuffer);
    gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
  }
}
