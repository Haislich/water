// water-vertex.glsl  (only the body shown)
uniform sampler2D water;

varying vec3 pos;           // world-space surface point

void main() {
  vec2 uv = position.xy * 0.5 + 0.5;
  float height = texture2D(water, uv).r;

  vec3 localPos = position.xzy;
  localPos.y += height;

  vec4 worldPos = modelMatrix * vec4(localPos, 1.0);
  pos = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
