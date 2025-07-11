precision highp float;
uniform mat3 LIGHTGLgl_NormalMatrix;
uniform mat4 LIGHTGLgl_ModelViewMatrix;
uniform mat4 LIGHTGLgl_ProjectionMatrix;
uniform mat4 LIGHTGLgl_ModelViewProjectionMatrix;
uniform mat4 LIGHTGLgl_ModelViewMatrixInverse;
uniform mat4 LIGHTGLgl_ProjectionMatrixInverse;
uniform mat4 LIGHTGLgl_ModelViewProjectionMatrixInverse;
const float PI = 3.141592653589793;
uniform sampler2D texture;
uniform vec2 center;
uniform float radius;
uniform float strength;
varying vec2 coord;
void main() {      /* get vertex info */      
    vec4 info = texture2D(texture, coord);            /* add the drop to the height */      
    float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
    drop = 0.5 - cos(drop * PI) * 0.5;
    info.r += drop * strength;
    gl_FragColor = info;
}