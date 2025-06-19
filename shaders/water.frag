#version 300 es
precision mediump float;

// Color that is the result of this shader
out vec4 fragColor;
uniform mat4 uProjectionMatrix;


void main(void) {
  // Set the result as red
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}