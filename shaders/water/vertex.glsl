/**
 * Vertex shader for transforming displaced water surface points into world and clip space.
 * 
 * This shader samples the heightfield from the `water` texture and applies it as a vertical
 * displacement (Y-axis) to the base grid position. The result is transformed through the model,
 * view, and projection matrices for rendering.
 * 
 * Inputs:
 *   - uniform sampler2D water: Heightfield texture containing wave heights in the red channel.
 *   - varying vec3 pos: Output world-space position of the vertex, passed to the fragment shader.
 *   - attribute vec3 position: Local grid-space position of the vertex.
 * 
 * Outputs:
 *   - gl_Position: Final clip-space position for rasterization.
 */
uniform sampler2D water;

varying vec3 pos;

void main() {
  // Convert from grid coordinates [-1, 1] to UV space [0, 1]
  vec2 uv = position.xy * 0.5 + 0.5;

  // Sample wave height from the red channel of the heightfield texture
  float height = texture2D(water, uv).r;

  // Rearrange to match expected coordinate layout and apply height offset to Y
  vec3 localPos = position.xzy;
  localPos.y += height;

  // Transform into world space using model matrix
  vec4 worldPos = modelMatrix * vec4(localPos, 1.0);

  // Pass world position to fragment shader
  pos = worldPos.xyz;

  // Transform to clip space for rasterization
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
