// Original — Frictionborn Motion "Ember Core" GLSL shaders (ash filaments, inner glow, pointer torch, and bloom passes)
// Source: https://github.com/stegu/webgl-noise — MIT — Copyright (C) 2011 Ashima Arts, Stefan Gustavson

export const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export const EFFECTS_GLSL = /* glsl */ `
uniform vec3 uPointer, uWaveO, uCameraPos;
uniform float uPointerOn, uSwirl, uWaveT;
// Moves w in place and returns the extra heat it picked up.
float effects(inout vec3 w, float t){
  vec3 toP = w - uPointer;
  float fall = uPointerOn * exp(-dot(toP, toP) * 6.5);
  // Vortex: rotate around the view axis through the pointer, like a hand through smoke.
  vec3 axis = normalize(uCameraPos - uPointer);
  float ang = fall * uSwirl * (1.5 + 0.5 * sin(t * 1.3));
  float c = cos(ang), s = sin(ang);
  vec3 rot = toP * c + cross(axis, toP) * s + axis * dot(axis, toP) * (1.0 - c);
  w = uPointer + rot + normalize(toP + 1e-4) * fall * 0.09 * uSwirl;
  float heat = fall * 1.3;
  if (uWaveT < 3.0) {
    float dw = distance(w, uWaveO);
    float band = exp(-pow((dw - uWaveT * 1.9) * 6.5, 2.0)) * exp(-uWaveT * 1.1);
    w += normalize(w + 1e-4) * band * 0.15;
    heat += band * 1.8;
  }
  return heat;
}`;

export const FILAMENT_VERT = `#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in float aSeed;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjMatrix;
uniform float uTime, uFlare, uSize, uPR, uHeat, uCharge, uBurst, uLightTheme;
uniform vec3 uAsh, uEmber, uHot;

out vec3 vColor;
out float vAlpha;

${NOISE_GLSL}
${EFFECTS_GLSL}

void main(){
  vec3 p = position;
  float t = uTime * 0.07;
  vec3 q = p * 1.25;
  vec3 disp = vec3(
    snoise(q + vec3(t, 0.0, 0.0)),
    snoise(q + vec3(0.0, t + 13.1, 0.0)),
    snoise(q + vec3(0.0, 0.0, t + 27.3))
  );
  p += disp * (0.16 + uFlare * 0.06);
  p *= 1.0 + 0.025 * sin(uTime * 0.45 + aSeed * 6.2831) + uFlare * 0.07;
  // Charge: the cloud pulls in and trembles. Burst: it flies out, then springs back.
  p *= 1.0 - uCharge * 0.14;
  p += disp * uCharge * 0.05 * sin(uTime * 40.0 + aSeed * 30.0);
  p += normalize(p + 1e-4) * uBurst * (0.35 + aSeed * 1.1);

  vec3 w = (uModelMatrix * vec4(p, 1.0)).xyz;
  float extra = effects(w, uTime);

  float r = length(position);
  float n = snoise(p * 1.15 - vec3(0.0, uTime * 0.11, 0.0)) * 0.5 + 0.5;
  float heat = smoothstep(0.66, 1.08, n + (1.0 - r) * 0.6 - p.y * 0.28) * uHeat;
  heat += extra + uFlare * 0.85 * smoothstep(1.25, 0.2, r) + uCharge * 1.1 * smoothstep(1.1, 0.3, r) + uBurst * 0.9;

  vec3 ashTone = mix(uAsh, vec3(0.92, 0.88, 0.84), uLightTheme * 0.44);
  vec3 c = mix(ashTone, uEmber, clamp(heat, 0.0, 1.0));
  c = mix(c, uHot, clamp(heat - 1.0, 0.0, 1.0));
  c *= 1.0 + clamp(heat, 0.0, 1.5) * 0.32;
  vColor = c;
  float baseAlpha = mix(0.46, 0.64, uLightTheme);
  vAlpha = clamp((mix(baseAlpha, 0.86, clamp(heat, 0.0, 1.0)) + uBurst * 0.16) * (0.65 + 0.35 * aSeed), 0.0, 1.0);

  vec4 mv = uViewMatrix * vec4(w, 1.0);
  gl_Position = uProjMatrix * mv;
  gl_PointSize = uSize * uPR * (0.55 + aSeed * 0.82) * (3.0 / max(0.1, -mv.z));
}
`;

export const FILAMENT_FRAG = `#version 300 es
precision highp float;

in vec3 vColor;
in float vAlpha;
out vec4 fragColor;

void main(){
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  fragColor = vec4(vColor * a * vAlpha, a * vAlpha);
}
`;

export const GLOW_VERT = `#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in float aSeed;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjMatrix;
uniform float uTime, uFlare, uPR, uHeat, uCharge, uBurst;

out float vI;

${NOISE_GLSL}
${EFFECTS_GLSL}

void main(){
  vec3 p = position;
  p *= 1.0 - uCharge * 0.2;
  p += normalize(p + 1e-4) * uBurst * (0.2 + aSeed * 0.6);
  float n = snoise(p * 1.6 - vec3(0.0, uTime * 0.13, 0.0)) * 0.5 + 0.5;
  vec3 w = (uModelMatrix * vec4(p, 1.0)).xyz;
  float extra = effects(w, uTime);
  vI = ((smoothstep(0.35, 1.0, n) * 0.13 + 0.022) * (1.0 - clamp(p.y, -0.5, 0.6) * 0.9)) * uHeat
     + uFlare * 0.17 + uCharge * 0.22 + uBurst * 0.16 + extra * 0.03;
  vec4 mv = uViewMatrix * vec4(w, 1.0);
  gl_Position = uProjMatrix * mv;
  gl_PointSize = (80.0 + aSeed * 70.0) * uPR * (3.0 / max(0.1, -mv.z)) * (1.0 + uFlare * 0.5 + uCharge * 0.3 + uBurst * 0.35);
}
`;

export const GLOW_FRAG = `#version 300 es
precision highp float;

uniform vec3 uGA, uGB;
in float vI;
out vec4 fragColor;

void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = exp(-d * d * 18.0);
  vec3 c = mix(uGA, uGB, a * a);
  fragColor = vec4(c * a * vI, a * vI);
}
`;

export const TORCH_VERT = `#version 300 es
precision highp float;

layout(location = 0) in vec3 position;

uniform mat4 uViewMatrix;
uniform mat4 uProjMatrix;
uniform vec3 uPointer;
uniform float uPointerOn, uPR, uTime;

void main(){
  vec4 mv = uViewMatrix * vec4(uPointer + position * 0.0, 1.0);
  gl_Position = uProjMatrix * mv;
  gl_PointSize = (110.0 + 14.0 * sin(uTime * 9.0)) * uPR * (3.0 / max(0.1, -mv.z)) * uPointerOn;
}
`;

export const TORCH_FRAG = `#version 300 es
precision highp float;

uniform vec3 uGB, uHot;
uniform float uPointerOn;
out vec4 fragColor;

void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = (exp(-d * d * 30.0) * 0.45 + exp(-d * d * 200.0) * 0.5) * uPointerOn;
  fragColor = vec4(mix(uGB, uHot, exp(-d * d * 120.0)) * a, a);
}
`;

export const POST_VERT = `#version 300 es
precision highp float;

layout(location = 0) in vec2 position;
out vec2 vUv;

void main(){
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const BLOOM_THRESHOLD_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform float uThreshold;
in vec2 vUv;
out vec4 fragColor;

void main(){
  vec4 c = texture(uTex, vUv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float knee = 0.08;
  float w = smoothstep(uThreshold, uThreshold + knee, lum);
  fragColor = vec4(c.rgb * w, c.a * w);
}
`;

export const BLOOM_BLUR_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform vec2 uDir;
uniform float uRadius;
in vec2 vUv;
out vec4 fragColor;

void main(){
  vec2 stepUv = uDir * (0.5 + uRadius * 1.4);
  vec4 sum = texture(uTex, vUv) * 0.227027;
  sum += texture(uTex, vUv + stepUv * 1.384615) * 0.316216;
  sum += texture(uTex, vUv - stepUv * 1.384615) * 0.316216;
  sum += texture(uTex, vUv + stepUv * 3.230769) * 0.070270;
  sum += texture(uTex, vUv - stepUv * 3.230769) * 0.070270;
  fragColor = sum;
}
`;

export const BLOOM_COMPOSITE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uSceneTex;
uniform sampler2D uBloomTex;
uniform float uStrength;
uniform float uLightTheme;
uniform vec2 uPlateCenter;
uniform float uAspect;
in vec2 vUv;
out vec4 fragColor;

void main(){
  vec4 scene = texture(uSceneTex, vUv);
  vec4 bloom = texture(uBloomTex, vUv) * uStrength;
  vec3 rgb = scene.rgb + bloom.rgb;
  float bloomA = max(bloom.r, max(bloom.g, bloom.b));
  float a = clamp(scene.a + bloomA, 0.0, 1.0);
  if (uLightTheme > 0.5) {
    vec2 d = (vUv - vec2(0.5)) * 2.0;
    float dist = length(d);
    float edgeMask = 1.0 - smoothstep(0.46, 0.82, dist);
    float plateA = (1.0 - smoothstep(0.32, 0.78, dist)) * 0.94;
    vec3 plateRgb = mix(vec3(0.045, 0.039, 0.035), vec3(0.095, 0.084, 0.076), smoothstep(0.0, 0.74, dist));
    rgb = rgb * edgeMask + plateRgb * plateA * (1.0 - clamp(a * edgeMask * 0.88, 0.0, 1.0));
    a = clamp(a * edgeMask + plateA * (1.0 - a * edgeMask), 0.0, 1.0);
  }
  fragColor = vec4(rgb, a);
}
`;
