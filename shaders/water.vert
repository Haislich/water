#version 300 es
precision mediump float;

in vec3 position;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
out vec3 worldPosition;
uniform sampler2D waterHeightField;
void main() {
    // vec4 info = texture(water, waterHeightField.xy * 0.5 + 0.5);
    // position = position.xzy;
    // position.y += info.r;
    worldPosition = (uModelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = uProjectionMatrix *  uViewMatrix * uModelMatrix * vec4(position, 1.0);
}