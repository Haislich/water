#extension GL_OES_standard_derivatives : enable
precision highp float;
precision highp int;

#include <utils> // includes intersectCube, IOR_AIR, IOR_WATER, poolHeight

// uniform vec3 light;
uniform vec3 sphereCenter;
uniform float sphereRadius;

varying vec3 oldPos;
varying vec3 newPos;
varying vec3 ray;

void main() {
    // Step 1: Area ratio for caustics
  float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
  float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
  float intensity = oldArea / newArea * 0.2;

    // Step 2: Refracted light direction
  vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);

    // Step 3: Shadow contribution
  vec3 dir = (sphereCenter - newPos) / sphereRadius;
  vec3 area = cross(dir, refractedLight);
  float shadow = dot(area, area);
  float dist = dot(dir, -refractedLight);
  shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
  shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
  shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));

    // Step 4: Rim shadow
  vec2 t = intersectCube(newPos, -refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
  float rimShadow = 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)));

    // Final color
  gl_FragColor = vec4(intensity, shadow, 0.0, 1.0);
  gl_FragColor.r *= rimShadow;
}
