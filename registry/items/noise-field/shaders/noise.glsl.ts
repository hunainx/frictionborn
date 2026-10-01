// Original — Frictionborn Motion
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
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

// Original hash function
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 2D Value-Gradient noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 4-octave Fractional Brownian Motion
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  p *= (u_scale > 0.0 ? u_scale : 1.8);

  float t = u_time * (u_speed > 0.0 ? u_speed : 0.08);

  // Domain warping: warps coordinates through nested fbm stages
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.4)), fbm(p + vec2(5.2, 1.3 - t * 0.3)));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7 - t * 0.2, 9.2)), fbm(p + 3.0 * q + vec2(8.3, 2.8 + t * 0.15)));
  float f = fbm(p + 3.5 * r);

  float normF = clamp(f * 0.5 + 0.5, 0.0, 1.0);
  float normQ = clamp(length(q) * 0.8, 0.0, 1.0);

  // Palette interpolation between 3 theme colors
  vec3 col = mix(u_color1, u_color2, normF);
  col = mix(col, u_color3, normQ * normF);

  // Edge vignette for soft contrast
  float vig = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5) * 1.5);
  col *= mix(0.75, 1.0, vig);

  fragColor = vec4(col, 1.0);
}
`;
