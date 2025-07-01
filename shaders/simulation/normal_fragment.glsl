precision highp float;
precision highp int;

const highp float DELTA = 1.0 / 256.0;

uniform sampler2D texture;
varying vec2 coord;

void main() {
  /* get vertex info */
  vec4 info = texture2D(texture, coord);

  /* update the normal */
  vec3 dx = vec3(DELTA, texture2D(texture, vec2(coord.x + DELTA, coord.y)).r - info.r, 0.0);
  vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + DELTA)).r - info.r, DELTA);
  info.ba = normalize(cross(dy, dx)).xz;

  gl_FragColor = info;
}
