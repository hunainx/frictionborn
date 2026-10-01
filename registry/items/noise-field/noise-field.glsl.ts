// Source: https://github.com/stegu/webgl-noise — MIT — Copyright (C) 2011 Ashima Arts, Stefan Gustavson
// Adaptation & composition: Original — Frictionborn Motion
export const vertexShaderSource = `#version 300 es
in vec2 position;
out vec2 v_uv;

void main() {
  v_uv = (position + 1.0) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform float u_intensity;
uniform int u_octaves;
uniform vec3 u_color_bg;
uniform vec3 u_color_primary;
uniform vec3 u_color_accent;

// --- Stefan Gustavson / Ashima Arts 2D Simplex Noise (MIT License) ---
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
   -0.577350269189626,   // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );

  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
// --- End simplex noise primitive ---

// Original Frictionborn multi-octave kinetic flow composition
const mat2 FLOW_ROT1 = mat2(0.80,  0.60, -0.60,  0.80);
const mat2 FLOW_ROT2 = mat2(0.70, -0.71,  0.71,  0.70);

float flowField(vec2 p, float t, int octaves) {
  float val = 0.0;
  float amp = 0.52;
  vec2 coord = p;

  // Primary base layer
  val += amp * (snoise(coord + vec2(t * 0.12, -t * 0.08)) * 0.5 + 0.5);
  coord = FLOW_ROT1 * coord * 1.95 + vec2(1.4, 2.7);
  amp *= 0.50;

  // Secondary layer
  val += amp * (snoise(coord + vec2(-t * 0.15, t * 0.18)) * 0.5 + 0.5);
  coord = FLOW_ROT2 * coord * 2.05 + vec2(3.1, 1.6);
  amp *= 0.48;

  // High-detail octaves active in Tier 3
  if (octaves >= 3) {
    val += amp * (snoise(coord + vec2(t * 0.22, t * 0.11)) * 0.5 + 0.5);
    coord = FLOW_ROT1 * coord * 2.10 + vec2(0.9, 4.3);
    amp *= 0.45;
  }
  if (octaves >= 4) {
    val += amp * (snoise(coord - vec2(t * 0.18, t * 0.25)) * 0.5 + 0.5);
  }

  return val;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 aspect = vec2(u_resolution.x / min(u_resolution.x, u_resolution.y),
                     u_resolution.y / min(u_resolution.x, u_resolution.y));
  vec2 p = (v_uv - 0.5) * aspect;

  float scale = u_scale > 0.0 ? u_scale : 1.8;
  p *= scale;

  float t = u_time * (u_speed > 0.0 ? u_speed : 0.4);
  int octaves = u_octaves > 0 ? u_octaves : 4;

  // Original advective warp: sample flow velocity field to advect sample coordinates
  vec2 drift = vec2(
    snoise(p * 0.75 + vec2(t * 0.08, 1.2)),
    snoise(p * 0.75 + vec2(3.4, t * 0.09))
  );

  vec2 warpedP = p + drift * 0.38;
  float intensity = u_intensity > 0.0 ? u_intensity : 1.0;
  float n = flowField(warpedP, t, octaves) * intensity;

  // Wide contrast remapping curve to eliminate muddy mid-range
  float tPrimary = smoothstep(0.20, 0.65, n);
  float tAccent  = smoothstep(0.55, 0.92, n);

  // Blend from background base -> primary -> accent
  vec3 col = mix(u_color_bg, u_color_primary, tPrimary * 0.85);
  col = mix(col, u_color_accent, tAccent * 0.90);

  // Soft vignette grounding edges into background token
  float vignette = smoothstep(1.3, 0.3, length((v_uv - 0.5) * aspect));
  col = mix(u_color_bg, col, clamp(vignette + 0.15, 0.0, 1.0));

  fragColor = vec4(col, 1.0);
}
`;
