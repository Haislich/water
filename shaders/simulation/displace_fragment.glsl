precision highp float;

uniform sampler2D texture;
uniform vec3 oldCenter;
uniform vec3 newCenter;
uniform float radius;

varying vec2 coord;

float volumeInSphere(vec3 center) {
  vec3 toCenter = vec3(coord.x * 2.0 - 1.0, 0.0, coord.y * 2.0 - 1.0) - center;
  float t = length(toCenter) / radius;
  float dy = exp(-pow(t * 1.5, 6.0));
  float ymin = min(0.0, center.y - dy);
  float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
  return (ymax - ymin) * 0.1;
}

void main() {
  vec4 info = texture2D(texture, coord);

  // Add the volume at the old position
  info.r += volumeInSphere(oldCenter);

  // Remove the volume at the new position
  info.r -= volumeInSphere(newCenter);//

  gl_FragColor = info;
}
