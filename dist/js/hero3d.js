// 702 hero: a ring of curved photo panels in WebGL.
// Outside view on load -> camera descends into the ring on scroll -> the
// rooms rotate past -> panels drift outward as the section ends.
import * as THREE from '../vendor/three.module.min.js';

const PANELS = [
  ['13', 'The room'], ['02', 'Entrance'], ['11', 'Kitchen'], ['07', 'Wash station'],
  ['04', 'Wash area'], ['08', 'Staircase'], ['18', 'Kitchen sink'], ['12', 'Room corner']
];
const N = PANELS.length;
const STEP = (Math.PI * 2) / N;
const W = 2.4, H = 3.2, R = 3.75, CHAPTER_STEPS = 5;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const vertex = /* glsl */`
  uniform float uTheta, uRadius, uVel, uIntro, uMirror, uFloor;
  varying vec2 vUv;
  varying float vDepth;
  void main(){
    vUv = uv;
    float radius = uRadius + (1.0 - uIntro) * 5.0;
    float a = uTheta - position.x / radius;
    vec3 n = vec3(sin(a), 0.0, cos(a));
    vec3 p = vec3(n.x * radius, position.y, n.z * radius);
    // velocity bends the panels like fabric
    p -= n * sin(uv.y * 3.14159) * uVel * 0.32;
    p.y += sin(uv.x * 3.14159) * uVel * 0.18;
    p.y += (1.0 - uIntro) * -1.5;
    if (uMirror > 0.5) p.y = 2.0 * uFloor - p.y;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;

const fragment = /* glsl */`
  uniform sampler2D uTex;
  uniform float uVel, uLight, uOpacity, uIntro, uMirror;
  uniform vec3 uFog;
  uniform vec2 uSize;
  varying vec2 vUv;
  varying float vDepth;
  void main(){
    bool front = gl_FrontFacing;
    if (uMirror > 0.5) front = !front;
    vec2 uv = vUv;
    if (!front) uv.x = 1.0 - uv.x;
    float s = clamp(uVel, -1.0, 1.0) * 0.012;
    vec3 c;
    c.r = texture2D(uTex, uv + vec2(s, 0.0)).r;
    c.g = texture2D(uTex, uv).g;
    c.b = texture2D(uTex, uv - vec2(s, 0.0)).b;
    // rounded corners
    float r = 0.12;
    vec2 q = abs(vUv - 0.5) * uSize - (uSize * 0.5 - r);
    float d = length(max(q, 0.0)) - r;
    float alpha = 1.0 - smoothstep(-0.01, 0.01, d);
    float vig = smoothstep(0.95, 0.25, length(vUv - 0.5));
    c *= mix(0.42, 1.0, uLight) * mix(0.75, 1.0, vig);
    if (!front) c *= 0.72;
    float fog = smoothstep(9.0, 26.0, vDepth);
    c = mix(c, uFog, fog);
    if (uMirror > 0.5) alpha *= smoothstep(0.55, 0.0, vUv.y) * 0.2;
    gl_FragColor = vec4(c, alpha * uOpacity * uIntro);
    #include <colorspace_fragment>
  }`;

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createHero(canvas, { onProgress = () => {}, onChapter = () => {} } = {}) {
  const small = matchMedia('(max-width: 820px)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const bg = new THREE.Color('#0d1313');
  renderer.setClearColor(bg, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 80);

  // textures
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, loaded, total) => onProgress(loaded / total);
  const ready = new Promise(res => { manager.onLoad = res; manager.onError = () => {}; });
  const loader = new THREE.TextureLoader(manager);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const ring = new THREE.Group();
  scene.add(ring);
  const geo = new THREE.PlaneGeometry(W, H, 40, 1);
  const panels = PANELS.map(([id, name], i) => {
    const tex = loader.load(`assets/${id}${small ? '-thumb' : ''}.webp`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, maxAniso);
    const uniforms = {
      uTex: { value: tex }, uTheta: { value: i * STEP }, uRadius: { value: R }, uVel: { value: 0 },
      uLight: { value: 1 }, uOpacity: { value: 1 }, uIntro: { value: 0 }, uMirror: { value: 0 },
      uFloor: { value: -H / 2 - 0.18 }, uFog: { value: bg }, uSize: { value: new THREE.Vector2(W, H) }
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    const mirrorMat = mat.clone();
    mirrorMat.uniforms = THREE.UniformsUtils.clone(uniforms);
    mirrorMat.uniforms.uTex.value = tex;
    mirrorMat.uniforms.uMirror.value = 1;
    mirrorMat.uniforms.uFog.value = bg;
    const mirror = new THREE.Mesh(geo, mirrorMat);
    mirror.frustumCulled = false;
    mirror.renderOrder = -1;
    ring.add(mirror, mesh);
    return { id, name, mesh, mirror, u: uniforms, mu: mirrorMat.uniforms };
  });

  // floor glow
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshBasicMaterial({ map: glowTexture('rgba(94,211,198,0.22)', 'rgba(94,211,198,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -H / 2 - 0.2;
  scene.add(floor);

  // dust particles
  const count = small ? 220 : 520;
  const pos = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 13;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -2.5 + Math.random() * 8; pos[i * 3 + 2] = Math.sin(a) * r;
    seeds[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: small ? 0.07 : 0.055, map: glowTexture('rgba(255,210,180,1)', 'rgba(255,210,180,0)'), transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color('#ffd8c4'), opacity: 0.75
  }));
  scene.add(dust);

  // state
  let progress = 0, vel = 0, velTarget = 0, idle = 0, calm = false, running = false, visible = true;
  let px = 0, py = 0, pxs = 0, pys = 0, last = performance.now(), chapter = -1, introStarted = false;
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.4, 14), new THREE.Vector3(0, 4.2, 7), new THREE.Vector3(0, 2.4, 2.4), new THREE.Vector3(0, 0.05, 0.001)
  ]);
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), lookIn = new THREE.Vector3(0, 0.05, -5);

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    const p = progress;
    const narrow = camera.aspect < 0.9;

    const fr = dt * 60;
    vel += (velTarget - vel) * (1 - Math.pow(0.92, fr)); velTarget *= Math.pow(0.9, fr);
    pxs += (px - pxs) * (1 - Math.pow(0.95, fr)); pys += (py - pys) * (1 - Math.pow(0.95, fr));

    // choreography
    const e = calm ? 0 : easeInOut(smooth(0.0, 0.3, p));
    const inner = calm ? 0 : clamp((p - 0.32) / 0.5) * CHAPTER_STEPS;
    const k = Math.floor(inner), f = inner - k;
    const chapterRot = (k + smooth(0.18, 0.82, f)) * STEP;
    const exit = calm ? 0 : smooth(0.84, 1, p);

    if (!calm) idle += dt * 0.16 * (1 - smooth(0, 0.04, p));
    const snapped = Math.round(idle / STEP) * STEP;
    ring.rotation.y = Math.PI + lerp(idle, snapped, e) - chapterRot;

    // camera along the path, with a wider view on phones
    path.getPoint(e, camPos);
    if (narrow) camPos.z += (1 - e) * 7, camPos.y += (1 - e) * 1.2;
    camPos.x += pxs * 0.55 * (1 - e * 0.6);
    camPos.y += -pys * 0.35;
    camera.position.copy(camPos);
    const out = new THREE.Vector3(narrow ? 0 : -3.1, narrow ? -2.2 : -0.9, 0);
    look.copy(out).lerp(lookIn, smooth(0.35, 1, e));
    look.x += pxs * 0.3 * e;
    camera.lookAt(look);
    const fovTarget = narrow ? lerp(50, 72, e) : lerp(42, 54, e);
    if (Math.abs(camera.fov - fovTarget) > 0.01) { camera.fov = fovTarget; camera.updateProjectionMatrix(); }

    // panels
    let best = 0, bestDot = -2;
    panels.forEach((pn, i) => {
      const world = pn.u.uTheta.value + ring.rotation.y;
      const facing = -Math.cos(world); // 1 when the panel sits at -z (in front of the inner camera)
      if (facing > bestDot) { bestDot = facing; best = i; }
      const light = lerp(0.9 + 0.1 * Math.cos(world - 0.6), smooth(0.4, 1, facing), e);
      const radius = R + exit * 7 + Math.sin(t * 0.8 + i) * 0.04 * (1 - e);
      for (const u of [pn.u, pn.mu]) {
        u.uLight.value = light;
        u.uRadius.value = radius;
        u.uVel.value = vel;
        u.uOpacity.value = 1 - exit;
      }
    });
    if (best !== chapter) { chapter = best; onChapter(chapter, PANELS[best][1]); }

    dust.rotation.y = t * 0.02;
    dust.position.y = Math.sin(t * 0.3) * 0.2;
    dust.material.opacity = 0.75 * (1 - exit * 0.7);
    floor.material.opacity = 1 - e * 0.5;

    renderer.render(scene, camera);
  }

  resize();
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', ev => {
    if (calm || ev.pointerType === 'touch') return;
    px = ev.clientX / innerWidth - 0.5; py = ev.clientY / innerHeight - 0.5;
  }, { passive: true });

  function intro() {
    if (introStarted) return;
    introStarted = true;
    panels.forEach((pn, i) => {
      const delay = calm ? 0 : 0.15 + i * 0.08;
      const target = { v: 0 };
      window.gsap.to(target, {
        v: 1, duration: calm ? 0.01 : 1.8, delay, ease: 'expo.out',
        onUpdate: () => { pn.u.uIntro.value = target.v; pn.mu.uIntro.value = target.v; }
      });
    });
  }

  return {
    ready,
    names: PANELS.map(p => p[1]),
    start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); },
    intro,
    setProgress(v) { progress = clamp(v); },
    setVelocity(v) { velTarget = clamp(v / 40, -1.2, 1.2); },
    setVisible(v) { visible = v; if (v) last = performance.now(); },
    setCalm(v) { calm = v; if (v) { px = py = 0; } }
  };
}
