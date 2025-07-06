uniform mat3 LIGHTGLgl_NormalMatrix;
uniform mat4 LIGHTGLgl_ModelViewMatrix;
uniform mat4 LIGHTGLgl_ProjectionMatrix;
uniform mat4 LIGHTGLgl_ModelViewProjectionMatrix;
uniform mat4 LIGHTGLgl_ModelViewMatrixInverse;
uniform mat4 LIGHTGLgl_ProjectionMatrixInverse;
uniform mat4 LIGHTGLgl_ModelViewProjectionMatrixInverse;
attribute vec4 LIGHTGLgl_Vertex;
attribute vec4 LIGHTGLgl_TexCoord;
attribute vec3 LIGHTGLgl_Normal;
attribute vec4 LIGHTGLgl_Color;
vec4 ftransform() {
    return LIGHTGLgl_ModelViewProjectionMatrix * LIGHTGLgl_Vertex;
}
varying vec2 coord;
void main() {
    coord = LIGHTGLgl_Vertex.xy * 0.5 + 0.5;
    gl_Position = vec4(LIGHTGLgl_Vertex.xyz, 1.0);
}