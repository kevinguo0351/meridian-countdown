export const backgroundVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const backgroundFragment = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uProgress;
uniform float uMilestoneRatio;
uniform vec3 uThemeColor;
uniform float uPulse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = vUv;
  float remain = clamp(uProgress, 0.0, 1.0);

  vec3 warmSky = vec3(0.24, 0.07, 0.03);
  vec3 coolSky = vec3(0.09, 0.095, 0.115);
  vec3 sky = mix(warmSky, coolSky, remain);
  float themeMix = mix(0.58, 0.24, remain);
  sky = mix(sky, uThemeColor, themeMix * 0.55);

  vec3 warmLight = vec3(1.0, 0.58, 0.28);
  vec3 coolLight = vec3(0.95, 0.93, 0.88);
  vec3 lightCol = mix(warmLight, coolLight, remain);
  lightCol = mix(lightCol, uThemeColor, themeMix);

  float lift = mix(0.46, 0.70, uMilestoneRatio);
  vec2 poolUv = vec2(0.5, lift);
  float d = distance(uv, poolUv);
  float pool = exp(-d * d * 5.4);
  float core = exp(-d * d * 26.0);
  float halo = exp(-distance(uv, vec2(0.5, 0.78)) * 2.2) * 0.65;
  float lower = exp(-distance(uv, vec2(0.5, 0.28)) * 3.4);

  vec3 col = vec3(0.015, 0.016, 0.02);
  col += sky * (0.55 + halo * 0.35);
  col += lightCol * pool * (1.05 + uPulse * 0.32);
  col += vec3(1.0, 0.98, 0.94) * core * 0.42;
  col += lightCol * lower * 0.08;

  float n = noise(uv * 2.4 + vec2(uTime * 0.012, -uTime * 0.008));
  n += 0.45 * noise(uv * 5.5 - vec2(uTime * 0.01));
  col += lightCol * n * 0.045 * (0.35 + pool);

  float width = mix(14.0, 7.0, uMilestoneRatio);
  float streak = exp(-pow((uv.x - 0.5) * width, 2.0));
  float vertical = smoothstep(0.06, 0.22, uv.y) * (1.0 - smoothstep(0.9, 0.99, uv.y));
  col += lightCol * streak * vertical * (0.045 + uMilestoneRatio * 0.2 + uPulse * 0.18);

  float grain = hash(uv * vec2(1700.0, 900.0) + fract(uTime * 0.37) * 17.0);
  col += (grain - 0.5) * 0.028;

  vec2 q = uv - 0.5;
  float vig = smoothstep(0.95, 0.28, length(q * vec2(0.78, 1.08)));
  col *= mix(0.74, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`

export const glassVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObj;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = cameraPosition - worldPos.xyz;
  vObj = position;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

export const glassFragment = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObj;
uniform float uTime;
uniform float uProgress;
uniform float uAlign;
uniform vec3 uThemeColor;
uniform float uPulse;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float fres = pow(1.0 - abs(dot(N, V)), 2.15);
  float remain = clamp(uProgress, 0.0, 1.0);

  vec3 warm = vec3(1.0, 0.64, 0.38);
  vec3 cool = vec3(0.75, 0.84, 0.98);
  vec3 tint = mix(warm, cool, remain);
  tint = mix(tint, uThemeColor, mix(0.72, 0.28, remain));

  vec3 R = reflect(-V, N);
  float spec = pow(max(dot(R, normalize(vec3(-0.15, 0.92, 0.32))), 0.0), 28.0);
  float sweep = pow(max(sin(vObj.x * 2.4 + vObj.z * 1.7 + uTime * 0.18), 0.0), 10.0);

  vec3 irid = 0.5 + 0.5 * sin(vec3(0.0, 2.1, 4.2) + fres * 9.0 + uAlign);
  vec3 col = tint * (0.1 + fres * 1.05);
  col += vec3(1.0, 0.97, 0.92) * spec * (0.28 + uAlign * 0.85);
  col += tint * uAlign * 0.16;
  col += irid * fres * 0.07;
  col += tint * sweep * 0.08;
  col += vec3(1.0, 0.96, 0.9) * fres * uPulse * 0.85;

  float alpha = clamp(0.14 + fres * 0.8 + spec * 0.4 + uAlign * 0.1, 0.0, 0.96);
  gl_FragColor = vec4(col, alpha);
}
`

export const crystalFragment = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vObj;
uniform float uTime;
uniform float uProgress;
uniform float uMilestoneRatio;
uniform vec3 uThemeColor;
uniform float uPulse;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float fres = pow(1.0 - abs(dot(N, V)), 1.45);
  float remain = clamp(uProgress, 0.0, 1.0);
  vec3 warm = vec3(1.0, 0.7, 0.4);
  vec3 cool = vec3(0.78, 0.86, 0.98);
  vec3 tint = mix(warm, cool, remain);
  tint = mix(tint, uThemeColor, mix(0.88, 0.4, remain));

  float bands = 0.5 + 0.5 * sin(vObj.y * 22.0 + uTime * 0.35);
  float core = pow(1.0 - fres, 1.8);
  float presence = 0.55 + uMilestoneRatio * 0.7;

  vec3 col = tint * (0.12 + core * 0.38) * presence;
  col += vec3(1.0, 0.97, 0.92) * fres * (0.75 + uPulse);
  col += tint * bands * core * 0.22;
  col += uThemeColor * uPulse * 0.35;

  float alpha = clamp(0.28 + fres * 0.62, 0.0, 0.95);
  gl_FragColor = vec4(col, alpha);
}
`

export const particleVertex = /* glsl */ `
attribute float aSeed;
varying float vSeed;
uniform float uTime;
uniform float uFreeze;
void main() {
  vSeed = aSeed;
  vec3 p = position;
  float t = uTime * (1.0 - uFreeze);
  p.y += sin(t * 0.22 + aSeed * 6.2831) * 0.12;
  p.x += cos(t * 0.13 + aSeed * 12.0) * 0.03;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (1.6 + aSeed * 3.2) * (260.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`

export const particleFragment = /* glsl */ `
varying float vSeed;
uniform float uProgress;
uniform vec3 uThemeColor;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.08, d);
  vec3 warm = vec3(1.0, 0.9, 0.76);
  vec3 cool = vec3(0.84, 0.9, 1.0);
  vec3 col = mix(warm, cool, clamp(uProgress, 0.0, 1.0));
  col = mix(col, uThemeColor, 0.45);
  gl_FragColor = vec4(col, a * (0.16 + vSeed * 0.28));
}
`
