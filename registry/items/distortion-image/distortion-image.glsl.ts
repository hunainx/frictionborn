// Original — Frictionborn Motion DistortionImage shaders
export const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  // Flip Y to match standard DOM top-left image orientation
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

// Original — Frictionborn Motion DistortionImage ripple displacement shader
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_progress;
uniform float u_strength;
uniform float u_speed;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 uv = v_uv;

  // Aspect ratio correction for circular radial ripples rather than stretched ovals
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  vec2 aspectVec = vec2(aspect, 1.0);

  // Vector from pointer coordinates to current fragment
  vec2 delta = (uv - u_mouse) * aspectVec;
  float dist = length(delta);

  // Radial influence: max impact near pointer, smooth decay to zero
  float radius = 0.60;
  float influence = smoothstep(radius, 0.0, dist);

  // Concentric wave equations modulated by progress and time
  float wave = sin(dist * 26.0 - u_time * u_speed * 4.5) * 0.5 + 0.5;
  float wave2 = cos(dist * 18.0 - u_time * u_speed * 3.0) * 0.5 + 0.5;

  // Directional displacement vector
  vec2 dir = dist > 0.0001 ? normalize(delta / aspectVec) : vec2(0.0);

  // Displacement magnitude scaled by strength and interactive progress
  float dispAmount = wave * wave2 * influence * u_strength * u_progress * 0.07;

  // Subtle chromatic aberration for depth
  vec2 uvR = uv - dir * (dispAmount * 1.15);
  vec2 uvG = uv - dir * dispAmount;
  vec2 uvB = uv - dir * (dispAmount * 0.85);

  // Clamp UVs to avoid edge wrap artifacts
  uvR = clamp(uvR, 0.001, 0.999);
  uvG = clamp(uvG, 0.001, 0.999);
  uvB = clamp(uvB, 0.001, 0.999);

  float r = texture(u_image, uvR).r;
  float g = texture(u_image, uvG).g;
  float b = texture(u_image, uvB).b;
  float a = texture(u_image, uvG).a;

  // Gentle optical highlight along crests
  float highlight = pow(wave, 3.5) * influence * u_progress * 0.06;

  float alpha = clamp(a * u_progress, 0.0, 1.0);
  vec3 rgb = (vec3(r, g, b) + highlight) * alpha;

  fragColor = vec4(rgb, alpha);
}
`;
