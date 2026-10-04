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
uniform float u_distortion;
uniform float u_swirl;
uniform float u_grain_mixer;
uniform float u_grain_overlay;
uniform int u_octaves;

uniform vec3 u_color0;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

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

// Original Frictionborn organic mesh-gradient composition
void main() {
  vec2 p = v_uv;

  // 1. Swirl distortion around center
  vec2 center = vec2(0.5, 0.5);
  vec2 d = p - center;
  float r = length(d);
  float theta = atan(d.y, d.x);
  float swirlEffect = u_swirl * sin(r * 4.0 - u_time * 0.4);
  vec2 pSwirl = center + vec2(cos(theta + swirlEffect), sin(theta + swirlEffect)) * r;

  // 2. Domain-warping with simplex noise
  vec2 warp = vec2(
    snoise(pSwirl * 2.2 + vec2(u_time * 0.15, -u_time * 0.10)),
    snoise(pSwirl * 2.2 + vec2(-u_time * 0.12, u_time * 0.18))
  );
  vec2 pWarped = pSwirl + warp * (u_distortion * 0.28);

  if (u_octaves >= 3) {
    vec2 warpFine = vec2(
      snoise(pWarped * 4.4 + vec2(-u_time * 0.20, u_time * 0.25)),
      snoise(pWarped * 4.4 + vec2(u_time * 0.22, -u_time * 0.15))
    );
    pWarped += warpFine * (u_distortion * 0.12);
  }

  // 3. Dynamic color anchor centers (matching CSS poster positions at rest)
  vec2 a1 = vec2(0.20, 0.30) + vec2(0.08 * sin(u_time * 0.35), 0.06 * cos(u_time * 0.45));
  vec2 a2 = vec2(0.80, 0.70) + vec2(0.07 * cos(u_time * 0.40), 0.08 * sin(u_time * 0.30));
  vec2 a3 = vec2(0.50, 0.50) + vec2(0.06 * sin(u_time * 0.50), 0.07 * cos(u_time * 0.35));

  // 4. Weight interpolation
  float d1 = distance(pWarped, a1);
  float w1 = smoothstep(0.65, 0.0, d1) * 0.75;

  float d2 = distance(pWarped, a2);
  float w2 = smoothstep(0.60, 0.0, d2) * 0.70;

  float d3 = distance(pWarped, a3);
  float w3 = smoothstep(0.70, 0.0, d3) * 0.80;

  // 5. Blending with base color
  vec3 col = u_color0;
  col = mix(col, u_color1, w1);
  col = mix(col, u_color2, w2);
  col = mix(col, u_color3, w3);

  // 6. Subtle grain overlay / dither to eliminate banding
  float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  float grain = noise * (u_grain_mixer * 0.3 + u_grain_overlay * 0.7);
  col += grain;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
