#version 300 es
precision mediump float;

layout(location = 0) in vec3 aVertexPosition;
uniform mat4 uProjectionMatrix;

void main(void){
  gl_Position = uProjectionMatrix * vec4(aVertexPosition, 1.0);
}
