// According to the book we need to write indexable goometry in order to use IBO and optimize performmance , but I need to think about how in reality my input are and overall depends on the total number of computations.
export class IndexedGeometry {
  public readonly vertices: number[] = [];
  public readonly indices: number[] = [];
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

type VertexAttrib = {
  location: number; // layout location in shader
  size: number; // number of components (e.g. 3 for vec3)
  type: GLenum; // usually gl.FLOAT
  normalized: boolean; // whether to normalize (e.g. for bytes)
  stride: number; // bytes between vertices
  offset: number; // byte offset into the buffer
};

export class Mesh {
  private vao: WebGLVertexArrayObject;
  private indexType: GLenum;
  private count: number;
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext, geometry: IndexedGeometry, attribs: VertexAttrib[]) {
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
    for (const attrib of attribs) {
      gl.enableVertexAttribArray(attrib.location);
      gl.vertexAttribPointer(attrib.location, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Cleanup
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  draw(): void {
    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(this.gl.TRIANGLES, this.count, this.indexType, 0);
    this.gl.bindVertexArray(null);
  }
}
