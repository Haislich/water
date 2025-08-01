#include <utils>

varying vec3 pos;

void main() {
  pos = position.xyz;
  pos.y = ((1.0 - pos.y) * (6.5 / 12.0) - 1.0) * poolHeight;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
