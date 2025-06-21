#version 300 es
precision highp float;

uniform vec3 eye;
uniform samplerCube sky;

in vec3 worldPosition;
out vec4 fragColor;

void main() {
  vec3 viewDir = normalize(worldPosition - eye);
  vec3 normal = vec3(0.0, 1.0, 0.0); // flat plane normal

  vec3 reflected = reflect(viewDir, normal);
  vec3 skyColor = texture(sky, reflected).rgb;

  fragColor = vec4(skyColor, 1.0);
}
