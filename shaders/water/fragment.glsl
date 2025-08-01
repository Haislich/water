precision highp float;
precision highp int;

#include <utils>

uniform float underwater;
uniform samplerCube sky;

uniform vec3 eye;

uniform vec3 abovewaterColor;
uniform vec3 underwaterColor;
varying vec3 pos;

float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {
  vec3 toSphere = origin - sphereCenter;

  float a = dot(ray, ray);
  float b = 2.0 * dot(toSphere, ray);
  float c = dot(toSphere, toSphere) - sphereRadius * sphereRadius;

  float discriminant = b * b - 4.0 * a * c;

  if(discriminant > 0.0) {
    float t = (-b - sqrt(discriminant)) / (2.0 * a);
    if(t > 0.0)
      return t;
  }
  return 1.0e6;
}

vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
  vec3 color;

  float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
  if(q < 1.0e6) {
    vec3 sphereHit = origin + ray * q;
    color = getSphereColor(sphereHit);

  } else {
    vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    vec3 hit = origin + ray * t.y;

    if(ray.y < 0.0) {
      color = getWallColor(hit);

    } else {
      if(hit.y < 2.0 / 12.0) {
        color = getWallColor(hit);
      } else {
        color = textureCube(sky, ray).rgb;
        // vec2 screenUV = 0.5 * (ray.xz / -ray.y) + 0.5;
        // color = texture2D(uReflectionTex, screenUV).rgb;

        // float sunSpec = pow(max(0.0, dot(light, ray)), 300.0);
        float sunSpec = pow(clamp(dot(light, ray), 0.0, 1.0), 300.0);

        //color += sunSpec * vec3(10.0, 8.0, 6.0);
        sunSpec * vec3(2.0, 1.5, 1.0);
      }
    }
  }
  if(ray.y < 0.0)
    color *= waterColor;

  return color;
}

void main() {
  vec2 coord = pos.xz * 0.5 + 0.5;
  vec4 info = texture2D(water, coord);

  for(int i = 0; i < 5; i++) {
    coord += info.ba * 0.005;
    info = texture2D(water, coord);
  }

  vec2 slope = info.ba;
  vec3 normal = vec3(slope.x, sqrt(1.0 - dot(slope, slope)), slope.y);

  vec3 incomingRay = normalize(pos - eye);

  if(underwater == 1.0) {
    normal = -normal;

    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);

    // float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));//
    float ndoti = clamp(dot(normal, -incomingRay), 0.0, 1.0);
    float fresnel = mix(0.25, 1.0, pow(1.0 - ndoti, 3.0));

    vec3 reflectedColor = getSurfaceRayColor(pos, reflectedRay, underwaterColor);
    vec3 refractedColor = getSurfaceRayColor(pos, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);

    gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);

  } else {
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

    vec3 reflectedColor = getSurfaceRayColor(pos, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(pos, refractedRay, abovewaterColor);

    gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
  }
}
