uniform sampler2D water;

varying vec3 vEye;
varying vec3 pos;

void main() {
  // Mapping from clip coordinates to uv coordinates for accessing the
  // water texture
  vec2 uvPosition = position.xy * 0.5 + 0.5;
  vec4 info = texture2D(water, uvPosition);
  // Reorder the vertex position, so that the fla lies on the XZ plane
  pos = position.xzy;
  // Add the height diplacement stored in the texture
  pos.y += info.r;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
