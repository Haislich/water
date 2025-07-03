uniform sampler2D water;


varying vec3 eye;
varying vec3 pos;


void main() {
  // Mapping from clip coordinates to uv coordinates for accessing the
  // water texture
  vec2 uvPosition = position.xy * 0.5 + 0.5;
  vec4 info = texture2D(water, uvPosition );
  // Reorder the vertex position, so that the fla lies on the XZ plane
  pos = position.xzy;
  // Add the height diplacement stored in the texture
  pos.y += info.r;

  // Computations to get the camera position in view space
  vec3 axis_x = vec3(modelViewMatrix[0].x, modelViewMatrix[0].y, modelViewMatrix[0].z);
  vec3 axis_y = vec3(modelViewMatrix[1].x, modelViewMatrix[1].y, modelViewMatrix[1].z);
  vec3 axis_z = vec3(modelViewMatrix[2].x, modelViewMatrix[2].y, modelViewMatrix[2].z);
  vec3 offset = vec3(modelViewMatrix[3].x, modelViewMatrix[3].y, modelViewMatrix[3].z);
  // eye = R^T (-t)
  /*
  Where:
  - R: rotational part of the modelViewMatrix
  - t: Translational part of the modelViewMatrix
  
  The result is The camera position relative to the model’s local frame, expressed in view coordinates.
  */
  eye = vec3(dot(-offset, axis_x), dot(-offset, axis_y), dot(-offset, axis_z));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
