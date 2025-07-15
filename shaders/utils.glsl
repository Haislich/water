const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;
const float poolHeight = 1.;

uniform vec3 light;
uniform sampler2D tiles;
uniform sampler2D causticTex;
uniform sampler2D water;

uniform vec3 sphereCenter;
uniform float sphereRadius;
uniform float aoStrength;
uniform float aoFalloffPower;
uniform float baseLightDiffuse;
uniform float causticProjectionScale;
uniform float causticBoost;
uniform float wallLightAbsorption;

vec3 getSphereColor(vec3 point) {
  vec3 color = vec3(0.5);
  float aoX = 1.0 - aoStrength / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, aoFalloffPower);
  float aoZ = 1.0 - aoStrength / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, aoFalloffPower);
  float aoY = 1.0 - aoStrength / pow((point.y + 1.0 + sphereRadius) / sphereRadius, aoFalloffPower);
  color *= aoX * aoZ * aoY;
  vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
  vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
  float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * baseLightDiffuse;
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
  if(point.y < info.r) {
    vec2 causticUV = causticProjectionScale *
      (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
    vec4 caustic = texture2D(causticTex, causticUV);
    diffuse *= caustic.r * causticBoost;
  }
  color += diffuse;

  return color;
}

vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
  vec3 tMin = (cubeMin - origin) / ray;
  vec3 tMax = (cubeMax - origin) / ray;

  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);

  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);

  return vec2(tNear, tFar);
}

vec3 getWallColor(vec3 point) {
  float scale = wallLightAbsorption;
  vec3 wallColor;
  vec3 normal;

  if(abs(point.x) > 0.999) {
    wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
    normal = vec3(-point.x, 0.0, 0.0);
  } else if(abs(point.z) > 0.999) {
    wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
    normal = vec3(0.0, 0.0, -point.z);
  } else {
    wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
    normal = vec3(0.0, 1.0, 0.0);
  }

  scale /= length(point);

  vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);

  float diffuse = max(0.0, dot(refractedLight, normal));

  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);

  if(point.y < info.r) {
    vec4 caustic = texture2D(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);

    scale += diffuse * caustic.r * 2.0 * caustic.g;
  } else {
    vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));

    float shadowFalloff = -200.0 / (1.0 + 10.0 * (t.y - t.x));
    float projectedY = point.y + refractedLight.y * t.y - 2.0 / 12.0;
    diffuse *= 1.0 / (1.0 + exp(shadowFalloff * projectedY));
    scale += diffuse * 0.5;
  }

  return wallColor * scale;
}
