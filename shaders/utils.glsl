const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;
const float poolHeight = 1.;

uniform vec3 light;
uniform sampler2D tiles;
uniform sampler2D causticTex;
uniform sampler2D water;
uniform float wallLightAbsorption;

/**
 * Computes the entry and exit distances (tNear, tFar) along a ray from the origin to a 3D axis-aligned cube.
 *
 * This function calculates the intersection between a ray and a box defined by its minimum and maximum coordinates.
 * It uses the slab method to determine the distances along the ray at which it enters and exits the cube.
 *
 * @param origin   The starting point of the ray (vec3).
 * @param ray      The normalized direction vector of the ray (vec3).
 * @param cubeMin  The minimum corner of the cube (vec3).
 * @param cubeMax  The maximum corner of the cube (vec3).
 *
 * @returns vec2(tNear, tFar) — the distances along the ray where it enters and exits the cube.
 *          If tNear > tFar, there is no intersection.
 */
vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
  // Compute intersection distances with the cube's bounding planes for each axis
  vec3 tMin = (cubeMin - origin) / ray; // When the ray hits the minimum side of the cube
  vec3 tMax = (cubeMax - origin) / ray; // When the ray hits the maximum side of the cube

  // Swap tMin and tMax to ensure t1 holds min(tMin, tMax) and t2 holds max(tMin, tMax)
  vec3 t1 = min(tMin, tMax); // Closest intersection distances per axis
  vec3 t2 = max(tMin, tMax); // Farthest intersection distances per axis

  // The ray enters the cube at the largest of the near-plane distances
  float tNear = max(max(t1.x, t1.y), t1.z);

  // The ray exits the cube at the smallest of the far-plane distances
  float tFar = min(min(t2.x, t2.y), t2.z);

  return vec2(tNear, tFar);
}

/**
 * Computes the final color of a point on the pool wall, accounting for texture sampling,
 * ambient occlusion, caustic lighting, and soft rim shadows.
 *
 * The function determines which wall was hit based on the input `point` and samples the
 * appropriate section of the `tiles` texture. It then modulates the result using ambient occlusion
 * based on distance, and adds lighting effects:
 * - Caustics when underwater.
 * - Soft rim shadows when above the waterline.
 *
 * @param point The 3D world-space position on the wall surface.
 * @returns The computed RGB color vector with lighting and occlusion applied.
 */
vec3 getWallColor(vec3 point) {
  float scale = wallLightAbsorption; // Base lighting scale, adjusted by ambient occlusion and lighting

  vec3 wallColor; // Final sampled wall texture color
  vec3 normal;    // Normal vector of the wall at the hit point

  // Determine which wall was hit and calculate texture coordinates + normal accordingly
  if(abs(point.x) > 0.999) {
    // Side walls (X-aligned)
    wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
    normal = vec3(-point.x, 0.0, 0.0); // Normal points outward along ±X
  } else if(abs(point.z) > 0.999) {
    // Front/back walls (Z-aligned)
    wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
    normal = vec3(0.0, 0.0, -point.z); // Normal points outward along ±Z
  } else {
    // Bottom wall
    wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
    normal = vec3(0.0, 1.0, 0.0); // Normal points upward
  }

  // Attenuate brightness by distance from origin (simple ambient occlusion)
  scale /= length(point);

  // Compute the refracted light ray entering water from air, pointing downward
  vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);

  // Lambertian diffuse lighting using the wall's normal
  float diffuse = max(0.0, dot(refractedLight, normal));

  // Sample water height info at XZ position
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);

  if(point.y < info.r) {
    // If wall point is submerged, sample caustic map
    vec4 caustic = texture2D(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);

    // Enhance lighting with caustic contribution
    scale += diffuse * caustic.r * 2.0 * caustic.g;
  } else {
    // Otherwise apply soft-edged shadow near the pool rim
    vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));

    // Sigmoid shadow curve based on projected intersection distance
    float shadowFalloff = -200.0 / (1.0 + 10.0 * (t.y - t.x));
    float projectedY = point.y + refractedLight.y * t.y - 2.0 / 12.0;
    diffuse *= 1.0 / (1.0 + exp(shadowFalloff * projectedY));

    // Subtle additive shadow
    scale += diffuse * 0.5;
  }

  return wallColor * scale;
}
