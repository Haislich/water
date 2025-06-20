// According to the book we need to write indexable goometry in order to use IBO and optimize performmance , but I need to think about how in reality my input are and overall depends on the total number of computations.
export class IndexedGeometry {
  public readonly vertices: number[] = [];
  public indices: number[] = [];
  public readonly stride: number;
  private readonly vertexMap = new Map<string, number>();

  /** Always initialize from a flat array + stride */
  constructor(flat: number[], stride: number) {
    if (stride <= 0 || flat.length % stride !== 0) {
      throw new Error('Flat array length must be divisible by a positive stride.');
    }

    this.stride = stride;

    for (let i = 0; i < flat.length; i += stride) {
      const vert = flat.slice(i, i + stride);
      const key = vert.toString();

      let index = this.vertexMap.get(key);
      if (index === undefined) {
        index = this.vertices.length / stride;
        this.vertexMap.set(key, index);
        this.vertices.push(...vert);
      }

      this.indices.push(index);
    }
  }

  /** Construct from an array of fixed-length subarrays */
  static fromNested(vertices: number[][]): IndexedGeometry {
    if (vertices.length === 0) {
      throw new Error('Vertex list is empty.');
    }

    const stride = vertices[0].length;
    if (vertices.some((v) => v.length !== stride)) {
      throw new Error('All vertex subarrays must have the same length.');
    }

    const flat: number[] = [];
    for (const vert of vertices) {
      flat.push(...vert);
    }

    return new IndexedGeometry(flat, stride);
  }

  vertexData(): Float32Array {
    return new Float32Array(this.vertices);
  }
  indexData(): Uint32Array {
    return new Uint32Array(this.indices);
  }
}
export class VertexAttrib {
  location: number;
  size: number;
  type: number; // GLenum is just a number
  normalized: boolean;
  stride: number;
  offset: number;

  constructor(location: number, size: number, type: number, normalized: boolean, stride: number, offset: number) {
    this.location = location;
    this.size = size;
    this.type = type;
    this.normalized = normalized;
    this.stride = stride;
    this.offset = offset;
  }
}

export class Mesh {
  private vao: WebGLVertexArrayObject;
  private indexType: GLenum;
  private count: number;
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext, geometry: IndexedGeometry) {
    this.gl = gl;
    const vertices = geometry.vertexData();
    const indices = geometry.indexData();
    this.indexType = indices instanceof Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
    this.count = indices.length;

    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    this.vao = gl.createVertexArray();

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // When I create a mesh I only know where the triangles are
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Cleanup
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  static plane(gl: WebGL2RenderingContext, detail: number): Mesh {
    const vertices: number[][] = [];
    const indices: number[] = [];

    for (let y = 0; y <= detail; y++) {
      const t = y / detail;
      const posY = 2 * t - 1; // map to [-1, 1]

      for (let x = 0; x <= detail; x++) {
        const s = x / detail;
        const posX = 2 * s - 1;
        vertices.push([posX, posY, 0]);
      }
    }

    const stride = 3;
    const cols = detail + 1;

    for (let y = 0; y < detail; y++) {
      for (let x = 0; x < detail; x++) {
        const i = x + y * cols;
        // Two triangles per grid cell
        indices.push(i, i + 1, i + cols);
        indices.push(i + cols, i + 1, i + cols + 1);
      }
    }

    const flat: number[] = vertices.flat(); // Flatten the vertex array
    const geometry = new IndexedGeometry(flat, stride);
    geometry.indices = indices; // Overwrite with direct triangle indexing

    return new Mesh(gl, geometry);
  }
  draw(): void {
    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(this.gl.TRIANGLES, this.count, this.indexType, 0);
    this.gl.bindVertexArray(null);
  }
}
