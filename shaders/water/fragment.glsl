/**
 * Fragment shader for rendering the water surface with physically-inspired reflection, refraction,
 * caustics, and lighting effects. Handles both above- and under-water views.
 *
 * Inputs:
 *   - uniform sampler2D water: Heightfield and normal data in RGBA texture.
 *   - uniform samplerCube sky: Environment cube map used for reflections.
 *   - uniform vec3 eye: World-space camera/viewer position.
 *   - uniform vec3 sphereCenter: Center of the floating object.
 *   - uniform float sphereRadius: Radius of the floating object.
 *   - uniform vec3 abovewaterColor: Modulation color applied to above-water refraction.
 *   - uniform vec3 underwaterColor: Modulation color for underwater lighting.
 *   - uniform float underwater: 1.0 if the camera is underwater, 0.0 otherwise.
 *   - varying vec3 pos: World-space position of the surface point (from vertex shader).
 *
 * Outputs:
 *   - gl_FragColor: Final color for the water surface at this fragment.
 */

// High-precision
precision highp float;
precision highp int;

// Imports getWallColor(), intersectCube()
#include <utils>

uniform float underwater;
uniform samplerCube sky;

uniform vec3 eye;

uniform float sphereRadius;
uniform float aoStrength;
uniform float aoFalloffPower;
uniform float baseLightDiffuse;
uniform float causticProjectionScale;
uniform float causticBoost;

uniform vec3 sphereCenter;
uniform vec3 abovewaterColor;
uniform vec3 underwaterColor;

varying vec3 pos;

/**
 * Computes the surface color of a point on the floating sphere.
 *
 * Includes:
 * - Ambient occlusion from pool boundaries.
 * - Lambertian lighting based on refracted sunlight.
 * - Caustic light projection when submerged.
 *
 * @param point World-space position on the surface of the sphere.
 * @returns The final RGB color of the sphere at this point.
 */
vec3 getSphereColor(vec3 point) {
  // --- Base ambient term ---
  vec3 color = vec3(0.5); // Neutral gray baseline

  // --- Ambient occlusion ---
  // Approximates how "trapped" the point is between walls/floor
  float aoX = 1.0 - aoStrength / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, aoFalloffPower);
  float aoZ = 1.0 - aoStrength / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, aoFalloffPower);
  float aoY = 1.0 - aoStrength / pow((point.y + 1.0 + sphereRadius) / sphereRadius, aoFalloffPower);
  color *= aoX * aoZ * aoY;

  // --- Lighting ---
  vec3 sphereNormal = (point - sphereCenter) / sphereRadius;

  // Light bends from air into water
  vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);

  // Diffuse light amount hitting the sphere from underwater
  float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * baseLightDiffuse;

  // --- Caustics (only applied when submerged) ---
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
  if(point.y < info.r) {
    // Project point to caustic texture space
    vec2 causticUV = causticProjectionScale *
      (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;

    vec4 caustic = texture2D(causticTex, causticUV);

    // Boost the lighting using caustic strength
    diffuse *= caustic.r * causticBoost;
  }

  // Add the lighting contribution
  color += diffuse;

  return color;
}

/**
 * Computes the first intersection distance `t` along a ray with a sphere.
 *
 * The ray is defined by an origin and a direction. The function solves the
 * quadratic equation:
 *     a*t² + b*t + c = 0
 * for the parameter `t`, where the ray at intersection is:
 *     P(t) = origin + t * ray
 *
 * @param origin        Ray origin in world space.
 * @param ray           Ray direction (assumed normalized or consistent).
 * @param sphereCenter  Center of the sphere.
 * @param sphereRadius  Radius of the sphere.
 * @returns Distance `t` to the first intersection point, or a large value if no hit.
 */
float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {
  // Vector from ray origin to sphere center
  vec3 toSphere = origin - sphereCenter;

  // Coefficients for the quadratic equation
  float a = dot(ray, ray);                         // Usually 1.0 if ray is normalized
  float b = 2.0 * dot(toSphere, ray);              // Linear term
  float c = dot(toSphere, toSphere) - sphereRadius * sphereRadius;  // Constant term

  // Discriminant determines if there's a real solution
  float discriminant = b * b - 4.0 * a * c;

  if(discriminant > 0.0) {
    // Compute the closer intersection (smallest positive root)
    float t = (-b - sqrt(discriminant)) / (2.0 * a);
    if(t > 0.0)
      return t;
  }

  // No valid intersection: return a large sentinel value
  return 1.0e6;
}

/**
 * Casts a ray into the scene and computes the color of what it hits.
 *
 * The ray can:
 * - Intersect the floating sphere → use getSphereColor().
 * - Hit a pool wall (below the water surface).
 * - Escape the scene and return the environment (sky cube map + specular highlight).
 *
 * If the ray is going downward (into water), the result is multiplied by `waterColor`
 * to simulate underwater attenuation or tinting.
 *
 * @param origin      Ray origin in world space.
 * @param ray         Ray direction (does not need to be normalized).
 * @param waterColor  RGB attenuation color applied if ray travels through water.
 * @returns           The final surface color seen along the ray.
 */
vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
  vec3 color;

  // First check: ray hits the floating sphere
  float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
  if(q < 1.0e6) {
    vec3 sphereHit = origin + ray * q;
    color = getSphereColor(sphereHit);

  } else {
    // Ray does not hit sphere — check the cube pool volume
    vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    vec3 hit = origin + ray * t.y;

    if(ray.y < 0.0) {
      // Ray points downward into pool → hit pool wall
      color = getWallColor(hit);

    } else {
      // Ray points upward
      if(hit.y < 2.0 / 12.0) {
        // Still within the pool walls — close to top edge
        color = getWallColor(hit);
      } else {
        // Outside pool volume — return skybox sample + specular sparkle
        color = textureCube(sky, ray).rgb;

        // Very sharp highlight for sun glint on surface
        float sunSpec = pow(max(0.0, dot(light, ray)), 5000.0);
        color += sunSpec * vec3(10.0, 8.0, 6.0);  // Slightly yellow-white sparkle
      }
    }
  }

  // If the ray goes into the water, apply waterColor tint
  if(ray.y < 0.0)
    color *= waterColor;

  return color;
}

/**
 * Fragment shader entry point for rendering the dynamic water surface.
 * 
 * This shader combines normal reconstruction from the water heightmap,
 * physically inspired reflection/refraction with Fresnel blending,
 * and optionally applies underwater coloring and distortion.
 */
void main() {
  // --- Sample height and slope at current water surface point ---
  vec2 coord = pos.xz * 0.5 + 0.5;
  vec4 info = texture2D(water, coord);

  // --- Enhance wave peak sharpness by iteratively offsetting the sample ---
  // Moves UVs in the direction of local slope to exaggerate wave crest curvature
  for(int i = 0; i < 5; i++) {
    coord += info.ba * 0.005;  // info.b = dHeight/dx, info.a = dHeight/dz
    info = texture2D(water, coord);
  }

  // --- Reconstruct the normal from the slope vectors ---
  vec2 slope = info.ba;
  vec3 normal = vec3(slope.x, sqrt(1.0 - dot(slope, slope)), // Enforces unit length
  slope.y);

  // --- Compute incoming view ray from eye to surface point ---
  vec3 incomingRay = normalize(pos - eye);

  // --- Handle underwater view ---
  if(underwater == 1.0) {
    normal = -normal;  // Flip normal to face camera

    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);

    // Fresnel term (cubic approximation) for underwater view
    float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

    // Surface contribution for both paths
    vec3 reflectedColor = getSurfaceRayColor(pos, reflectedRay, underwaterColor);
    vec3 refractedColor = getSurfaceRayColor(pos, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);  // Slight bluish bias

    // Blend based on (1 - fresnel) and refracted ray length (depth cue)
    gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);

  // --- Handle above-water view ---
  } else {
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);

    // Fresnel term (sharper edge highlight for air → water)
    float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

    vec3 reflectedColor = getSurfaceRayColor(pos, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(pos, refractedRay, abovewaterColor);

    // Blend based on Fresnel (note: above water uses Fresnel as-is)
    gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
  }
}
